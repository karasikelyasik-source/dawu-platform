const { spawn } = require('child_process');
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let updateWindow;
let printing = false;
let nextServerProcess = null;

function startNextServer() {
  const isDev = !app.isPackaged;

  if (isDev) {
    return;
  }

  const logPath = path.join(app.getPath('userData'), 'startup.log');

  fs.writeFileSync(logPath, '');

 const nextPath = path.join(
  process.resourcesPath,
  'standalone',
  'server.js',
);

  fs.appendFileSync(logPath, `NEXT PATH: ${nextPath}\n`);
  fs.appendFileSync(logPath, `EXISTS: ${fs.existsSync(nextPath)}\n`);
  fs.appendFileSync(logPath, `RESOURCES: ${process.resourcesPath}\n`);

  nextServerProcess = spawn(process.execPath, [nextPath], {
cwd: path.join(process.resourcesPath, 'standalone'),
env: {
  ...process.env,
  PORT: '3001',
  NODE_ENV: 'production',
  ELECTRON_RUN_AS_NODE: '1',
},
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  nextServerProcess.stdout.on('data', (data) => {
    fs.appendFileSync(logPath, `NEXT STDOUT: ${data.toString()}\n`);
  });

  nextServerProcess.stderr.on('data', (data) => {
    fs.appendFileSync(logPath, `NEXT STDERR: ${data.toString()}\n`);
  });

  nextServerProcess.on('error', (error) => {
    fs.appendFileSync(logPath, `NEXT ERROR: ${error.message}\n`);
  });

  nextServerProcess.on('exit', (code) => {
    fs.appendFileSync(logPath, `NEXT EXIT: ${code}\n`);
  });
}

function waitForServer(url, retries = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = async () => {
      try {
        const res = await fetch(url);

        if (res.ok) {
          resolve(true);
          return;
        }
      } catch (error) {}

      attempts++;

      if (attempts >= retries) {
        reject(new Error('Next server did not start'));
        return;
      }

      setTimeout(check, 500);
    };

    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'DaWu POS',
    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const startUrl = 'http://localhost:3001';


function createUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus();
    return;
  }

  updateWindow = new BrowserWindow({
    width: 520,
    height: 420,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'DaWu POS Update',
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    parent: mainWindow,
    modal: false,
 webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
},
  });

  updateWindow.on('closed', () => {
    updateWindow = null;
  });
}

function updateWindowHtml(state) {
  const percent = Math.round(state.percent || 0);
  const total = state.total || '';
  const transferred = state.transferred || '';
  const version = state.version || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top, #18181b, #09090b 65%);
      color: white;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden;
    }
    .wrap {
      height: 100vh;
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    .icon {
      width: 84px;
      height: 84px;
      margin: 0 auto 26px;
      border-radius: 50%;
      background: #202126;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 26px;
    }
    p {
      margin: 0;
      color: #b8bcc7;
      font-size: 16px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      margin-top: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      background: #27272a;
      font-weight: 700;
    }
    .progressBox {
      margin-top: 28px;
    }
    .bar {
      height: 10px;
      background: #27272a;
      border-radius: 999px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      width: ${percent}%;
      background: white;
      border-radius: 999px;
      transition: width .25s ease;
    }
    .meta {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #b8bcc7;
      font-size: 14px;
    }
    .actions {
      margin-top: 34px;
      display: flex;
      gap: 14px;
      justify-content: center;
    }
    button {
      width: 170px;
      height: 52px;
      border: 0;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .primary {
      background: white;
      color: black;
    }
    .secondary {
      background: #27272a;
      color: white;
    }
  </style>
</head>
<body>
  <div class="wrap">
    ${
      state.type === 'checking'
        ? `
          <div class="icon">🔍</div>
          <h1>Checking for updates</h1>
          <p>Looking for a new DaWu POS version...</p>
        `
        : ''
    }

    ${
      state.type === 'available'
        ? `
          <div class="icon">⬇</div>
          <h1>New version available</h1>
          <p>Version <b>${version}</b>${total ? ` • ${total}` : ''}</p>
          <p>Do you want to download the update now?</p>
          <div class="actions">
            <button class="secondary" onclick="window.close()">Later</button>
          <button class="primary" onclick="window.dawu.downloadUpdate()">Download</button>
          </div>
        `
        : ''
    }

    ${
      state.type === 'downloading'
        ? `
          <div class="icon">⬇</div>
          <h1>Downloading update</h1>
          <p>${total}</p>
          <div class="progressBox">
            <div class="bar"><div class="fill"></div></div>
            <div class="meta">
              <span>${transferred} of ${total}</span>
              <b>${percent}%</b>
            </div>
          </div>
        `
        : ''
    }

    ${
      state.type === 'downloaded'
        ? `
          <div class="icon">✓</div>
          <h1>Update downloaded</h1>
          <p>The update is ready to install.</p>
          <p>Restart DaWu POS now?</p>
          <div class="actions">
            <button class="secondary" onclick="window.close()">Later</button>
           <button class="primary" onclick="window.dawu.installUpdate()">Restart</button>
          </div>
        `
        : ''
    }

    ${
      state.type === 'none'
        ? `
          <div class="icon">✓</div>
          <h1>You are up to date</h1>
          <p>You are using the latest DaWu POS version.</p>
        `
        : ''
    }

    ${
      state.type === 'error'
        ? `
          <div class="icon">!</div>
          <h1>Update check failed</h1>
          <p>${state.message || 'Could not check for updates.'}</p>
        `
        : ''
    }
  </div>
</body>
</html>
`;
}


function showUpdateWindow(state) {
  createUpdateWindow();
  updateWindow.loadURL(
    'data:text/html;charset=utf-8,' +
      encodeURIComponent(updateWindowHtml(state)),
  );
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '';

  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function setupAutoUpdater() {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    showUpdateWindow({
      type: 'checking',
    });
  });

  autoUpdater.on('update-available', async (info) => {
    showUpdateWindow({
      type: 'available',
      version: info.version,
      total: formatBytes(info.files?.[0]?.size),
    });
  });

  autoUpdater.on('update-not-available', () => {
    showUpdateWindow({
      type: 'none',
    });

    setTimeout(() => {
      if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.close();
      }
    }, 2200);
  });

  autoUpdater.on('download-progress', (progress) => {
    showUpdateWindow({
      type: 'downloading',
      percent: progress.percent,
      total: formatBytes(progress.total),
      transferred: formatBytes(progress.transferred),
    });
  });

  autoUpdater.on('update-downloaded', () => {
    showUpdateWindow({
      type: 'downloaded',
    });
  });

  autoUpdater.on('error', (error) => {
    showUpdateWindow({
      type: 'error',
      message: error.message,
    });
  });

  autoUpdater.checkForUpdates();
}

  waitForServer(startUrl)
    .then(() => {
      mainWindow.loadURL(startUrl);

if (app.isPackaged) {
  setupAutoUpdater();
}
    })
    .catch((error) => {
      console.log('Failed to start Next server:', error.message);

      mainWindow.loadURL(
        'data:text/html;charset=utf-8,' +
          encodeURIComponent(
            '<h1>DaWu POS failed to start</h1><p>Please restart the app.</p>',
          ),
      );
    });

  startKitchenPrinterWatcher();

   // mainWindow.webContents.openDevTools();
}

function ticketHtml(ticket) {
  const date = new Date(ticket.createdAt);

  const time = date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  const formattedDate = `${time} ${day}/${month}/${year}`;

  const tableName = ticket.tableNumber
    ? `A${ticket.tableNumber}`
    : 'A-';

  return `
<html>
  <body style="
    margin:0;
    padding:0;
    width:58mm;
    background:white;
    color:black;
    font-family:monospace;
  ">
    <div style="
      width:100%;
      text-align:center;
      font-size:22px;
      line-height:1.2;
      padding:0.2mm 2mm 0 2mm;
    ">
      <div>
        ${tableName} &nbsp;&nbsp;&nbsp; ${tableName}
      </div>

      <div style="margin-top:4px;">
        ${formattedDate}
      </div>

      <div style="
        margin-top:6px;
        border-top:1px dashed black;
      "></div>

      <div style="
        margin-top:8px;
        font-weight:bold;
      ">
        1 x ${ticket.itemName}
      </div>
    </div>
  </body>
</html>
`;
}

async function printTicket(ticket) {
  return new Promise((resolve) => {
    const printWindow = new BrowserWindow({
      show: false,
   webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
},
    });

    const html = ticketHtml(ticket);
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    printWindow.loadURL(url);

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print(
       {
  silent: true,
  printBackground: false,
  deviceName: ticket.printerName || undefined,
  margins: {
    marginType: 'none',
  },
  pageSize: {
    width: 58000,
    height: 280000,
  },
},
        async (success, errorType) => {
          console.log('KITCHEN PRINT:', success, errorType);

          printWindow.close();

          if (success) {
            await fetch(
              `http://31.57.201.45:3000/tables/kitchen-tickets/${ticket.id}/printed`,
              {
                method: 'PATCH',
              },
            );
          }

          resolve();
        },
      );
    });
  });
}

function startKitchenPrinterWatcher() {
  setInterval(async () => {
    if (printing) return;

    try {
      printing = true;

      const res = await fetch(
        'http://31.57.201.45:3000/tables/kitchen-tickets/pending',
      );

      const tickets = await res.json();

     if (Array.isArray(tickets) && tickets.length > 0) {
  await Promise.all(
    tickets.map((ticket) => printTicket(ticket)),
  );
}
    } catch (error) {
      console.log('Kitchen printer watcher error:', error.message);
    } finally {
      printing = false;
    }
  }, 3000);
}

ipcMain.on('print-check', () => {
  console.log('PRINT EVENT RECEIVED');

  if (!mainWindow) return;

  mainWindow.webContents.print(
    {
      silent: false,
      printBackground: true,
    },
    (success, errorType) => {
      console.log('PRINT RESULT:', success, errorType);
    },
  );
});

function receiptHtml(data) {
  const now = new Date();

  const formattedDate = now.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const selectedPackages = data.selectedPackages || [];
  const orders = data.orders || [];
  const paymentMethod = data.paymentMethod || 'CASH';
  const paid = Number(data.paid || 0);
  const change = Number(data.change || 0);

  const packageTotal = selectedPackages.reduce(
    (sum, item) => sum + item.price * item.guests,
    0,
  );

  const ordersTotal = orders.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  const total = packageTotal + ordersTotal;

const btwGroups = {};

selectedPackages.forEach((item) => {
  const rate = item.btwRate ?? 9;

  const itemTotal = item.price * item.guests;

  const btwAmount =
    itemTotal - itemTotal / (1 + rate / 100);

  if (!btwGroups[rate]) {
    btwGroups[rate] = 0;
  }

  btwGroups[rate] += btwAmount;
});

orders.forEach((item) => {
  const rate = item.btwRate ?? 9;

  const itemTotal = Number(item.price);

  const btwAmount =
    itemTotal - itemTotal / (1 + rate / 100);

  if (!btwGroups[rate]) {
    btwGroups[rate] = 0;
  }

  btwGroups[rate] += btwAmount;
});


  const packageBtwTotal = selectedPackages.reduce(
  (sum, item) => {
    const rate = item.btwRate ?? 9;
    const itemTotal = item.price * item.guests;
    return sum + itemTotal - itemTotal / (1 + rate / 100);
  },
  0,
);

const ordersBtwTotal = orders.reduce(
  (sum, item) => {
    const rate = item.btwRate ?? 9;
    return sum + item.price - item.price / (1 + rate / 100);
  },
  0,
);

const btwTotal = packageBtwTotal + ordersBtwTotal;

  return `
  <html>
    <body style="
  margin:0;
  padding:0;
  background:white;
  color:black;
  font-family:'Segoe UI', 'Helvetica Neue', monospace;
-webkit-font-smoothing: antialiased;
text-rendering: geometricPrecision;
font-smooth: always;
">
     <div style="
  width:68mm;
  margin:0 auto;
  padding:4px 4px;
  font-size:13px;
">

        <div style="text-align:center;">
          <div style="
            font-size:13px;
            font-weight:900;
            letter-spacing:2px;
          ">
            PLAFORMA
          </div>

          <div style="
            margin-top:8px;
            font-size:13px;
            font-weight:bold;
          ">
            Da Wu Sushi Fusion Restaurant
          </div>

          <div style="margin-top:4px;">
            Meerstraat 90
          </div>

          <div>
            1941JD Beverwijk
          </div>

          <div>
            Tel. 0251-501519
          </div>

          <div>
            Btw: NL868696882B01
          </div>

          <div>
            Bank: NL02INGB0117582026
          </div>

          <div>
            Shimane Horeca B.V
          </div>
        </div>

        <div style="
          border-top:1px dashed black;
          margin:10px 0;
        "></div>

        <div style="
          text-align:center;
          font-size:13px;
          font-weight:bold;
        ">
          Totale bon
        </div>

        <div style="
          border-top:1px dashed black;
          margin:10px 0;
        "></div>

        <div style="
          display:grid;
          grid-template-columns: 1fr auto;
          gap:6px;
          margin-bottom:4px;
          font-size:13px;
        ">
          <span>${formattedDate}</span>
          <span><b>TAFEL ${data.tableNumber}</b></span>
        </div>

        <div style="
          border-top:1px dashed black;
          margin:10px 0;
        "></div>

        <div style="
          display:grid;
          grid-template-columns: 1fr 60px;
          gap:6px;
          font-weight:bold;
          margin-bottom:8px;
          font-size:13px;
        ">
          <span>Item</span>
          <span style="text-align:right;">Prijs</span>
        </div>

        ${selectedPackages
          .map(
            (item) => `
              <div style="
                display:grid;
                grid-template-columns: 1fr 60px;
                gap:6px;
                margin-bottom:6px;
                font-size:13px;
                align-items:start;
              ">
                <span style="
                  word-break:break-word;
                  overflow-wrap:anywhere;
                  line-height:1.25;
                ">
                  ${item.guests}x ${item.name}
                </span>

                <span style="
                  text-align:right;
                  white-space:nowrap;
                ">
                  €${(item.price * item.guests).toFixed(2)}
                </span>
              </div>
            `,
          )
          .join('')}

        ${orders
          .map(
            (item) => `
              <div style="
                display:grid;
                grid-template-columns: 1fr 60px;
                gap:6px;
                margin-bottom:6px;
                font-size:13px;
                align-items:start;
              ">
                <span style="
                  word-break:break-word;
                  overflow-wrap:anywhere;
                  line-height:1.25;
                ">
                  1x ${item.name}
                </span>

                <span style="
                  text-align:right;
                  white-space:nowrap;
                ">
                  €${Number(item.price).toFixed(2)}
                </span>
              </div>
            `,
          )
          .join('')}

        <div style="
          border-top:1px dashed black;
          margin:12px 0 8px;
        "></div>

        <div style="
          display:grid;
          grid-template-columns: 1fr auto;
          gap:6px;
          align-items:center;
          font-size:16px;
          font-weight:900;
        ">
          <span>Totaal</span>

          <span>
            €${total.toFixed(2)}
          </span>
        </div>

        <div style="
  margin-top:10px;
  font-size:11px;
">

<div style="
  margin-top:10px;
  font-size:11px;
">
  Total:
  <strong>
    €${total.toFixed(2)}
  </strong>
</div>

<div style="
  margin-top:4px;
  font-size:11px;
">
  Payment:
  <strong>
    ${paymentMethod === 'CARD' ? 'PIN' : 'CASH'}
  </strong>
</div>

<div style="
  margin-top:4px;
  font-size:11px;
">
  Paid:
  €${paid.toFixed(2)}
</div>

${
  paymentMethod === 'CASH'
    ? `
      <div style="
        margin-top:4px;
        font-size:11px;
      ">
        Change:
        €${change.toFixed(2)}
      </div>
    `
    : ''
}

        ${Object.entries(btwGroups)
  .map(
    ([rate, amount]) => `
      <div style="
        display:grid;
        grid-template-columns: 1fr auto;
        gap:6px;
        margin-top:4px;
        font-size:10px;
      ">
        <span>BTW ${rate}%</span>

        <span>
          €${Number(amount).toFixed(2)}
        </span>
      </div>
    `,
  )
  .join('')}

        <div style="
          border-top:1px dashed black;
          margin:12px 0;
        "></div>

        <div style="
          text-align:center;
          font-size:10px;
          font-weight:bold;
        ">
          Afhalen & bezorgen is ook mogelijk!
        </div>

        <div style="
          text-align:center;
          margin-top:10px;
          font-size:10px;
        ">
          Bedankt voor uw bezoek ❤️
        </div>

      </div>
    </body>
  </html>
  `;
}

ipcMain.handle('print-receipt', async (_, data) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = receiptHtml(data);
  const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

  await printWindow.loadURL(url);

  return new Promise((resolve) => {
    function printOneCopy() {
      return new Promise((copyResolve) => {
        printWindow.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: data.receiptPrinter || undefined,
            margins: {
              marginType: 'none',
            },
            pageSize: {
              width: 80000,
              height: 300000,
            },
          },
          (success, errorType) => {
            console.log('RECEIPT COPY PRINT:', success, errorType);
            copyResolve(true);
          },
        );
      });
    }

    printOneCopy().then(() => {
      setTimeout(() => {
        printOneCopy().then(() => {
          printWindow.close();
          resolve({ success: true });
        });
      }, 500);
    });
  });
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
  }

  app.removeAllListeners('window-all-closed');

  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 300);
});

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];

  const printers = await mainWindow.webContents.getPrintersAsync();

  return printers.map((printer) => ({
    name: printer.name,
    displayName: printer.displayName || printer.name,
    isDefault: printer.isDefault || false,
  }));
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  startNextServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
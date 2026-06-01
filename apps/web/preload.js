const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dawu', {
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dawu', {
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
});

window.addEventListener('message', (event) => {
  if (event.data === 'download-update') {
    ipcRenderer.send('download-update');
  }

  if (event.data === 'install-update') {
    ipcRenderer.send('install-update');
  }
});
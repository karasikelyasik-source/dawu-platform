const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dawu', {
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rsvpDesktop', {
  setOpacity: (opacity) => ipcRenderer.send('window:set-opacity', opacity),
  flashWindow: () => ipcRenderer.send('window:flash')
});

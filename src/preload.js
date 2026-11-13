const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rsvpDesktop', {
  setOpacity: (opacity) => ipcRenderer.send('window:set-opacity', opacity),
  setMonitorAlwaysOnTop: (enabled) => ipcRenderer.send('window:set-monitor-always-on-top', enabled),
  flashWindow: () => ipcRenderer.send('window:flash')
});

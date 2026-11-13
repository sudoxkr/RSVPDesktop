const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rsvpDesktop', {
  setOpacity: (opacity) => ipcRenderer.send('window:set-opacity', opacity),
  setMonitorAlwaysOnTop: (enabled) => ipcRenderer.send('window:set-monitor-always-on-top', enabled),
  setMonitorClickThrough: (enabled) => ipcRenderer.send('window:set-monitor-click-through', enabled),
  flashWindow: () => ipcRenderer.send('window:flash')
});

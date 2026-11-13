const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

const windows = new Set();
const flashTimeouts = new Map();
let monitorWindow = null;

function stopWindowFlash(window) {
  const timeout = flashTimeouts.get(window);
  if (timeout) clearTimeout(timeout);
  flashTimeouts.delete(window);
  if (!window.isDestroyed()) window.flashFrame(false);
}

function isKnownWindow(sender) {
  return [...windows].some((window) => !window.isDestroyed() && window.webContents === sender);
}

function createWindow(file, options) {
  const window = new BrowserWindow({
    backgroundColor: '#f6f7fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    ...options
  });

  windows.add(window);
  window.loadFile(path.join(__dirname, file));
  window.on('closed', () => {
    stopWindowFlash(window);
    windows.delete(window);
    if (window === monitorWindow) monitorWindow = null;
  });
  return window;
}

function createWindows() {
  createWindow('index.html', {
    width: 560,
    height: 900,
    minWidth: 460,
    minHeight: 650,
    resizable: true,
    title: 'RSVP Desktop — Configure alarms'
  });

  monitorWindow = createWindow('monitor.html', {
    width: 430,
    height: 560,
    minWidth: 350,
    minHeight: 360,
    resizable: true,
    title: 'RSVP Desktop — Alarms'
  });
}

ipcMain.on('window:set-opacity', (event, opacity) => {
  if (!isKnownWindow(event.sender) || !Number.isFinite(opacity)) return;
  const value = Math.min(1, Math.max(0.5, opacity));
  for (const window of windows) {
    if (!window.isDestroyed()) window.setOpacity(value);
  }
});

ipcMain.on('window:set-monitor-always-on-top', (event, enabled) => {
  if (!isKnownWindow(event.sender) || typeof enabled !== 'boolean') return;
  if (monitorWindow && !monitorWindow.isDestroyed()) monitorWindow.setAlwaysOnTop(enabled);
});

ipcMain.on('window:set-monitor-click-through', (event, enabled) => {
  if (!isKnownWindow(event.sender) || typeof enabled !== 'boolean') return;
  if (monitorWindow && !monitorWindow.isDestroyed()) {
    // Forward pointer events through the overlay to the next window underneath.
    monitorWindow.setIgnoreMouseEvents(enabled, enabled ? { forward: true } : undefined);
  }
});

ipcMain.on('window:flash', (event) => {
  if (!isKnownWindow(event.sender)) return;
  for (const window of windows) {
    if (window.isDestroyed()) continue;
    stopWindowFlash(window);
    window.flashFrame(true);
    flashTimeouts.set(window, setTimeout(() => stopWindowFlash(window), 5000));
  }
});

app.whenReady().then(() => {
  createWindows();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  for (const window of windows) stopWindowFlash(window);
});

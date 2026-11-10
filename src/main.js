const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let reminderWindow;
let flashTimeout;

function stopWindowFlash() {
  if (flashTimeout) {
    clearTimeout(flashTimeout);
    flashTimeout = null;
  }
  if (reminderWindow && !reminderWindow.isDestroyed()) {
    reminderWindow.flashFrame(false);
  }
}

function createWindow() {
  reminderWindow = new BrowserWindow({
    width: 460,
    height: 500,
    minWidth: 420,
    minHeight: 470,
    resizable: true,
    title: 'RSVP Desktop',
    backgroundColor: '#f6f7fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  reminderWindow.loadFile(path.join(__dirname, 'index.html'));
  reminderWindow.on('closed', () => {
    stopWindowFlash();
    reminderWindow = null;
  });
}

ipcMain.on('window:set-opacity', (event, opacity) => {
  if (event.sender === reminderWindow?.webContents && Number.isFinite(opacity)) {
    reminderWindow.setOpacity(Math.min(1, Math.max(0.5, opacity)));
  }
});

ipcMain.on('window:flash', (event) => {
  if (event.sender !== reminderWindow?.webContents || !reminderWindow) return;

  stopWindowFlash();
  reminderWindow.flashFrame(true);
  flashTimeout = setTimeout(stopWindowFlash, 5000);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopWindowFlash);

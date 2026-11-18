// BIOMOTOR Sport and Fitness — desktop app (Windows / Mac / Linux)
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 380, minHeight: 600,
    title: 'BIOMOTOR', backgroundColor: '#f6f6f7', autoHideMenuBar: true,
    icon: path.join(__dirname, 'www', 'assets', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
  // web links (WhatsApp, UPI, GitHub…) open in the normal browser; print windows stay inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto|tel|upi|whatsapp):/i.test(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(() => { if (process.platform !== 'darwin') Menu.setApplicationMenu(null); createWindow(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

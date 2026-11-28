// BIOMOTOR Sport and Fitness — desktop app (Windows / Mac / Linux)
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 380, minHeight: 600,
    title: 'BIOMOTOR', backgroundColor: '#f6f6f7', autoHideMenuBar: true,
    icon: path.join(__dirname, 'www', 'assets', 'icons', 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  // Privacy (like Google Pay): screenshots and screen recordings show a black window (Windows + Mac)
  win.setContentProtection(true);
  // open the live platform, so every platform update reaches the desktop app at once; without internet the copy inside the app opens
  const LIVE = 'https://app.biomotorsports.com/', local = () => win.loadFile(path.join(__dirname, 'www', 'index.html'));
  let usedLocal = false;
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && code !== -3 && !usedLocal && String(url).startsWith(LIVE)) { usedLocal = true; local(); } });
  win.loadURL(LIVE);
  // links to other websites open in the normal browser, the platform itself stays in the app
  win.webContents.on('will-navigate', (e, url) => { if (/^https?:/i.test(url) && !url.startsWith(LIVE)) { e.preventDefault(); shell.openExternal(url); } });
  // web links (WhatsApp, UPI, GitHub…) open in the normal browser; print windows stay inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto|tel|upi|whatsapp):/i.test(url) && !url.startsWith('https://app.biomotorsports.com/')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  win.webContents.on('did-create-window', w => { try { w.setContentProtection(true); } catch (e) {} });
  // Bluetooth sensors (Device Nexus – Polar H10 and other heart-rate straps): Electron has no device chooser of its own,
  // so collect the devices found for 4 seconds and let the user pick one
  let btCb = null, btList = [], btTimer = null;
  win.webContents.on('select-bluetooth-device', (event, list, callback) => {
    event.preventDefault();
    if (btCb !== callback) { btCb = callback; btList = []; clearTimeout(btTimer);
      btTimer = setTimeout(async () => {
        const cb = btCb; btCb = null; const L = btList.slice(0, 8);
        if (!L.length) { await dialog.showMessageBox(win, { type: 'info', message: 'No Bluetooth sensor found', detail: 'Wet the strap, put it on (the sensor wakes up on skin) and make sure Bluetooth is on. Then tap Connect again.' }); cb(''); return; }
        const r = await dialog.showMessageBox(win, { type: 'question', message: 'Choose the sensor', detail: 'The ID printed on the sensor is part of its name.', buttons: [...L.map(d => d.deviceName || d.deviceId), 'Cancel'], cancelId: L.length });
        cb(r.response < L.length ? L[r.response].deviceId : '');
      }, 4000); }
    list.forEach(d => { if (!btList.some(x => x.deviceId === d.deviceId)) btList.push(d); });
  });
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(() => { if (process.platform !== 'darwin') Menu.setApplicationMenu(null); createWindow(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

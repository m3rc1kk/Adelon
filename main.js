const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ogu = require('./ogu');
const { autoUpdater } = require('electron-updater');

app.setName('Adelon');

function fixUserDataCase() {
  try {
    const roaming = app.getPath('appData');
    const entries = fs.readdirSync(roaming);
    const existing = entries.find(e => e.toLowerCase() === 'adelon');
    if (existing && existing !== 'Adelon') {
      const tmp = path.join(roaming, 'Adelon_casefix_' + Date.now());
      fs.renameSync(path.join(roaming, existing), tmp);
      fs.renameSync(tmp, path.join(roaming, 'Adelon'));
    }
  } catch (_) {}
}
fixUserDataCase();

const DATA_FILE = path.join(app.getPath('userData'), 'adelon-data.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to write data:', e);
    return false;
  }
}

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 720,
    minHeight: 600,
    backgroundColor: '#F4F1EB',
    title: 'Adelon',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow = win;
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

function sendUpdate(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update:status', payload);
  }
}

function extractNotes(info) {
  const rn = info && info.releaseNotes;
  if (!rn) return '';
  if (typeof rn === 'string') return rn;
  if (Array.isArray(rn)) return rn.map((n) => (n && n.note) || '').filter(Boolean).join('\n\n');
  return String(rn);
}

function setupAutoUpdate() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    sendUpdate({ status: 'available', version: info.version, notes: extractNotes(info) });
  });
  autoUpdater.on('download-progress', (p) => {
    sendUpdate({ status: 'downloading', percent: Math.round(p.percent) });
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdate({ status: 'ready', version: info.version });
  });
  autoUpdater.on('error', (err) => {
    sendUpdate({ status: 'error', error: String(err && err.message || err) });
  });

  autoUpdater.checkForUpdates().catch(() => {});
}

ipcMain.handle('update:download', () => {
  if (app.isPackaged) autoUpdater.downloadUpdate().catch(() => {});
});

ipcMain.handle('update:install', () => {
  if (app.isPackaged) autoUpdater.quitAndInstall(true, true);
});

ipcMain.handle('data:load', () => readData());
ipcMain.handle('data:save', (_e, data) => writeData(data));

const oguHandler = (fn) => async (_e, ...args) => {
  try { return { ok: true, data: await fn(...args) }; }
  catch (err) { return { ok: false, error: String(err && err.message || err) }; }
};
ipcMain.handle('ogu:divisions', oguHandler(() => ogu.divisions()));
ipcMain.handle('ogu:courses', oguHandler((div) => ogu.courses(div)));
ipcMain.handle('ogu:groups', oguHandler((div, kurs) => ogu.groups(div, kurs)));
ipcMain.handle('ogu:schedule', oguHandler((group) => ogu.schedule(group)));

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdate();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

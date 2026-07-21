const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

ipcMain.on('app:version', (e) => { e.returnValue = app.getVersion(); });

ipcMain.handle('update:download', () => {
  if (app.isPackaged) autoUpdater.downloadUpdate().catch(() => {});
});

ipcMain.handle('update:install', () => {
  if (!app.isPackaged) return;
  // Снимаем обработчик выхода и закрываем окна сами, иначе установщик ждёт,
  // пока приложение освободит файлы, — из-за этого перезапуск тянется долго.
  app.removeAllListeners('window-all-closed');
  for (const w of BrowserWindow.getAllWindows()) w.destroy();
  setImmediate(() => autoUpdater.quitAndInstall(true, true));
});

ipcMain.handle('data:load', () => readData());
ipcMain.handle('data:save', (_e, data) => writeData(data));

// Excel в русской локали сохраняет обычный CSV в windows-1251, поэтому кириллица
// в присланном файле может прийти не в UTF-8 — распознаём кодировку по факту.
function decodeText(buf) {
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return buf.slice(3).toString('utf-8');
  const utf8 = buf.toString('utf-8');
  if (!utf8.includes('�')) return utf8;
  try { return new TextDecoder('windows-1251').decode(buf); } catch (_) { return utf8; }
}

ipcMain.handle('file:saveText', async (_e, payload) => {
  const { defaultName, text } = payload || {};
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const res = await dialog.showSaveDialog(win, {
    title: 'Экспорт в CSV',
    defaultPath: defaultName || 'adelon.csv',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(res.filePath, text, 'utf-8');
    return { ok: true, name: path.basename(res.filePath) };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

ipcMain.handle('file:openText', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const res = await dialog.showOpenDialog(win, {
    title: 'Импорт из CSV',
    properties: ['openFile'],
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (res.canceled || !res.filePaths.length) return { ok: false, canceled: true };
  try {
    const buf = fs.readFileSync(res.filePaths[0]);
    return { ok: true, text: decodeText(buf), name: path.basename(res.filePaths[0]) };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

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

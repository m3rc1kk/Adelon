const { contextBridge, ipcRenderer } = require('electron');

let appVersion = '';
try { appVersion = ipcRenderer.sendSync('app:version'); } catch (_) {}

contextBridge.exposeInMainWorld('adelon', {
  version: appVersion,
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  file: {
    save: (defaultName, text) => ipcRenderer.invoke('file:saveText', { defaultName, text }),
    open: () => ipcRenderer.invoke('file:openText'),
  },
  ogu: {
    divisions: () => ipcRenderer.invoke('ogu:divisions'),
    courses: (div) => ipcRenderer.invoke('ogu:courses', div),
    groups: (div, kurs) => ipcRenderer.invoke('ogu:groups', div, kurs),
    schedule: (group) => ipcRenderer.invoke('ogu:schedule', group),
  },
  update: {
    onStatus: (cb) => ipcRenderer.on('update:status', (_e, payload) => cb(payload)),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
  },
});

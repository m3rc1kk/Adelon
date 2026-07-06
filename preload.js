const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('adelon', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  ogu: {
    divisions: () => ipcRenderer.invoke('ogu:divisions'),
    courses: (div) => ipcRenderer.invoke('ogu:courses', div),
    groups: (div, kurs) => ipcRenderer.invoke('ogu:groups', div, kurs),
    schedule: (group) => ipcRenderer.invoke('ogu:schedule', group),
  },
});

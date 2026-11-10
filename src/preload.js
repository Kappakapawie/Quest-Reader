'use strict';

// The only bridge between the window and the main process.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('questReader', {
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  updateSettings: (s) => ipcRenderer.invoke('update-settings', s),
  forgetReadQuests: () => ipcRenderer.invoke('forget-read-quests'),
  onQuestFound: (cb) => ipcRenderer.on('quest-found', (_e, text) => cb(text)),
  onScanStatus: (cb) => ipcRenderer.on('scan-status', (_e, status) => cb(status)),
});

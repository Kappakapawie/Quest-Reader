'use strict';

// Electron main process: takes screenshots, runs OCR on them, and sends any
// newly detected quest text to the window, which reads it aloud.

const path = require('path');
const { app, BrowserWindow, desktopCapturer, ipcMain, screen } = require('electron');
const { createWorker } = require('tesseract.js');
const engData = require('@tesseract.js-data/eng');
const { QuestTracker } = require('./questDetector');

let win = null;
let ocrWorker = null;
let timer = null;
let busy = false;
const tracker = new QuestTracker();
const settings = { intervalMs: 3000, displayId: null, minWords: 25, watching: false };

async function getOcrWorker() {
  if (!ocrWorker) {
    // Language data ships with the app, so OCR works offline.
    ocrWorker = await createWorker(engData.code, 1, {
      langPath: engData.langPath,
      gzip: engData.gzip,
      cachePath: app.getPath('userData'),
    });
  }
  return ocrWorker;
}

function chooseDisplay() {
  const displays = screen.getAllDisplays();
  return displays.find((d) => String(d.id) === String(settings.displayId)) || screen.getPrimaryDisplay();
}

async function captureScreen() {
  const display = chooseDisplay();
  const { width, height } = display.size;
  const f = display.scaleFactor || 1;
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: Math.round(width * f), height: Math.round(height * f) },
  });
  const source = sources.find((s) => s.display_id === String(display.id)) || sources[0];
  return source ? source.thumbnail.toPNG() : null;
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

async function scanOnce() {
  if (busy) return;
  busy = true;
  try {
    const png = await captureScreen();
    if (!png) return;
    const worker = await getOcrWorker();
    const { data } = await worker.recognize(png);
    const quest = tracker.push(data.text);
    send('scan-status', { at: Date.now(), found: Boolean(quest) });
    if (quest) send('quest-found', quest);
  } catch (err) {
    send('scan-status', { at: Date.now(), error: String(err && err.message ? err.message : err) });
  } finally {
    busy = false;
  }
}

function restartTimer() {
  clearInterval(timer);
  timer = null;
  if (settings.watching) {
    timer = setInterval(scanOnce, settings.intervalMs);
    scanOnce();
  }
}

ipcMain.handle('get-displays', () =>
  screen.getAllDisplays().map((d, i) => ({
    id: String(d.id),
    label: `Screen ${i + 1} (${d.size.width}×${d.size.height})${d.id === screen.getPrimaryDisplay().id ? ' – main' : ''}`,
  }))
);

ipcMain.handle('update-settings', (_e, next) => {
  const before = { ...settings };
  if (Number.isFinite(next.intervalMs)) settings.intervalMs = Math.max(1000, next.intervalMs);
  if ('displayId' in next) settings.displayId = next.displayId;
  if (Number.isFinite(next.minWords)) {
    settings.minWords = Math.max(5, next.minWords);
    tracker.setOptions({ minWords: settings.minWords });
  }
  if (typeof next.watching === 'boolean') settings.watching = next.watching;
  if (before.watching !== settings.watching || before.intervalMs !== settings.intervalMs) restartTimer();
  return { ...settings };
});

// Lets "Read it again" or a new screen re-trigger quests already read.
ipcMain.handle('forget-read-quests', () => tracker.reset());

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 720,
    minWidth: 380,
    title: 'Quest Reader',
    backgroundColor: '#1b1712',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  clearInterval(timer);
  if (ocrWorker) await ocrWorker.terminate().catch(() => {});
  if (process.platform !== 'darwin') app.quit();
});

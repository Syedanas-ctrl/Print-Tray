'use strict';

require('dotenv').config();

const { app } = require('electron');
const log = require('electron-log');

const { SERVER_PORT } = require('./config');
const { ensurePrintWindow } = require('./print-window');
const { startApiServer } = require('./api-server');

log.initialize({ preload: true });
app.disableHardwareAcceleration();

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  log.warn('Another instance is already running. Exiting.');
  app.quit();
}

app.on('second-instance', () => {
  log.info('Second instance attempt detected.');
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});
app.whenReady().then(async () => {
  try {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.zat.printtray');
    }

    app.setLoginItemSettings({ openAtLogin: true });
    await ensurePrintWindow();
    await startApiServer();

    log.info(`ZAT Tray ready on port ${SERVER_PORT}`);
  } catch (error) {
    log.error('Failed to initialise application', error);
    app.quit();
  }
});
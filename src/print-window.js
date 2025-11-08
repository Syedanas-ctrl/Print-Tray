'use strict';

const { BrowserWindow } = require('electron');
const log = require('electron-log');

let printWindow = null;

async function ensurePrintWindow() {
  if (printWindow && !printWindow.isDestroyed()) {
    return printWindow;
  }

  printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      offscreen: true
    }
  });

  printWindow.on('closed', () => {
    printWindow = null;
  });

  await printWindow.loadURL('about:blank');
  return printWindow;
}

module.exports = {
  ensurePrintWindow
};


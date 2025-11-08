'use strict';

const log = require('electron-log');
const si = require('systeminformation');

const { ensurePrintWindow } = require('./print-window');

let printQueue = Promise.resolve();

async function listPrinters() {
  try {
    const win = await ensurePrintWindow();
    const printers = await win.webContents.getPrintersAsync();

    if (Array.isArray(printers) && printers.length) {
      return printers.map((printer) => ({
        name: printer.name,
        description: printer.description,
        displayName: printer.displayName,
        isDefault: Boolean(printer.isDefault),
        status: printer.status,
        options: printer.options
      }));
    }
  } catch (error) {
    log.warn('Electron printer enumeration failed, falling back to systeminformation', error);
  }

  try {
    const fallback = await si.printer();
    if (Array.isArray(fallback)) {
      return fallback.map((printer) => ({
        name: printer.name,
        description: printer.model,
        isDefault: Boolean(printer.default),
        status: printer.status
      }));
    }
  } catch (error) {
    log.error('System printer enumeration failed', error);
  }

  return [];
}

function enqueuePrint(task) {
  const next = printQueue.then(task);
  printQueue = next.catch((error) => {
    log.error('Print queue task failed', error);
  });
  return next;
}

async function performPrintJob(payload) {
  const { html, url, printerName, copies, landscape, printBackground } = payload;

  if (!html && !url) {
    const error = new Error('Print payload must include either an html or url property.');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }

  const win = await ensurePrintWindow();

  if (url) {
    await win.loadURL(url, { userAgent: 'ZAT-Tray' });
  } else if (html) {
    const htmlEncoded = encodeURIComponent(html);
    const dataUrl = `data:text/html;charset=utf-8,${htmlEncoded}`;
    await win.loadURL(dataUrl);
  }

  return new Promise((resolve, reject) => {
    const printOptions = {
      silent: true,
      deviceName: printerName || undefined,
      landscape: Boolean(landscape),
      copies: copies && Number.isInteger(copies) ? copies : 1,
      printBackground: printBackground !== false
    };

    win.webContents.print(printOptions, (success, failureReason) => {
      if (success) {
        resolve(true);
        setImmediate(() => {
          win.loadURL('about:blank').catch((err) => {
            log.warn('Failed to reset print window after job', err);
          });
        });
      } else {
        const error = new Error(failureReason || 'Unknown print failure');
        error.code = 'PRINT_FAILED';
        reject(error);
      }
    });
  });
}

module.exports = {
  listPrinters,
  enqueuePrint,
  performPrintJob
};


'use strict';

const { shell } = require('electron');
const log = require('electron-log');
const si = require('systeminformation');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

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
  const { html, url, printerName, copies, landscape, printBackground, preview } = payload;

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

  // Preview mode: generate a PDF and open it in the OS viewer (Preview on macOS)
  if (preview) {
    try {
      const pdfData = await win.webContents.printToPDF({
        printBackground: printBackground !== false,
        landscape: Boolean(landscape)
      });

      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, `zat-print-preview-${Date.now()}.pdf`);
      fs.writeFileSync(filePath, pdfData);

      // Open the PDF with the default viewer (Preview on macOS)
      await shell.openPath(filePath);

      // Do not reset the window immediately – let the user inspect / print from Preview.
      return true;
    } catch (error) {
      log.error('Print preview failed', error);
      const err = new Error('Print preview failed');
      err.code = 'PREVIEW_FAILED';
      throw err;
    }
  }

  // Normal silent print to the selected printer
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


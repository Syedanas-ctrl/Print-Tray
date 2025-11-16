'use strict';

const log = require('electron-log');

/**
 * Performs a direct print to the selected printer.
 *
 * @param {object} win - Electron BrowserWindow instance
 * @param {object} options - Print options
 * @param {string} options.printerName - Name of the printer to use
 * @param {boolean} options.landscape - Whether to use landscape orientation
 * @param {number} options.copies - Number of copies to print
 * @param {boolean} options.printBackground - Whether to include background graphics
 * @returns {Promise<boolean>} Resolves to true when print job completes successfully
 * @throws {Error} If printing fails
 */
function performDirectPrint(win, options) {
  const { printerName, landscape, copies, printBackground } = options;

  return new Promise((resolve, reject) => {
    const printOptions = {
      silent: true,
      deviceName: printerName || undefined,
      landscape: Boolean(landscape),
      copies: copies && Number.isInteger(copies) ? copies : 1,
      printBackground: printBackground !== false
    };

    // Note: Electron's webContents.print() doesn't directly support margin options,
    // but CSS @page rules are already injected by preparePageForPrinting().
    // For thermal printers, marginType: 'none' or 'minimum' is recommended.

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
  performDirectPrint
};


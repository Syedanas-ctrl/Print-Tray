'use strict';

const log = require('electron-log');
const si = require('systeminformation');
const { ensurePrintWindow } = require('../print-window');

/**
 * Lists all available printers on the system.
 * Tries Electron's printer enumeration first, falls back to systeminformation.
 *
 * @returns {Promise<Array>} Array of printer objects with name, description, etc.
 */
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

module.exports = {
  listPrinters
};


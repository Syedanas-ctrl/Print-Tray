'use strict';

const { shell } = require('electron');
const log = require('electron-log');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { buildPDFMarginOptions } = require('../utils/margins');

/**
 * Generates a PDF preview and opens it in the system's default PDF viewer.
 *
 * @param {object} win - Electron BrowserWindow instance
 * @param {object} options - Print options
 * @param {boolean} options.printBackground - Whether to include background graphics
 * @param {boolean} options.landscape - Whether to use landscape orientation
 * @param {string} options.marginType - Margin type: 'none', 'minimum', 'default', or 'custom'
 * @param {object} options.margins - Custom margins object (used when marginType is 'custom')
 * @returns {Promise<boolean>} Resolves to true when PDF is generated and opened
 * @throws {Error} If PDF generation fails
 */
async function generatePDFPreview(win, options) {
  const { printBackground, landscape, marginType, margins } = options;

  try {
    const pdfOptions = {
      printBackground: printBackground !== false,
      landscape: Boolean(landscape),
      ...buildPDFMarginOptions(marginType, margins)
    };

    const pdfData = await win.webContents.printToPDF(pdfOptions);

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

module.exports = {
  generatePDFPreview
};


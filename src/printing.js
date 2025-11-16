'use strict';

const { ensurePrintWindow } = require('./print-window');
const { listPrinters } = require('./printing/printer-enumeration');
const { enqueuePrint } = require('./printing/print-queue');
const { preparePageForPrinting } = require('./printing/page-loader');
const { generatePDFPreview } = require('./printing/pdf-preview');
const { performDirectPrint } = require('./printing/direct-print');

/**
 * Validates the print job payload.
 *
 * @param {object} payload - Print job payload
 * @throws {Error} If payload is invalid
 */
function validatePayload(payload) {
  const { html, url } = payload;
  
  if (!html && !url) {
    const error = new Error('Print payload must include either an html or url property.');
    error.code = 'INVALID_PAYLOAD';
    throw error;
  }
}

/**
 * Performs a print job based on the provided payload.
 * Handles both PDF preview and direct printing to a printer.
 *
 * @param {object} payload - Print job configuration
 * @param {string} payload.html - HTML content to print (mutually exclusive with url)
 * @param {string} payload.url - URL to load and print (mutually exclusive with html)
 * @param {string} payload.printerName - Optional printer name
 * @param {number} payload.copies - Number of copies (defaults to 1)
 * @param {boolean} payload.landscape - Print orientation (defaults to false)
 * @param {boolean} payload.printBackground - Include CSS backgrounds (defaults to true)
 * @param {boolean} payload.preview - If true, generates PDF preview instead of printing
 * @param {string} payload.marginType - Margin type: 'none', 'minimum', 'default', or 'custom'
 * @param {object} payload.margins - Custom margins object with top, right, bottom, left
 * @returns {Promise<boolean>} Resolves to true when print job completes
 */
async function performPrintJob(payload) {
  const {
    html,
    url,
    printerName,
    copies,
    landscape,
    printBackground,
    preview,
    margins,
    marginType
  } = payload;

  validatePayload(payload);

  const win = await ensurePrintWindow();

  // Prepare the page: load content and inject margin CSS
  await preparePageForPrinting(win, url, html, marginType, margins);

  // Handle preview mode: generate PDF and open in viewer
  if (preview) {
    return await generatePDFPreview(win, {
      printBackground,
      landscape,
      marginType,
      margins
    });
  }

  // Normal silent print to the selected printer
  return await performDirectPrint(win, {
    printerName,
    landscape,
    copies,
    printBackground
  });
}

module.exports = {
  listPrinters,
  enqueuePrint,
  performPrintJob
};

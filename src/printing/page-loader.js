'use strict';

const { calculateMarginCSS } = require('../utils/margins');

/**
 * Loads content into the print window (either from URL or HTML string).
 *
 * @param {object} win - Electron BrowserWindow instance
 * @param {string} url - Optional URL to load
 * @param {string} html - Optional HTML content to load
 * @returns {Promise<void>}
 */
async function loadPage(win, url, html) {
  if (url) {
    await win.loadURL(url, { userAgent: 'ZAT-Tray' });
  } else if (html) {
    const htmlEncoded = encodeURIComponent(html);
    const dataUrl = `data:text/html;charset=utf-8,${htmlEncoded}`;
    await win.loadURL(dataUrl);
  }
}

/**
 * Waits for the page to be fully loaded and ready.
 *
 * @param {object} win - Electron BrowserWindow instance
 * @returns {Promise<void>}
 */
async function waitForPageReady(win) {
  await win.webContents.executeJavaScript(
    'new Promise(resolve => { ' +
    '  if (document.readyState === "complete") resolve(); ' +
    '  else window.addEventListener("load", resolve); ' +
    '})'
  );
}

/**
 * Injects CSS @page margin rules into the loaded page.
 *
 * @param {object} win - Electron BrowserWindow instance
 * @param {string} marginType - Margin type: 'none', 'minimum', 'default', or 'custom'
 * @param {object} margins - Custom margins object (used when marginType is 'custom')
 * @returns {Promise<void>}
 */
async function injectMarginCSS(win, marginType, margins) {
  const marginCSS = calculateMarginCSS(marginType, margins);
  
  await win.webContents.executeJavaScript(`
    (function() {
      // Remove any existing margin style tag
      const existing = document.getElementById('zat-print-margins');
      if (existing) existing.remove();
      
      // Create style element for @page margins
      const style = document.createElement('style');
      style.id = 'zat-print-margins';
      style.textContent = \`@page { margin: ${marginCSS}; }\`;
      document.head.appendChild(style);
    })();
  `);
}

/**
 * Prepares the page for printing by loading content and injecting margin CSS.
 *
 * @param {object} win - Electron BrowserWindow instance
 * @param {string} url - Optional URL to load
 * @param {string} html - Optional HTML content to load
 * @param {string} marginType - Margin type: 'none', 'minimum', 'default', or 'custom'
 * @param {object} margins - Custom margins object (used when marginType is 'custom')
 * @returns {Promise<void>}
 */
async function preparePageForPrinting(win, url, html, marginType, margins) {
  await loadPage(win, url, html);
  await waitForPageReady(win);
  await injectMarginCSS(win, marginType, margins);
}

module.exports = {
  loadPage,
  waitForPageReady,
  injectMarginCSS,
  preparePageForPrinting
};


'use strict';

/**
 * Normalizes margin values for CSS @page rules.
 * If no unit is provided, assumes the value is in pixels (common web unit).
 *
 * @param {string|number} value - Margin value (e.g., "16", "16px", "0.5cm")
 * @returns {string} CSS margin value with units
 */
function normalizeMarginForCSS(value) {
  if (!value || value === '0') return '0';
  const str = String(value).trim();
  
  // Check if it already has a unit (contains letters)
  if (/[a-zA-Z]/.test(str)) {
    return str;
  }
  
  // If it's just a number, assume pixels and add 'px' unit
  const num = parseFloat(str);
  if (isNaN(num)) return '0';
  return `${num}px`;
}

/**
 * Converts margin value to points for Electron's printToPDF.
 * Electron's printToPDF expects margins in points (1/72 inch).
 * If no unit is provided, assumes the value is in pixels (consistent with CSS normalization).
 *
 * @param {string|number} value - Margin value (e.g., "16", "16px", "0.5cm", "12pt")
 * @returns {number} Margin value in points
 */
function marginToPoints(value) {
  if (!value) return 0;
  const str = String(value).trim().toLowerCase();
  
  // Extract number and unit
  const match = str.match(/^([\d.]+)\s*(px|pt|mm|cm|in)?$/);
  if (!match) {
    // If no match, try to parse as number (assume pixels)
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    // Convert pixels to points (at 96 DPI: 1px = 0.75pt)
    return num * (72 / 96);
  }
  
  const num = parseFloat(match[1]);
  const unit = match[2] || 'px'; // Default to pixels if no unit (consistent with CSS)
  
  // Convert to points
  switch (unit) {
    case 'pt':
      return num;
    case 'px':
      return num * (72 / 96); // 1px = 0.75pt at 96 DPI
    case 'mm':
      return num * 2.83465; // 1mm = 2.83465pt
    case 'cm':
      return num * 28.3465; // 1cm = 28.3465pt
    case 'in':
      return num * 72; // 1in = 72pt
    default:
      return num; // Fallback: assume points
  }
}

/**
 * Calculates CSS margin string based on marginType and margins object.
 *
 * @param {string} marginType - Margin type: 'none', 'minimum', 'default', or 'custom'
 * @param {object} margins - Custom margins object with top, right, bottom, left
 * @returns {string} CSS margin string for @page rule
 */
function calculateMarginCSS(marginType, margins) {
  if (marginType === 'none') {
    return '0';
  }
  
  if (marginType === 'minimum') {
    return '0.5cm';
  }
  
  if (marginType === 'custom' && margins && typeof margins === 'object') {
    const top = normalizeMarginForCSS(margins.top);
    const right = normalizeMarginForCSS(margins.right);
    const bottom = normalizeMarginForCSS(margins.bottom);
    const left = normalizeMarginForCSS(margins.left);
    return `${top} ${right} ${bottom} ${left}`;
  }
  
  // Default: 1cm margins
  return '1cm';
}

/**
 * Builds PDF margin options for Electron's printToPDF.
 *
 * @param {string} marginType - Margin type: 'none', 'minimum', 'default', or 'custom'
 * @param {object} margins - Custom margins object with top, right, bottom, left
 * @returns {object} PDF options with marginsType and margins properties
 */
function buildPDFMarginOptions(marginType, margins) {
  const pdfOptions = {};
  
  if (marginType === 'none') {
    pdfOptions.marginsType = 0; // No margins
  } else if (marginType === 'minimum') {
    pdfOptions.marginsType = 1; // Minimum margins
  } else if (marginType === 'default' || !marginType) {
    pdfOptions.marginsType = 2; // Default margins
  } else if (marginType === 'custom' && margins && typeof margins === 'object') {
    pdfOptions.marginsType = 3; // Custom margins
    pdfOptions.margins = {
      top: marginToPoints(margins.top),
      right: marginToPoints(margins.right),
      bottom: marginToPoints(margins.bottom),
      left: marginToPoints(margins.left)
    };
  } else {
    pdfOptions.marginsType = 2; // Default
  }
  
  return pdfOptions;
}

module.exports = {
  normalizeMarginForCSS,
  marginToPoints,
  calculateMarginCSS,
  buildPDFMarginOptions
};


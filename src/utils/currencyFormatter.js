/**
 * Indian Numbering & Currency Formatter Utility
 * Manages Lakhs (L / Lacs) and Crores (Cr) with precision and elegance.
 */

/**
 * Formats a numeric value into the Indian numbering system.
 * Supports compact Lakhs (L) and Crores (Cr) management.
 *
 * @param {number|string} val - Number to format
 * @param {object} [options]
 * @param {boolean} [options.compact=true] - Whether to use L/Cr for >= 1 Lakh
 * @param {string} [options.currencySymbol='₹'] - Currency symbol prefix
 * @param {number} [options.decimals=2] - Max decimal places for L/Cr
 * @param {number} [options.threshold=100000] - Threshold to start L/Cr compacting (default: 1 Lakh)
 * @returns {string} Formatted string, e.g. "₹1.01 L", "₹1.50 Cr", "₹95,722"
 */
export const formatIndianCurrency = (val, options = {}) => {
  const {
    compact = true,
    currencySymbol = '₹',
    decimals = 2,
    threshold = 100000
  } = options;

  const num = Number(val) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (!compact || abs < threshold) {
    return `${sign}${currencySymbol}${Math.round(abs).toLocaleString('en-IN')}`;
  }

  // 1 Crore = 1,00,00,000 (100 Lakhs)
  if (abs >= 10000000) {
    const cr = abs / 10000000;
    const formattedCr = cr.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
    return `${sign}${currencySymbol}${formattedCr} Cr`;
  }

  // 1 Lakh = 1,00,000
  if (abs >= 100000) {
    const lac = abs / 100000;
    const formattedLac = lac.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
    return `${sign}${currencySymbol}${formattedLac} L`;
  }

  return `${sign}${currencySymbol}${Math.round(abs).toLocaleString('en-IN')}`;
};

/**
 * Formats a plain number (without currency symbol) into Lakhs and Crores if >= 100,000
 */
export const formatIndianNumber = (val, options = {}) => {
  return formatIndianCurrency(val, { ...options, currencySymbol: '' });
};

export default formatIndianCurrency;

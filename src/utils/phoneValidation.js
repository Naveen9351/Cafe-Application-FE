/**
 * Phone Number Validation & Input Formatting Utility
 * Enforces strictly 10-digit integers across all phone input fields
 */

// Format / clean phone input so only digits 0-9 are allowed, capped at 10 digits
export const formatPhoneInput = (value) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 10);
};

// Validates strictly 10-digit mobile number
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '').trim();
  return /^[0-9]{10}$/.test(clean);
};

// Blocks any non-numeric keystrokes during user typing
export const handlePhoneKeyDown = (e) => {
  // Allow control & navigation keys
  const allowedKeys = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Tab', 'Enter', 'Home', 'End', 'Escape'
  ];

  if (allowedKeys.includes(e.key)) {
    return;
  }

  // Allow copy/paste/select all (Ctrl/Cmd + C, V, A, X, Z)
  if (e.ctrlKey || e.metaKey) {
    return;
  }

  // If the key is not a digit (0-9), block the keystroke
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

export const PHONE_ERROR_MSG = 'Mobile number must be exactly 10 digits (numbers only)';

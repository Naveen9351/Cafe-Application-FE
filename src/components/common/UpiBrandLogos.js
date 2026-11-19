import React from 'react';

/**
 * 100% Official Brand SVGs for Indian UPI Payment Apps
 * Official vector sources: Google Pay, PhonePe, Paytm, BHIM (NPCI)
 */

export const GPayIcon = ({ size = 28, className = '' }) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  return (
    <img
      src={`${publicUrl}/assets/upi/gpay_icon.svg`}
      alt="Google Pay"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        flexShrink: 0
      }}
      loading="eager"
    />
  );
};

export const PhonePeIcon = ({ size = 28, className = '' }) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  return (
    <img
      src={`${publicUrl}/assets/upi/phonepe_icon.svg`}
      alt="PhonePe"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        flexShrink: 0,
        borderRadius: '50%'
      }}
      loading="eager"
    />
  );
};

export const PaytmIcon = ({ size = 28, className = '' }) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  const width = Math.round(size * 1.8);
  return (
    <img
      src={`${publicUrl}/assets/upi/paytm.svg`}
      alt="PayTM"
      width={width}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        flexShrink: 0
      }}
      loading="eager"
    />
  );
};

export const BhimIcon = ({ size = 28, className = '' }) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  const width = Math.round(size * 0.95);
  return (
    <img
      src={`${publicUrl}/assets/upi/bhim_icon.svg`}
      alt="BHIM UPI"
      width={width}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        flexShrink: 0
      }}
      loading="eager"
    />
  );
};

/**
 * Validates whether a string is a legitimate Indian UPI ID (VPA)
 * Filters out invalid email handles like @gmail.com, @yahoo.com
 */
export function validateUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') {
    return { isValid: false, reason: 'UPI ID is required' };
  }
  const clean = upiId.trim().toLowerCase();
  
  if (!clean.includes('@')) {
    return { isValid: false, reason: 'UPI ID must contain "@" (e.g., 9351862675@paytm)' };
  }

  // Check if someone accidentally entered their standard email
  const invalidEmailDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com'];
  if (invalidEmailDomains.some(dom => clean.endsWith(dom))) {
    return {
      isValid: false,
      reason: `"${clean}" is an email address, NOT a UPI ID. A UPI ID ends with a bank handle like @okaxis, @ybl, or @paytm.`
    };
  }

  // Basic regex for VPA: username@bankhandle
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!vpaRegex.test(clean)) {
    return {
      isValid: false,
      reason: 'Invalid UPI handle format. Examples: 9351862675@paytm, user@okaxis, cafe@ybl'
    };
  }

  return { isValid: true, cleanId: clean };
}

/**
 * Builds standard NPCI-compliant UPI payment URI
 * IMPORTANT: In NPCI UPI spec, 'pa' MUST contain a literal '@' character.
 * Never wrap 'pa' in encodeURIComponent because '%40' causes banking apps to fail with 'VPA not available'.
 */
export function buildUpiUri({ upiId, payeeName = 'Cafee', amount, note = 'Order Payment', includeAmount = true }) {
  if (!upiId) return '';
  // Clean whitespace and enforce literal '@'
  const cleanId = String(upiId).trim().replace(/\s+/g, '');
  const cleanName = String(payeeName || 'Store').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 30);
  const cleanNote = String(note || 'Order Payment').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 25);
  
  // Standard NPCI Bharat QR specification
  let uri = `upi://pay?pa=${cleanId}&pn=${encodeURIComponent(cleanName)}&cu=INR`;
  
  const numAmt = Number(amount);
  if (includeAmount && !isNaN(numAmt) && numAmt > 0) {
    uri += `&am=${numAmt.toFixed(2)}`;
  }
  
  if (cleanNote) {
    uri += `&tn=${encodeURIComponent(cleanNote)}`;
  }

  return uri;
}

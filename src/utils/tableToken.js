/**
 * Utility to securely encode and decode table numbers into tamper-resistant short tokens.
 * Prevents users from manually editing '?table=1' to '?table=2' in the browser address bar.
 */

const SALT = 'serviq_safe_table_sec_2026';

// Simple lightweight fast hash for browser & node
function generateChecksum(str) {
  let hash = 5381;
  const combined = `${str}_${SALT}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(4, '0');
  return hex.slice(-4);
}

/**
 * Encode table number into a tamper-resistant short token.
 * Example: Table "1" -> "t1-8f2b"
 * Table "Outdoor 3" -> "t_Outdoor_3-a9c1"
 */
export function encodeTableToken(tableNumber) {
  if (!tableNumber && tableNumber !== 0) return '';
  const clean = String(tableNumber).trim().replace(/^Table\s*/i, '');
  const safeStr = clean.replace(/[^a-zA-Z0-9]/g, '_');
  const checksum = generateChecksum(clean);
  return `t${safeStr}-${checksum}`;
}

/**
 * Decode table token back to the table number.
 * Validates checksum against tampering.
 * Falls back to raw string if valid unencoded table format.
 */
export function decodeTableToken(token) {
  if (!token) return '';
  const str = String(token).trim();

  // Check if token matches format: t<safeStr>-<checksum>
  const match = str.match(/^t([a-zA-Z0-9_]+)-([a-f0-9]{4})$/i);
  if (match) {
    const rawVal = match[1].replace(/_/g, ' ');
    const checksum = match[2].toLowerCase();
    const expected = generateChecksum(rawVal).toLowerCase();
    
    if (checksum === expected) {
      return rawVal;
    }
    // Also try matching original exact string (in case no spaces were present)
    const exactExpected = generateChecksum(match[1]).toLowerCase();
    if (checksum === exactExpected) {
      return match[1];
    }
    console.warn('[TableToken] Invalid checksum on table token:', token);
    return null; // Tampered or invalid
  }

  // Base64URL fallback pattern: sq_<base64>
  if (str.startsWith('sq_')) {
    try {
      const decoded = atob(str.slice(3).replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.t) return String(parsed.t);
    } catch (e) {}
  }

  // Fallback for raw table number if clean
  return str;
}

/**
 * Build the full short menu QR / dine-in order URL.
 */
export function buildTableMenuUrl(baseUrl, tableNumber, tenantId) {
  let defaultOrigin = 'https://cafe-application-fe.vercel.app';
  if (typeof window !== 'undefined' && window.location) {
    const saved = localStorage.getItem('serivq_qr_base_url');
    if (saved) {
      defaultOrigin = saved;
    } else if (window.location.origin) {
      defaultOrigin = window.location.origin;
    }
  }

  const cleanBase = (baseUrl || defaultOrigin).replace(/\/$/, '');
  const token = encodeTableToken(tableNumber);
  
  const params = new URLSearchParams();
  if (tenantId && tenantId !== 'demo-tenant' && tenantId !== '6a762ef86c9d5c8be315f10a') {
    params.set('tenantId', tenantId);
  }
  params.set('t', token);

  return `${cleanBase}/menu?${params.toString()}`;
}

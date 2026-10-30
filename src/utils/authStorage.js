/**
 * Shared Auth Storage across subdomains (.dineviq.com)
 * Handles localStorage and cross-subdomain cookie synchronization.
 */

// Helper to determine the top domain for cookie setting (.dineviq.com)
const getCookieDomain = () => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('dineviq.com')) {
    return '; domain=.dineviq.com';
  }
  return '';
};

export const setSharedAuth = (token, user) => {
  if (!token) return;
  try {
    const userStr = typeof user === 'string' ? user : JSON.stringify(user);
    localStorage.setItem('token', token);
    if (userStr) localStorage.setItem('user', userStr);

    if (typeof document !== 'undefined') {
      const domainAttr = getCookieDomain();
      const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
      const maxAge = 60 * 60 * 24 * 30; // 30 days
      document.cookie = `dineviq_token=${encodeURIComponent(token)}${domainAttr}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
      if (userStr) {
        document.cookie = `dineviq_user=${encodeURIComponent(userStr)}${domainAttr}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
      }
    }
  } catch (err) {
    console.error('[authStorage] Failed to set shared auth:', err);
  }
};

export const getSharedAuth = () => {
  let token = null;
  let user = null;

  try {
    token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (err) {
    console.error('[authStorage] Error reading localStorage:', err);
  }

  // If not found in localStorage, check cookie (shared across *.dineviq.com)
  if (!token && typeof document !== 'undefined') {
    try {
      const cookies = document.cookie ? document.cookie.split(';') : [];
      for (const cookie of cookies) {
        const [rawKey, ...valParts] = cookie.trim().split('=');
        const key = rawKey.trim();
        const val = valParts.join('=');
        if (key === 'dineviq_token' && val) {
          token = decodeURIComponent(val);
        }
        if (key === 'dineviq_user' && val) {
          try {
            user = JSON.parse(decodeURIComponent(val));
          } catch (_) {}
        }
      }

      // If retrieved from cookie, sync into local storage immediately
      if (token) {
        localStorage.setItem('token', token);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch (err) {
      console.error('[authStorage] Error reading cookies:', err);
    }
  }

  return { token, user };
};

export const clearSharedAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_exp');
  } catch (err) {}

  if (typeof document !== 'undefined') {
    const domainAttr = getCookieDomain();
    // Clear with domain (.dineviq.com)
    document.cookie = `dineviq_token=; path=/${domainAttr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `dineviq_user=; path=/${domainAttr}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    // Clear without domain (current host)
    document.cookie = `dineviq_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `dineviq_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
};


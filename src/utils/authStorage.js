/**
 * Shared Auth Storage across subdomains (*.dineviq.com)
 * Handles localStorage, sessionStorage and cross-subdomain cookie synchronization.
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
  const isDineviqDomain = typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('dineviq.com');

  // 1. Read cookies first (shared source of truth across *.dineviq.com)
  let cookieToken = null;
  let cookieUser = null;

  if (typeof document !== 'undefined') {
    try {
      const cookies = document.cookie ? document.cookie.split(';') : [];
      for (const cookie of cookies) {
        const [rawKey, ...valParts] = cookie.trim().split('=');
        const key = rawKey.trim();
        const val = valParts.join('=');
        if (key === 'dineviq_token' && val) {
          cookieToken = decodeURIComponent(val);
        }
        if (key === 'dineviq_user' && val) {
          try {
            cookieUser = JSON.parse(decodeURIComponent(val));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error('[authStorage] Error reading cookies:', err);
    }
  }

  // If on dineviq.com domain and shared cookie is absent/cleared:
  // User is logged out! Clear any stale localStorage on this subdomain to prevent ghost sessions & loops
  if (isDineviqDomain && !cookieToken) {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_exp');
      sessionStorage.clear();
    } catch (_) {}
    return { token: null, user: null };
  }

  // 2. Read localStorage
  try {
    token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (err) {
    console.error('[authStorage] Error reading localStorage:', err);
  }

  // 3. If cookieToken exists but not in this subdomain's localStorage, sync it into localStorage immediately
  if (cookieToken && (!token || !user)) {
    token = cookieToken;
    user = cookieUser || user;
    try {
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (_) {}
  }

  return { token, user };
};

export const clearSharedAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_exp');
    sessionStorage.clear();
  } catch (err) {}

  if (typeof document !== 'undefined') {
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    // 1. Clear for .dineviq.com (with leading dot)
    document.cookie = `dineviq_token=; domain=.dineviq.com; ${expired}${secure}`;
    document.cookie = `dineviq_user=; domain=.dineviq.com; ${expired}${secure}`;

    // 2. Clear for dineviq.com (without leading dot)
    document.cookie = `dineviq_token=; domain=dineviq.com; ${expired}${secure}`;
    document.cookie = `dineviq_user=; domain=dineviq.com; ${expired}${secure}`;

    // 3. Clear for current host specifically
    document.cookie = `dineviq_token=; ${expired}${secure}`;
    document.cookie = `dineviq_user=; ${expired}${secure}`;
  }
};


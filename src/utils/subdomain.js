/**
 * Subdomain and Portal Routing Helpers
 */

export const isBillingOrAdminSubdomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const cleanHost = host.replace(/^www\./, '');
  return (
    cleanHost.startsWith('billing.') ||
    cleanHost.startsWith('admin.') ||
    cleanHost.startsWith('dashboard.') ||
    cleanHost.startsWith('portal.') ||
    cleanHost.startsWith('app.')
  );
};

export const isMainDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  // Matches www.dineviq.com, dineviq.com, dev domains, localhost (for dev)
  return (
    host === 'dineviq.com' ||
    host === 'www.dineviq.com' ||
    host === 'dev.dineviq.com' ||
    host === 'dev-dineviq.com' ||
    host === 'www.dev-dineviq.com' ||
    host.includes('dev-dineviq.com') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
};

export const getMainDomainBase = () => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('dev-dineviq.com') || host.startsWith('dev.')) {
    return window.location.origin;
  }
  if (host.includes('dineviq.com')) {
    return 'https://www.dineviq.com';
  }
  return window.location.origin;
};

export const getBillingPortalUrl = () => {
  return '/login';
};

/**
 * Build the cross-domain auth handoff URL.
 * Called by billing.dineviq.com after a successful login to hand the
 * token/user over to www.dineviq.com via query params (HTTPS only).
 *
 * @param {string} token - JWT token
 * @param {object} user  - User object from the API response
 * @param {string} [redirectPath] - Path to redirect to on destination (e.g. /super-admin)
 * @returns {string} Full URL to redirect to on www.dineviq.com
 */
export const buildAuthCallbackUrl = (token, user, redirectPath = '') => {
  if (typeof window === 'undefined') return '/';
  const host = window.location.hostname.toLowerCase();

  let mainDomain = window.location.origin;
  if (host.includes('dev-dineviq.com') || host.startsWith('dev.')) {
    mainDomain = window.location.origin;
  } else if (host.includes('dineviq.com')) {
    mainDomain = 'https://www.dineviq.com';
  }

  const params = new URLSearchParams({
    token: token || '',
    user: user ? encodeURIComponent(typeof user === 'string' ? user : JSON.stringify(user)) : '',
    redirect: redirectPath || (user?.role === 'super_admin' ? '/super-admin' : '/admin/dashboard')
  });

  return `${mainDomain}/auth-callback?${params.toString()}`;
};

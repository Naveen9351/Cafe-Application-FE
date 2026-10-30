/**
 * Subdomain and Portal Routing Helpers
 */

export const isBillingOrAdminSubdomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.startsWith('billing.') ||
    host.startsWith('admin.') ||
    host.startsWith('dashboard.') ||
    host.startsWith('portal.') ||
    host.startsWith('app.')
  );
};

export const isMainDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  // Matches www.dineviq.com, dineviq.com, localhost (for dev)
  return (
    host === 'dineviq.com' ||
    host === 'www.dineviq.com' ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
};

export const getMainDomainBase = () => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('dineviq.com')) {
    return 'https://www.dineviq.com';
  }
  return window.location.origin;
};

export const getBillingPortalUrl = () => {
  if (typeof window === 'undefined') return '/login';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('dineviq.com')) {
    return 'https://billing.dineviq.com/login';
  }
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

  const mainDomain = host.includes('dineviq.com')
    ? 'https://www.dineviq.com'
    : window.location.origin;

  const params = new URLSearchParams({
    token: token || '',
    user: user ? encodeURIComponent(typeof user === 'string' ? user : JSON.stringify(user)) : '',
    redirect: redirectPath || (user?.role === 'super_admin' ? '/super-admin' : '/admin/dashboard')
  });

  return `${mainDomain}/auth-callback?${params.toString()}`;
};

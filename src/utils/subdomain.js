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

export const getBillingPortalUrl = () => {
  if (typeof window === 'undefined') return '/login';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('dineviq.com')) {
    return 'https://billing.dineviq.com';
  }
  return '/login';
};

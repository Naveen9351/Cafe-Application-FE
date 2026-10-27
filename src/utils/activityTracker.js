import axios from 'axios';
import { API_URL as API } from '../config/api';

// Cache last tracked path and time to debounce identical duplicate page views
let lastTrackedPath = '';
let lastTrackedTime = 0;

// Real Geolocation and Public IP Cache
let geoCache = null;
let geoPromise = null;

const getRealGeoLocation = async () => {
  if (geoCache) return geoCache;

  try {
    const cached = sessionStorage.getItem('dineviq_client_geo');
    if (cached) {
      geoCache = JSON.parse(cached);
      return geoCache;
    }
  } catch (e) {}

  if (geoPromise) return geoPromise;

  geoPromise = (async () => {
    try {
      // Fast, free HTTPS IP Geolocation API
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        geoCache = {
          ip: data.ip || '',
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || 'India'
        };
        try {
          sessionStorage.setItem('dineviq_client_geo', JSON.stringify(geoCache));
        } catch (e) {}
        return geoCache;
      }
    } catch (err) {
      // Fallback: try alternative IP resolver
      try {
        const res2 = await fetch('https://api.ipify.org?format=json');
        const data2 = await res2.json();
        geoCache = { ip: data2.ip || '', city: '', region: '', country: 'India' };
        return geoCache;
      } catch (e2) {}
    }
    return null;
  })();

  return geoPromise;
};

export const trackActivity = async ({
  eventType = 'PAGE_VIEW',
  action,
  category = 'Traffic',
  path = window.location.pathname,
  metadata = {}
}) => {
  try {
    // Debounce rapid duplicate calls on same path within 1.5 seconds
    const now = Date.now();
    if (eventType === 'PAGE_VIEW' && path === lastTrackedPath && (now - lastTrackedTime) < 1500) {
      return;
    }
    lastTrackedPath = path;
    lastTrackedTime = now;

    // Get current logged-in user if available
    let userPayload = {
      name: 'Guest Visitor',
      email: 'visitor@dineviq.com',
      role: 'guest',
      tenantName: 'Public Web'
    };

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        userPayload = {
          userId: u._id || u.id,
          name: u.name || u.adminName || u.email?.split('@')[0] || 'User',
          email: u.email || 'user@dineviq.com',
          role: u.role || 'staff',
          tenantId: u.tenantId || null,
          tenantName: u.tenantName || (u.role === 'super_admin' ? 'DineviQ HQ' : 'Cafe Platform')
        };
      }
    } catch (e) {}

    // Resolve real visitor location
    const geo = await getRealGeoLocation().catch(() => null);
    let resolvedCity = undefined;
    if (geo?.city) {
      resolvedCity = geo.region ? `${geo.city}, ${geo.region}` : geo.city;
    }

    const payload = {
      eventType,
      action: action || `Viewed ${path}`,
      category,
      path,
      user: userPayload,
      city: resolvedCity,
      country: geo?.country || 'India',
      clientIp: geo?.ip || undefined,
      referrer: document.referrer || 'Direct',
      metadata
    };

    // Fire and forget, asynchronous
    axios.post(`${API}/analytics/track`, payload).catch(() => {});
  } catch (err) {
    // Silently ignore tracking errors to avoid blocking UI
  }
};

export const trackPageView = (pathname) => {
  const titles = {
    '/': 'Viewed Landing Page',
    '/menu': 'Browsed Interactive QR Menu',
    '/pricing': 'Viewed Pricing Plans & Subscription Options',
    '/demo': 'Opened Live Demo Booking Form',
    '/login': 'Accessed Restaurant Login Portal',
    '/contact': 'Visited Contact & Specialist Support',
    '/whatsapp': 'Explored WhatsApp Orders & Receipts',
    '/about': 'Read About DineviQ Platform',
    '/admin/dashboard': 'Active in Cafe POS Dashboard',
    '/super-admin': 'Managing Platform Governance'
  };

  const action = titles[pathname] || `Viewed ${pathname}`;
  trackActivity({
    eventType: 'PAGE_VIEW',
    action,
    category: 'Traffic',
    path: pathname
  });
};

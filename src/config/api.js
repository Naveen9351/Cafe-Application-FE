const isLocalhost = Boolean(
  typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.localhost') ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
  )
);

const isDevDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.includes('dev-dineviq.com') ||
    host.startsWith('dev.') ||
    host.includes('.dev.') ||
    host.includes('-dev.')
  );
};

const getApiUrl = () => {
  // 1. Localhost development always talks to local backend
  if (isLocalhost) {
    return 'http://localhost:5000/api';
  }

  const envUrl = process.env.REACT_APP_API_URL;

  // 2. If explicit remote URL is set at build time (e.g. Vercel environment variable)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. If running in browser on a live / staging / preview domain
  if (typeof window !== 'undefined' && !isLocalhost) {
    if (isDevDomain()) {
      // Connect to Dev backend on Render
      return process.env.REACT_APP_DEV_API_URL || 'https://cafe-application-be.onrender.com/api';
    }
    // Live production backend (default)
    return 'https://cafe-application-be-1.onrender.com/api';
  }

  // 3. Localhost development
  if (envUrl) {
    return envUrl;
  }

  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

export const SOCKET_URL = API_URL.replace('/api', '');

export default API_URL;


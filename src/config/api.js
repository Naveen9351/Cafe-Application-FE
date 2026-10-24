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

const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;

  // If in browser and NOT on localhost (live / production domain)
  if (typeof window !== 'undefined' && !isLocalhost) {
    // If an explicit remote production URL is configured, use it
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    // Fallback to live production backend
    return 'https://cafe-application-be-1.onrender.com/api';
  }

  // Local development
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

export const SOCKET_URL = API_URL.replace('/api', '');

export default API_URL;


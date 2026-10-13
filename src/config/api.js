const isLocalhost = Boolean(
  typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.')
  )
);

export const API_URL = 
  process.env.REACT_APP_API_URL || 
  (isLocalhost ? 'http://localhost:5000/api' : 'https://cafe-application-be-1.onrender.com/api');

export const SOCKET_URL = API_URL.replace('/api', '');

export default API_URL;

// Automatically use localhost:5000 when browsing locally, else use production Render URL
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.endsWith('.localhost'));

export const API_URL = isLocal
  ? `http://${window.location.hostname}:5000/api`
  : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

export const SOCKET_URL = API_URL.replace('/api', '');

export default API_URL;


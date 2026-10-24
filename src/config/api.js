const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return `http://${hostname}:5000/api`;
    }
  }
  
  return 'https://cafe-application-be-1.onrender.com/api';
};

export const API_URL = getApiUrl();
export const SOCKET_URL = API_URL.replace('/api', '');

export default API_URL;


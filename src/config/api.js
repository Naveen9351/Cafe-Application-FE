export const API_URL = 
    process.env.REACT_APP_API_URL || 
    'https://cafe-application-be-1.onrender.com/api';

export const SOCKET_URL = API_URL.replace('/api', '');

export default API_URL;

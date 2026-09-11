import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');
const SOCKET_URL = API.replace('/api', '');

// Safe helper to parse JWT payload without external heavy dependencies
const parseJwt = (token) => {
    try {
        if (!token || typeof token !== 'string') return null;
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    const logout = useCallback((reason) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_exp');
        setUser(null);
        setRole(null);
        setTenantId(null);
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setSocket(null);

        if (reason) {
            toast.error(reason, { id: 'session-expired' });
        } else {
            toast.success('Logged out successfully');
        }
    }, []);

    const setupSocket = useCallback((tid) => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            newSocket.emit('joinTenant', tid);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
    }, []);

    // Proactive check if session token is still valid
    const checkSessionValidity = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return false;

        const decoded = parseJwt(token);
        if (!decoded || !decoded.exp) {
            return true; // Token without explicit exp
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp <= currentTime) {
            logout('Your session has expired. Please sign in again.');
            return false;
        }
        return true;
    }, [logout]);

    // Setup global Axios Interceptors for Session & Authorization Management
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers['x-auth-token'] = token;
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const originalRequest = error.config;
                // If 401 and request is not login/register endpoint, auto logout
                if (
                    error.response &&
                    error.response.status === 401 &&
                    originalRequest &&
                    !originalRequest.url.includes('/auth/login') &&
                    !originalRequest.url.includes('/auth/register-tenant')
                ) {
                    const token = localStorage.getItem('token');
                    if (token) {
                        logout('Session expired or unauthorized. Please sign in again.');
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [logout]);

    // Initialize Auth state from LocalStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            const isValid = checkSessionValidity();
            if (isValid) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setRole(parsedUser.role);
                    setTenantId(parsedUser.tenantId);

                    if (parsedUser.tenantId) {
                        setupSocket(parsedUser.tenantId);
                    }
                } catch (err) {
                    console.error('Auth initialization error:', err);
                    logout();
                }
            }
        }
        setLoading(false);
    }, [checkSessionValidity, logout, setupSocket]);

    // Periodic & Tab focus session expiry checks
    useEffect(() => {
        const interval = setInterval(() => {
            if (localStorage.getItem('token')) {
                checkSessionValidity();
            }
        }, 30000); // Check every 30 seconds

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
                checkSessionValidity();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [checkSessionValidity]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API}/auth/login`, { email, password });
            const { token, user: loggedInUser } = res.data;

            const decoded = parseJwt(token);
            if (decoded && decoded.exp) {
                localStorage.setItem('token_exp', decoded.exp);
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(loggedInUser));

            setUser(loggedInUser);
            setRole(loggedInUser.role);
            setTenantId(loggedInUser.tenantId);

            if (loggedInUser.tenantId) {
                setupSocket(loggedInUser.tenantId);
            }

            toast.success(`Welcome back, ${loggedInUser.name}!`);
            return { success: true, user: loggedInUser };
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg =
                err.response?.data?.error ||
                (err.response?.data?.errors && err.response?.data?.errors[0]?.msg) ||
                (err.message === 'Network Error' ? 'Unable to connect to server. Please check your network connection.' : 'Login failed');
            
            toast.error(errorMsg);
            return {
                success: false,
                error: errorMsg,
                errors: err.response?.data?.errors || []
            };
        }
    };

    const registerTenant = async (data) => {
        try {
            const res = await axios.post(`${API}/auth/register-tenant`, data);
            toast.success('Registration successful! Please sign in to your dashboard.');
            return { success: true, data: res.data };
        } catch (err) {
            console.error('Registration error:', err);
            const errorMsg =
                err.response?.data?.error ||
                (err.response?.data?.errors && err.response?.data?.errors[0]?.msg) ||
                (err.message === 'Network Error' ? 'Unable to connect to server. Please check your network connection.' : 'Registration failed');
            
            toast.error(errorMsg);
            return {
                success: false,
                error: errorMsg,
                errors: err.response?.data?.errors || []
            };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                tenantId,
                socket,
                loading,
                login,
                logout,
                registerTenant,
                checkSessionValidity,
                isAuthenticated: !!user && !!localStorage.getItem('token')
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

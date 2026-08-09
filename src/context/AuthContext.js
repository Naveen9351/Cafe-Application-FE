import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');
const SOCKET_URL = API.replace('/api', '');

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setRole(parsedUser.role);
                setTenantId(parsedUser.tenantId);

                // Setup Socket for Tenant Room
                if (parsedUser.tenantId) {
                    setupSocket(parsedUser.tenantId);
                }
            } catch (err) {
                console.error("Auth init error:", err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const setupSocket = (tid) => {
        // Ensure we connect to localhost or the correct env URL
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'], // Prioritize websocket
            // withCredentials: true, // Only if needed for cookies
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket at', SOCKET_URL);
            newSocket.emit('joinTenant', tid);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        setSocket(newSocket);
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API}/auth/login`, { email, password });

            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            setRole(user.role);
            setTenantId(user.tenantId);

            if (user.tenantId) {
                setupSocket(user.tenantId);
            }

            toast.success(`Welcome back, ${user.name}!`);
            return user; // Return for navigation logic in component
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Login failed');
            return null;
        }
    };

    const registerTenant = async (data) => {
        try {
            await axios.post(`${API}/auth/register-tenant`, data);
            toast.success('Registration successful! Please login.');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setRole(null);
        setTenantId(null);
        if (socket) socket.disconnect();
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, role, tenantId, socket, loading, login, logout, registerTenant }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

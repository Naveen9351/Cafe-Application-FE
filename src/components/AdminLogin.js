import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLogin.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API}/admin/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data.error || 'Login failed');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Login</h1>
      {error && <p className={styles.error}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className={styles.input}
      />
      <button
        onClick={handleLogin}
        className={styles.button}
      >
        Login
      </button>
    </div>
  );
}

export default AdminLogin;
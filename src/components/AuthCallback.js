import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from './PageLoader';
import { setSharedAuth } from '../utils/authStorage';
import { useAuth } from '../context/AuthContext';

/**
 * AuthCallback — Cross-Domain Token Handoff Handler
 *
 * Flow:
 *  1. User logs in on billing.dineviq.com
 *  2. After success, billing subdomain redirects to:
 *     https://www.dineviq.com/auth-callback?token=xxx&user=yyy&redirect=/super-admin
 *  3. This component reads those params, stores the token in THIS domain's
 *     localStorage and shared cookie, updates AuthContext, then navigates to the dashboard.
 */
const AuthCallback = () => {
  const location = useLocation();
  const { setSessionDirect } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const redirectParam = params.get('redirect');

    if (!token || !userParam) {
      window.location.replace('/');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));

      // Store in shared storage
      setSharedAuth(token, user);

      // Also update AuthContext in-memory state
      if (setSessionDirect) {
        setSessionDirect(token, user);
      }

      // Determine target destination
      const destination = redirectParam || (user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard');

      // Use window.location.replace to clean query params from history & ensure clean load
      window.location.replace(destination);
    } catch (err) {
      console.error('[AuthCallback] Failed to parse auth params:', err);
      window.location.replace('/');
    }
  }, [location.search, setSessionDirect]);

  return <PageLoader duration={300} />;
};

export default AuthCallback;

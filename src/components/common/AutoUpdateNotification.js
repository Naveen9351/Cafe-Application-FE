import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { API_URL } from '../../config/api';

const CHECK_INTERVAL_MS = 90 * 1000; // Check every 90 seconds

const AutoUpdateNotification = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const initialBuildTimeRef = useRef(null);
  const initialVersionRef = useRef(null);

  const checkForUpdate = async () => {
    try {
      const baseApi = API_URL ? API_URL.replace(/\/+$/, '') : '/api';
      const res = await fetch(`${baseApi}/version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache'
        }
      });
      if (!res.ok) return;

      const data = await res.json();
      if (!data) return;

      const incomingBuildTime = data.buildTime;
      const incomingVersion = data.version;

      if (!initialBuildTimeRef.current) {
        initialBuildTimeRef.current = incomingBuildTime;
        initialVersionRef.current = incomingVersion;
        return;
      }

      // Check if buildTime or version changed
      if (
        (incomingBuildTime && incomingBuildTime !== initialBuildTimeRef.current) ||
        (incomingVersion && incomingVersion !== initialVersionRef.current)
      ) {
        console.log('🚀 [AutoUpdate] New code deployment detected:', incomingVersion, incomingBuildTime);
        setHasUpdate(true);
      }
    } catch (err) {
      // Non-fatal, offline or server starting
    }
  };

  useEffect(() => {
    // 1. Initial check
    checkForUpdate();

    // 2. Periodic background polling
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    // 3. Tab focus check (when client comes back to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkForUpdate);

    // 4. Listen for PWA Service Worker updates
    const handleSwUpdate = () => {
      console.log('🚀 [AutoUpdate] PWA service worker update detected.');
      setHasUpdate(true);
    };
    window.addEventListener('app-update-available', handleSwUpdate);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('app-update-available', handleSwUpdate);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);

    // Give service worker a moment to claim clients if applicable
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }).catch(() => {});
    }

    setTimeout(() => {
      // Reload page. All localStorage data (token, tenant, cart) is 100% preserved.
      window.location.reload();
    }, 400);
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999999,
          maxWidth: '460px',
          width: '92%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backdropFilter: 'blur(12px)',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}
          >
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>New Update Ready!</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <ShieldCheck size={12} color="#10b981" />
              <span>Session & cart remain 100% logged in</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: isUpdating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <RefreshCw size={13} className={isUpdating ? 'animate-spin' : ''} style={{ animation: isUpdating ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AutoUpdateNotification;

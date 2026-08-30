import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Animated PageLoader with official GIF for initial load or page transitions
 */
export default function PageLoader({ onLoaded, duration = 1200 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onLoaded) onLoaded();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onLoaded]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Subtle Ambient Background Glow */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(249, 115, 22, 0.06) 50%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }} />

          {/* Animated Logo GIF */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              marginBottom: '1.5rem',
            }}
          >
            <img
              src="/logos/logo-gif.gif"
              alt="RASTRORATO Loading"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </motion.div>

          {/* Loading Brand Text */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '900',
              color: '#0f172a',
              letterSpacing: '0.5px',
              margin: '0 0 0.35rem'
            }}>
              RASTRORATO
            </h2>
            <p style={{
              fontSize: '0.8rem',
              color: '#64748b',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin: '0 0 1.25rem'
            }}>
              DIGITAL RESTAURANT PLATFORM
            </p>

            {/* Smooth Progress Bar */}
            <div style={{
              width: '180px',
              height: '4px',
              backgroundColor: '#e2e8f0',
              borderRadius: '10px',
              overflow: 'hidden',
              margin: '0 auto',
            }}>
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                style={{
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #f97316)',
                  borderRadius: '10px',
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

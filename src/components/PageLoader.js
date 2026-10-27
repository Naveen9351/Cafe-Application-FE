import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import brandLogo from '../assets/logo.png';

/**
 * Animated PageLoader with light theme and blurred background
 */
export default function PageLoader({ onLoaded, duration }) {
  useEffect(() => {
    if (duration && onLoaded) {
      const timer = setTimeout(() => {
        onLoaded();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onLoaded]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Luminous Ambient Background Glows */}
      <div
        style={{
          position: 'absolute',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          top: '20%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          bottom: '20%',
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {/* Logo Card with Ambient Pulse Ring */}
        <div style={{ position: 'relative', marginBottom: '1.4rem' }}>
          {/* Subtle Outer Pulse Ring */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.1, 0.35],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74, 93, 76, 0.25) 0%, rgba(202, 168, 77, 0.15) 100%)',
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />

          {/* Circular Insignia Card */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              width: '104px',
              height: '104px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '6px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <img
              src={brandLogo}
              alt="DineviQ Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </motion.div>
        </div>

        {/* Brand Name Typography */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
                fontSize: '1.5rem',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                color: '#0f172a',
                margin: 0,
                lineHeight: 1,
              }}
            >
              DINEVIQ
            </h1>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2.5px 7px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1,
              }}
            >
              AI OS
            </span>
          </div>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.78rem',
              color: '#64748b',
              fontWeight: 700,
              letterSpacing: '1.1px',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            THE ART OF GOOD TASTE • RESTAURANT OS
          </p>
        </div>

        {/* Smooth Precision Progress Loader */}
        <div
          style={{
            width: '210px',
            height: '5px',
            backgroundColor: 'rgba(226, 232, 240, 0.9)',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
          }}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              width: '55%',
              height: '100%',
              background: 'linear-gradient(90deg, #2563eb, #06b6d4, #10b981)',
              borderRadius: '999px',
              boxShadow: '0 0 10px rgba(37, 99, 235, 0.45)',
            }}
          />
        </div>

        {/* Micro Status Hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '0.85rem',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
            }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontWeight: 600,
              letterSpacing: '0.2px',
            }}
          >
            Loading workspace...
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import brandLogo from '../../assets/logo.png';
import styles from './CinematicLoader.module.css';

/**
 * Premium DINEVIQ Cinematic Intro-to-Dashboard Transition
 * Hardware-accelerated with zero-flicker CSS animations for continuous elements.
 * React state handles entrance and exit transitions strictly once.
 */
function CinematicLoaderComponent({
  isReady = false,
  onComplete,
  duration = 0,
  statusText = 'Loading workspace...'
}) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'active' | 'exiting' | 'complete'
  const exitStartedRef = useRef(false);
  const entranceDoneRef = useRef(false);

  // Phase 1 -> Phase 2/3 entrance timeline
  useEffect(() => {
    const timer = setTimeout(() => {
      entranceDoneRef.current = true;
      setPhase((prev) => (prev === 'entering' ? 'active' : prev));
      // If data became ready before entrance finished, trigger exit now
      if (isReady && !exitStartedRef.current) {
        exitStartedRef.current = true;
        setPhase('exiting');
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [isReady]);

  // If a fixed duration is supplied (e.g. standalone PageLoader use)
  useEffect(() => {
    if (duration > 0 && !isReady && !exitStartedRef.current) {
      const timer = setTimeout(() => {
        if (!exitStartedRef.current) {
          exitStartedRef.current = true;
          setPhase('exiting');
        }
      }, Math.max(duration, 700));
      return () => clearTimeout(timer);
    }
  }, [duration, isReady]);

  // When actual dashboard data is genuinely ready:
  useEffect(() => {
    if (isReady && entranceDoneRef.current && !exitStartedRef.current) {
      exitStartedRef.current = true;
      setPhase('exiting');
    }
  }, [isReady]);

  // Handle final completion after exit animation completes
  useEffect(() => {
    if (phase === 'exiting') {
      const exitTimer = setTimeout(() => {
        setPhase('complete');
        if (onComplete) onComplete();
      }, 500); // exit duration
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onComplete]);

  if (phase === 'complete') return null;

  const isExiting = phase === 'exiting';

  return (
    <div
      className={`${styles.overlay} ${isExiting ? styles.overlayExiting : ''}`}
      aria-hidden={isExiting}
    >
      {/* Central Amber Halo Glow (Hardware-accelerated CSS animation) */}
      <div className={styles.haloGlow} />

      {/* ============================================================ */}
      {/* 1. TOP-LEFT ORGANIC WAVES (Matching Reference Image) */}
      {/* ============================================================ */}
      <motion.div
        initial={{ x: -160, y: -160, opacity: 0 }}
        animate={{
          x: isExiting ? -180 : 0,
          y: isExiting ? -180 : 0,
          opacity: isExiting ? 0 : 1
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '320px',
          height: '320px',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <svg viewBox="0 0 320 320" width="100%" height="100%" fill="none" style={{ overflow: 'visible' }}>
          {/* Layer 1: Soft warm caramel/cream wave */}
          <path
            d="M-40 210 C 60 210, 150 160, 210 90 C 250 40, 260 -20, 260 -50 L -40 -50 Z"
            fill="#f5e6d3"
            opacity="0.85"
          />
          {/* Layer 2: Pastel sage wave */}
          <path
            d="M-30 170 C 40 170, 110 130, 160 80 C 195 40, 205 -20, 210 -40 L -30 -40 Z"
            fill="#c2d4c0"
            opacity="0.75"
          />
          {/* Layer 3: Deep forest sage wave */}
          <path
            d="M-30 130 C 30 130, 80 100, 120 60 C 150 25, 165 -15, 170 -40 L -30 -40 Z"
            fill="#3a513d"
            opacity="0.95"
          />
        </svg>
      </motion.div>

      {/* ============================================================ */}
      {/* 2. BOTTOM-RIGHT ORGANIC WAVES (Matching Reference Image) */}
      {/* ============================================================ */}
      <motion.div
        initial={{ x: 160, y: 160, opacity: 0 }}
        animate={{
          x: isExiting ? 180 : 0,
          y: isExiting ? 180 : 0,
          opacity: isExiting ? 0 : 1
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '340px',
          height: '340px',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <svg viewBox="0 0 340 340" width="100%" height="100%" fill="none" style={{ overflow: 'visible' }}>
          {/* Layer 1: Warm cream/peach curve */}
          <path
            d="M380 90 C 260 90, 150 160, 90 240 C 50 290, 40 360, 40 390 L 380 390 Z"
            fill="#f6e5d3"
            opacity="0.85"
          />
          {/* Layer 2: Pastel mint curve */}
          <path
            d="M370 140 C 270 140, 185 200, 135 265 C 100 310, 95 365, 90 390 L 370 390 Z"
            fill="#c2d4c0"
            opacity="0.75"
          />
          {/* Layer 3: Deep forest sage wave */}
          <path
            d="M370 190 C 290 190, 220 235, 180 295 C 155 330, 150 365, 145 390 L 370 390 Z"
            fill="#3a513d"
            opacity="0.95"
          />
        </svg>
      </motion.div>

      {/* ============================================================ */}
      {/* 3. CORNER CULINARY ACCENTS */}
      {/* ============================================================ */}
      {/* Top-Right Gourmet Artisan Pizza Plate */}
      <motion.div
        initial={{ x: 100, y: -100, opacity: 0 }}
        animate={{
          x: isExiting ? 120 : 0,
          y: isExiting ? -120 : 0,
          opacity: isExiting ? 0 : 0.95
        }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: '-25px',
          right: '-25px',
          width: '180px',
          height: '180px',
          pointerEvents: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.12))'
        }}
      >
        <svg viewBox="0 0 160 160" width="100%" height="100%">
          <circle cx="80" cy="80" r="72" fill="#ffffff" stroke="#f1ece5" strokeWidth="3" />
          <circle cx="80" cy="80" r="62" fill="#faf6f0" />
          <circle cx="80" cy="80" r="54" fill="#df9441" />
          <circle cx="80" cy="80" r="48" fill="#e53e3e" />
          <circle cx="80" cy="80" r="44" fill="#f6c042" />
          <circle cx="68" cy="65" r="5" fill="#c53030" />
          <circle cx="95" cy="72" r="5.5" fill="#c53030" />
          <circle cx="78" cy="95" r="5" fill="#c53030" />
          <ellipse cx="88" cy="60" rx="8" ry="4.5" fill="#2f855a" transform="rotate(-25 88 60)" />
          <ellipse cx="64" cy="88" rx="8" ry="4.5" fill="#2f855a" transform="rotate(35 64 88)" />
          <ellipse cx="96" cy="92" rx="7" ry="4" fill="#2f855a" transform="rotate(-15 96 92)" />
        </svg>
      </motion.div>

      {/* Bottom-Left Gourmet Salad / Pasta Bowl */}
      <motion.div
        initial={{ x: -100, y: 100, opacity: 0 }}
        animate={{
          x: isExiting ? -120 : 0,
          y: isExiting ? 120 : 0,
          opacity: isExiting ? 0 : 0.95
        }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: '-25px',
          left: '-25px',
          width: '190px',
          height: '190px',
          pointerEvents: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.12))'
        }}
      >
        <svg viewBox="0 0 160 160" width="100%" height="100%">
          <circle cx="80" cy="80" r="74" fill="#ffffff" stroke="#f1ece5" strokeWidth="3" />
          <circle cx="80" cy="80" r="64" fill="#f8f5ee" />
          <circle cx="80" cy="80" r="52" fill="#edd6b8" />
          <ellipse cx="75" cy="70" rx="22" ry="14" fill="#e2c092" transform="rotate(20 75 70)" />
          <ellipse cx="85" cy="88" rx="20" ry="13" fill="#e8c79c" transform="rotate(-15 85 88)" />
          <circle cx="70" cy="76" r="6" fill="#e53e3e" />
          <circle cx="94" cy="74" r="5" fill="#e53e3e" />
          <circle cx="82" cy="92" r="5.5" fill="#dd6b20" />
          <ellipse cx="82" cy="65" rx="11" ry="6" fill="#2f855a" transform="rotate(-30 82 65)" />
          <ellipse cx="64" cy="88" rx="10" ry="5.5" fill="#276749" transform="rotate(40 64 88)" />
          <ellipse cx="98" cy="85" rx="11" ry="6" fill="#2f855a" transform="rotate(10 98 85)" />
        </svg>
      </motion.div>

      {/* ============================================================ */}
      {/* 4. DELICATE FLOATING LINE DOODLES & BASIL LEAVES */}
      {/* ============================================================ */}
      {/* Top-Right Chef Hat Doodle */}
      <div
        className={styles.floatSlow}
        style={{
          position: 'absolute',
          top: '11%',
          right: '28%',
          width: '54px',
          height: '54px',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: isExiting ? 0 : 0.85,
          transition: 'opacity 0.35s ease'
        }}
      >
        <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="#d5c4af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 46 L46 46 L44 52 L20 52 Z" fill="#f8f4ed" fillOpacity="0.4" />
          <path d="M18 46 C12 44 8 36 14 30 C10 22 20 16 28 20 C32 12 44 12 48 20 C56 18 60 26 56 34 C60 40 56 46 46 46" />
          <line x1="24" y1="46" x2="24" y2="52" />
          <line x1="40" y1="46" x2="40" y2="52" />
        </svg>
      </div>

      {/* Mid-Left Cloche Food Cover Doodle */}
      <div
        className={styles.floatMed}
        style={{
          position: 'absolute',
          top: '36%',
          left: '8%',
          width: '64px',
          height: '64px',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: isExiting ? 0 : 0.85,
          transition: 'opacity 0.35s ease'
        }}
      >
        <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="#d5c4af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="18" r="3" fill="#d5c4af" />
          <path d="M12 42 C12 26 22 20 32 20 C42 20 52 26 52 42 Z" fill="#f8f4ed" fillOpacity="0.4" />
          <line x1="8" y1="44" x2="56" y2="44" strokeWidth="2.8" />
        </svg>
      </div>

      {/* Floating Sparkles ✦ */}
      <span
        className={styles.shimmerSparkle}
        style={{
          position: 'absolute',
          top: '32%',
          left: '22%',
          color: '#f59e0b',
          fontSize: '18px',
          fontWeight: 800,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: isExiting ? 0 : 0.85,
          transition: 'opacity 0.3s ease'
        }}
      >
        ✦
      </span>
      <span
        className={styles.shimmerSparkle}
        style={{
          position: 'absolute',
          top: '47%',
          right: '22%',
          color: '#d97706',
          fontSize: '16px',
          fontWeight: 800,
          pointerEvents: 'none',
          zIndex: 2,
          animationDelay: '0.8s',
          opacity: isExiting ? 0 : 0.85,
          transition: 'opacity 0.3s ease'
        }}
      >
        ✦
      </span>

      {/* Floating Realistic Green Leaves */}
      {[
        { top: '56%', left: '17%', r: -25, scale: 0.9, floatCls: styles.floatSlow },
        { top: '23%', right: '18%', r: 35, scale: 0.85, floatCls: styles.floatMed },
        { top: '60%', right: '12%', r: -40, scale: 0.95, floatCls: styles.floatFast },
        { bottom: '18%', left: '21%', r: 15, scale: 0.75, floatCls: styles.floatSlow }
      ].map((leaf, idx) => (
        <div
          key={idx}
          className={leaf.floatCls}
          style={{
            position: 'absolute',
            top: leaf.top,
            left: leaf.left,
            right: leaf.right,
            bottom: leaf.bottom,
            width: '32px',
            height: '32px',
            pointerEvents: 'none',
            zIndex: 2,
            transform: `rotate(${leaf.r}deg) scale(${leaf.scale})`,
            opacity: isExiting ? 0 : 0.92,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
            transition: 'opacity 0.3s ease'
          }}
        >
          <svg viewBox="0 0 36 36" width="100%" height="100%">
            <path
              d="M18 3 C26 3, 33 11, 31 22 C29 29, 21 33, 14 31 C7 29, 3 21, 5 12 C7 5, 12 3, 18 3 Z"
              fill="url(#cinematicLeafGrad)"
            />
            <path
              d="M18 5 C17 15, 15 23, 13 30"
              stroke="#68d391"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <defs>
              <linearGradient id="cinematicLeafGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#48bb78" />
                <stop offset="100%" stopColor="#22543d" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}

      {/* ============================================================ */}
      {/* 5. CENTER BRANDING & LOGO */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.82 : 1,
          y: isExiting ? -14 : 0
        }}
        transition={{
          duration: isExiting ? 0.32 : 0.5,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Logo Badge Seal with Ambient Golden Glow */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <div
            style={{
              position: 'absolute',
              inset: -12,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(202, 168, 77, 0.4) 0%, rgba(74, 93, 76, 0.15) 60%, transparent 75%)',
              filter: 'blur(12px)',
              pointerEvents: 'none'
            }}
          />

          <div
            style={{
              width: '112px',
              height: '112px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 45px -10px rgba(24, 59, 39, 0.22), 0 0 0 1px rgba(24, 59, 39, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '7px',
              position: 'relative',
              zIndex: 2
            }}
          >
            <img
              src={brandLogo}
              alt="DineviQ Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
        </div>

        {/* DINEVIQ AI ✦ Title */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '0.45rem' }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
              fontSize: '1.85rem',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#1a3320',
              margin: 0,
              lineHeight: 1
            }}
          >
            DINEVIQ
          </h1>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              padding: '3px 8px',
              borderRadius: '100px',
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              lineHeight: 1
            }}
          >
            AI <span style={{ color: '#d97706', fontSize: '9px' }}>✦</span>
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8rem',
            color: '#7a6e65',
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            margin: '0 0 1.6rem 0',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>THE ART OF GOOD TASTE</span>
          <span style={{ color: '#d97706', fontSize: '11px' }}>•</span>
          <span>RESTAURANT OS</span>
        </p>

        {/* ============================================================ */}
        {/* 6. ROTATING GRADIENT RING WITH FIXED STATIONARY UTENSILS */}
        {/* ============================================================ */}
        <div style={{ position: 'relative', width: '58px', height: '58px', marginBottom: '1.1rem' }}>
          {/* Pulsing ambient halo behind loader */}
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(34, 84, 61, 0.15) 60%, transparent 80%)',
              filter: 'blur(8px)',
              pointerEvents: 'none'
            }}
          />

          {/* Rotating Ring (Pure Hardware-accelerated CSS keyframe) */}
          <div className={styles.spinnerRing}>
            <svg viewBox="0 0 58 58" width="100%" height="100%">
              <defs>
                <linearGradient id="ringGradientUnified" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22543d" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle
                cx="29"
                cy="29"
                r="25"
                fill="none"
                stroke="url(#ringGradientUnified)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="90 60"
              />
            </svg>
          </div>

          {/* FIXED, STATIONARY UTENSIL ICON in Center */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#1a3320">
              <path d="M7 3 C7 5.5 8 7 9 7.5 L9 13 C9 13.5 9.5 14 10 14 C10.5 14 11 13.5 11 13 L11 7.5 C12 7 13 5.5 13 3 L12 3 L12 6 L10.5 6 L10.5 3 L9.5 3 L9.5 6 L8 6 L8 3 Z" />
              <path d="M15 3 C13.5 3 13 4.8 13 6.5 C13 8 14 9.2 15 9.6 L15 13 C15 13.5 15.5 14 16 14 C16.5 14 17 13.5 17 13 L17 9.6 C18 9.2 19 8 19 6.5 C19 4.8 18.5 3 17 3 Z" />
              <rect x="9.5" y="13" width="1" height="8" rx="0.5" />
              <rect x="15.5" y="13" width="1" height="8" rx="0.5" />
            </svg>
          </div>
        </div>

        {/* Loading status text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.82rem',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}
          >
            {statusText}
          </span>
        </div>

        {/* Subtle Green & Amber Gradient Accent Line */}
        <div
          style={{
            width: '180px',
            height: '2px',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(34, 84, 61, 0.4) 30%, rgba(245, 158, 11, 0.5) 70%, transparent 100%)'
          }}
        />
      </motion.div>
    </div>
  );
}

export default memo(CinematicLoaderComponent);

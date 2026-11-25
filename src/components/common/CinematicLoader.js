import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import brandLogo from '../../assets/logo.png';
import culinaryPastaDish from '../../assets/culinary-pasta-dish.png';
import culinaryPizzaDish from '../../assets/culinary-pizza-dish.png';
import basilLeaf from '../../assets/basil-leaf.png';
import styles from './CinematicLoader.module.css';

/**
 * Premium DINEVIQ Cinematic Intro-to-Dashboard Transition
 * - True high-resolution culinary photography (Pasta bowl & Artisan Pizza)
 * - Realistic floating basil leaves with ambient depth of field
 * - Pure white culinary steam / smoke bloom transition that reveals the dashboard
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

  // Phase 1 -> Phase 2 entrance timeline
  useEffect(() => {
    const timer = setTimeout(() => {
      entranceDoneRef.current = true;
      setPhase((prev) => (prev === 'entering' ? 'active' : prev));
      if (isReady && !exitStartedRef.current) {
        exitStartedRef.current = true;
        setPhase('exiting');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isReady]);

  // Fixed duration fallback (e.g. standalone PageLoader use)
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

  // When actual dashboard data is ready
  useEffect(() => {
    if (isReady && entranceDoneRef.current && !exitStartedRef.current) {
      exitStartedRef.current = true;
      setPhase('exiting');
    }
  }, [isReady]);

  // Handle final completion after culinary smoke dissolve finishes (750ms)
  useEffect(() => {
    if (phase === 'exiting') {
      const exitTimer = setTimeout(() => {
        setPhase('complete');
        if (onComplete) onComplete();
      }, 750);
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
      {/* Central Amber Halo Glow */}
      <div className={styles.haloGlow} />

      {/* ============================================================ */}
      {/* 1. TOP-LEFT ORGANIC SAGE WAVES                               */}
      {/* ============================================================ */}
      <motion.div
        initial={{ x: -140, y: -140, opacity: 0 }}
        animate={{
          x: isExiting ? -180 : 0,
          y: isExiting ? -180 : 0,
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 1.05 : 1
        }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
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
          <path
            d="M-40 210 C 60 210, 150 160, 210 90 C 250 40, 260 -20, 260 -50 L -40 -50 Z"
            fill="#f5e6d3"
            opacity="0.85"
          />
          <path
            d="M-30 170 C 40 170, 110 130, 160 80 C 195 40, 205 -20, 210 -40 L -30 -40 Z"
            fill="#c2d4c0"
            opacity="0.75"
          />
          <path
            d="M-30 130 C 30 130, 80 100, 120 60 C 150 25, 165 -15, 170 -40 L -30 -40 Z"
            fill="#3a513d"
            opacity="0.95"
          />
        </svg>
      </motion.div>

      {/* ============================================================ */}
      {/* 2. BOTTOM-RIGHT ORGANIC SAGE WAVES                           */}
      {/* ============================================================ */}
      <motion.div
        initial={{ x: 140, y: 140, opacity: 0 }}
        animate={{
          x: isExiting ? 180 : 0,
          y: isExiting ? 180 : 0,
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 1.05 : 1
        }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
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
          <path
            d="M380 90 C 260 90, 150 160, 90 240 C 50 290, 40 360, 40 390 L 380 390 Z"
            fill="#f6e5d3"
            opacity="0.85"
          />
          <path
            d="M370 140 C 270 140, 185 200, 135 265 C 100 310, 95 365, 90 390 L 370 390 Z"
            fill="#c2d4c0"
            opacity="0.75"
          />
          <path
            d="M370 190 C 290 190, 220 235, 180 295 C 155 330, 150 365, 145 390 L 370 390 Z"
            fill="#3a513d"
            opacity="0.95"
          />
        </svg>
      </motion.div>

      {/* ============================================================ */}
      {/* 3. REALISTIC GOURMET CULINARY DISHES (Photo-Real Quality)    */}
      {/* ============================================================ */}
      {/* Top-Right Authentic Woodfired Pizza on Ceramic Plate */}
      <motion.div
        initial={{ x: 90, y: -90, opacity: 0 }}
        animate={{
          x: isExiting ? 130 : 0,
          y: isExiting ? -130 : 0,
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.95 : 1
        }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          width: 'clamp(150px, 17vw, 210px)',
          pointerEvents: 'none',
          zIndex: 3,
          filter: 'drop-shadow(0 16px 32px rgba(24, 45, 30, 0.16))'
        }}
      >
        <img
          src={culinaryPizzaDish}
          alt="Artisan Pizza Plate"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: 'rotate(-4deg)'
          }}
        />
      </motion.div>

      {/* Bottom-Left Authentic Gourmet Pasta Dish on Ceramic Plate */}
      <motion.div
        initial={{ x: -90, y: 90, opacity: 0 }}
        animate={{
          x: isExiting ? -130 : 0,
          y: isExiting ? 130 : 0,
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.95 : 1
        }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: '-12px',
          left: '-12px',
          width: 'clamp(180px, 21vw, 260px)',
          pointerEvents: 'none',
          zIndex: 3,
          filter: 'drop-shadow(0 18px 36px rgba(24, 45, 30, 0.16))'
        }}
      >
        <img
          src={culinaryPastaDish}
          alt="Gourmet Pasta Bowl"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: 'rotate(2deg)'
          }}
        />
      </motion.div>

      {/* ============================================================ */}
      {/* 4. REALISTIC FLOATING BASIL LEAVES                           */}
      {/* ============================================================ */}
      {[
        { top: '23%', right: '19%', rot: 38, scale: 0.95, floatCls: styles.floatMed },
        { top: '59%', left: '17%', rot: -28, scale: 0.9, floatCls: styles.floatSlow },
        { top: '63%', right: '13%', rot: -36, scale: 1.0, floatCls: styles.floatFast },
        { bottom: '23%', left: '23%', rot: 18, scale: 0.78, floatCls: styles.floatSlow },
        { top: '16%', left: '6%', rot: -15, scale: 0.85, floatCls: styles.floatMed }
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
            width: '36px',
            height: '36px',
            pointerEvents: 'none',
            zIndex: 4,
            transform: `rotate(${leaf.rot}deg) scale(${leaf.scale})`,
            opacity: isExiting ? 0 : 0.95,
            filter: 'drop-shadow(0 6px 12px rgba(24, 45, 30, 0.18))',
            transition: 'opacity 0.35s ease'
          }}
        >
          <img
            src={basilLeaf}
            alt="Basil"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      ))}

      {/* ============================================================ */}
      {/* 5. CULINARY LINE DOODLES & SPARKLES                          */}
      {/* ============================================================ */}
      {/* Top-Right Chef Hat Doodle */}
      <div
        className={styles.floatSlow}
        style={{
          position: 'absolute',
          top: '11%',
          right: '27%',
          width: '56px',
          height: '56px',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: isExiting ? 0 : 0.75,
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
          left: '9%',
          width: '64px',
          height: '64px',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: isExiting ? 0 : 0.75,
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

      {/* ============================================================ */}
      {/* 6. CENTER BRANDING, SEAL & LOGO                              */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.88 : 1,
          y: isExiting ? -12 : 0
        }}
        transition={{
          duration: isExiting ? 0.35 : 0.55,
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
              inset: -14,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(202, 168, 77, 0.45) 0%, rgba(74, 93, 76, 0.18) 60%, transparent 75%)',
              filter: 'blur(14px)',
              pointerEvents: 'none'
            }}
          />

          <div
            style={{
              width: '116px',
              height: '116px',
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
              fontSize: '1.9rem',
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
            letterSpacing: '1.3px',
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
        {/* 7. ROTATING GRADIENT RING WITH STATIONARY UTENSILS           */}
        {/* ============================================================ */}
        <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '1.1rem' }}>
          {/* Pulsing ambient halo behind loader */}
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(34, 84, 61, 0.18) 60%, transparent 80%)',
              filter: 'blur(9px)',
              pointerEvents: 'none'
            }}
          />

          {/* Rotating Ring */}
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
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeDasharray="92 58"
              />
            </svg>
          </div>

          {/* Stationary Utensil Icon in Center */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.85rem' }}>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.84rem',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}
          >
            {statusText}
          </span>
        </div>

        {/* Green & Amber Gradient Accent Line */}
        <div
          style={{
            width: '180px',
            height: '2px',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(34, 84, 61, 0.45) 30%, rgba(245, 158, 11, 0.55) 70%, transparent 100%)'
          }}
        />
      </motion.div>

      {/* ============================================================ */}
      {/* 8. WHITE CULINARY SMOKE / STEAM REVEAL TRANSITION            */}
      {/* ============================================================ */}
      {isExiting && (
        <div className={styles.smokeLayer}>
          <div className={styles.smokeBackdropBlur} />
          <div className={styles.smokePuffCenter} />
          <div className={styles.smokePuffBottomLeft} />
          <div className={styles.smokePuffTopRight} />
        </div>
      )}
    </div>
  );
}

export default memo(CinematicLoaderComponent);

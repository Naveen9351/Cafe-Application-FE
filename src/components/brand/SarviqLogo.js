import React from 'react';

export default function ServiqLogo({
  size = 'md',
  theme = 'light',
  showSubtitle = true,
  subtitle = 'The Art of Good Taste',
  showBadge = true,
  animated = true,
  className = '',
  onClick
}) {
  const isDark = theme === 'dark';

  // Dimension scale config
  const dimensions = {
    xs: { iconSize: 26, titleClass: '14px', subClass: '9px', gap: '6px' },
    sm: { iconSize: 32, titleClass: '16px', subClass: '10px', gap: '8px' },
    md: { iconSize: 42, titleClass: '20px', subClass: '11px', gap: '10px' },
    lg: { iconSize: 50, titleClass: '24px', subClass: '12px', gap: '12px' },
    xl: { iconSize: 62, titleClass: '30px', subClass: '13px', gap: '14px' },
  }[size] || { iconSize: 42, titleClass: '20px', subClass: '11px', gap: '10px' };

  return (
    <div
      onClick={onClick}
      className={`sarviq-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dimensions.gap,
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'default',
        textDecoration: 'none'
      }}
    >
      {/* ── Luxury Precision Geometric S Monogram Emblem ── */}
      <div
        className="sarviq-logo-icon-wrapper"
        style={{
          position: 'relative',
          width: dimensions.iconSize,
          height: dimensions.iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {/* Soft Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            inset: -2,
            background: 'radial-gradient(circle, rgba(74,93,76,0.3) 0%, rgba(202,168,77,0.2) 60%, transparent 80%)',
            borderRadius: '50%',
            filter: 'blur(5px)',
            opacity: 0.8
          }}
        />

        <img
          src="/logo.png"
          alt="DineviQ Logo"
          onError={(e) => {
            // Fallback to vector SVG if image fails
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
          }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            boxShadow: isDark
              ? '0 3px 12px rgba(0,0,0,0.4)'
              : '0 3px 10px rgba(0,0,0,0.1)',
            filter: isDark ? 'drop-shadow(0 2px 6px rgba(202,168,77,0.25))' : 'none'
          }}
        />

        <svg
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: 'none',
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 2,
            filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.25))'
          }}
        >
          <defs>
            <linearGradient id="sarviq_primary_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="55%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="sarviq_squircle_bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? '#0f172a' : '#ffffff'} />
              <stop offset="100%" stopColor={isDark ? '#020617' : '#f8fafc'} />
            </linearGradient>
            <linearGradient id="sarviq_border_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(37,99,235,0.4)" />
              <stop offset="50%" stopColor="rgba(79,70,229,0.3)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0.4)" />
            </linearGradient>
          </defs>
          <rect
            x="2.5"
            y="2.5"
            width="47"
            height="47"
            rx="14"
            fill="url(#sarviq_squircle_bg)"
            stroke="url(#sarviq_border_grad)"
            strokeWidth="1.5"
          />
          <path
            d="M 16 11 L 26 11 C 34.5 11 39.5 16.5 39.5 26 C 39.5 35.5 34.5 41 26 41 L 16 41 Z"
            stroke="url(#sarviq_primary_grad)"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="11" r="2.2" fill="#2563eb" />
          <circle cx="39.5" cy="26" r="2.8" fill="#ffffff" stroke="#4f46e5" strokeWidth="1.5" />
          <circle cx="16" cy="41" r="2.2" fill="#06b6d4" />
        </svg>
      </div>

      {/* ── Brand Typography ── */}
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: dimensions.titleClass,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              color: isDark ? '#ffffff' : '#0f172a',
              margin: 0
            }}
          >
            DINEVIQ
          </span>


        </div>


      </div>
    </div>
  );
}

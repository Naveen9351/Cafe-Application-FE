import React from 'react';

export default function SarviqLogo({
  size = 'md',
  theme = 'light',
  showSubtitle = true,
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
            background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(79,70,229,0.15) 50%, transparent 75%)',
            borderRadius: '14px',
            filter: 'blur(6px)',
            opacity: 0.8
          }}
        />

        <svg
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 2,
            filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.25))'
          }}
        >
          <defs>
            {/* Ultra-smooth Royal Blue to Indigo to Cyan Gradient */}
            <linearGradient id="sarviq_primary_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="55%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Subtle Surface Gradient for Background Rounded Squircle */}
            <linearGradient id="sarviq_squircle_bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? '#0f172a' : '#ffffff'} />
              <stop offset="100%" stopColor={isDark ? '#020617' : '#f8fafc'} />
            </linearGradient>

            <linearGradient id="sarviq_border_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(37,99,235,0.4)" />
              <stop offset="50%" stopColor="rgba(79,70,229,0.3)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0.4)" />
            </linearGradient>

            <filter id="sarviq_subtle_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Premium Squircle Shield */}
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

          {/* Precision AI Continuous Curve S Monogram */}
          {/* Top Arc & Loop */}
          <path
            d="M 37 18 C 37 12.5 32 8.5 25 8.5 C 17.5 8.5 13 13 13 18.5 C 13 24 18 26.5 26 28.5 C 33.5 30.5 37.5 33 37.5 38.5 C 37.5 44.5 32.5 48.5 25 48.5 C 17.5 48.5 13 44 13 39"
            stroke="url(#sarviq_primary_grad)"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={animated ? "url(#sarviq_subtle_glow)" : undefined}
          />

          {/* Futuristic Precision Core Nodes */}
          <circle cx="25" cy="8.5" r="2.2" fill="#2563eb" />
          <circle cx="26" cy="28.5" r="2.8" fill="#ffffff" stroke="#4f46e5" strokeWidth="1.5" />
          <circle cx="25" cy="48.5" r="2.2" fill="#06b6d4" />
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
            SARVIQ
          </span>

          {showBadge && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(79,70,229,0.12) 100%)',
                color: '#2563eb',
                border: '1px solid rgba(37,99,235,0.25)',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              AI OS
            </span>
          )}
        </div>

        {showSubtitle && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: dimensions.subClass,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isDark ? '#94a3b8' : '#64748b',
              marginTop: '3px'
            }}
          >
            Autonomous Restaurant OS
          </span>
        )}
      </div>
    </div>
  );
}

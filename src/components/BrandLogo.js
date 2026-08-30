import React from 'react';

/**
 * Reusable BrandLogo component for RASTRORATO
 * Automatically selects the appropriate logo based on theme ('light' or 'dark').
 */
export default function BrandLogo({ 
  theme = 'light', // 'light' for light backgrounds, 'dark' for dark backgrounds
  size = 'md', 
  showText = true, 
  showSubtitle = false, 
  onClick, 
  style = {} 
}) {
  let imgSize = 36;
  let textSize = 'clamp(1.02rem, 3.8vw, 1.25rem)';
  let badgeRadius = '8px';

  if (size === 'sm') {
    imgSize = 28;
    textSize = 'clamp(0.92rem, 3.5vw, 1.05rem)';
    badgeRadius = '6px';
  } else if (size === 'lg') {
    imgSize = 50;
    textSize = 'clamp(1.3rem, 4vw, 1.6rem)';
    badgeRadius = '12px';
  } else if (size === 'xl') {
    imgSize = 70;
    textSize = 'clamp(1.6rem, 5vw, 2.1rem)';
    badgeRadius = '16px';
  }

  // Choose logo based on background theme
  const logoSrc = theme === 'dark' 
    ? '/logos/dark-logo.jpeg' 
    : '/logos/light-logo.jpeg';

  const textColor = theme === 'dark' ? '#ffffff' : '#0f172a';
  const subtextColor = theme === 'dark' ? '#f97316' : '#059669';

  return (
    <div 
      onClick={onClick} 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: size === 'sm' ? '0.6rem' : '0.8rem', 
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style 
      }}
    >
      {/* Crisp Logo Badge */}
      <div style={{
        width: `${imgSize}px`,
        height: `${imgSize}px`,
        borderRadius: badgeRadius,
        backgroundColor: theme === 'dark' ? '#181b22' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: theme === 'dark' 
          ? '0 3px 10px rgba(0, 0, 0, 0.4)' 
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: theme === 'dark' 
          ? '1px solid rgba(255, 255, 255, 0.12)' 
          : '1px solid rgba(0, 0, 0, 0.08)',
        flexShrink: 0,
      }}>
        <img 
          src={logoSrc} 
          alt="RASTRORATO" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            objectPosition: 'center 15%',
            display: 'block',
          }} 
        />
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ 
            fontWeight: '900', 
            fontSize: textSize, 
            letterSpacing: '0.4px', 
            color: textColor 
          }}>
            RASTRORATO
          </span>
          {showSubtitle && (
            <span style={{ 
              fontSize: '0.62rem', 
              color: subtextColor, 
              fontWeight: '800', 
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}>
              DIGITAL RESTAURANT PLATFORM
            </span>
          )}
        </div>
      )}
    </div>
  );
}

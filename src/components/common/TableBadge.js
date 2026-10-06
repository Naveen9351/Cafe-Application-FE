import React from 'react';

export function TableIcon({ size = 16, color = "currentColor", strokeWidth = 2.2, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      <ellipse cx="12" cy="7" rx="8.5" ry="3.2" />
      <path d="M12 10.2v8.8" />
      <path d="M7.5 19h9" />
    </svg>
  );
}

export default function TableBadge({
  tableNumber,
  isDarkMode = false,
  className = "",
  style = {}
}) {
  if (!tableNumber && tableNumber !== 0) return null;

  const rawTableStr = String(tableNumber || '').trim();
  const cleanTableNumber = rawTableStr.replace(/^Table\s*#?/i, '').trim() || rawTableStr;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 9px',
        borderRadius: '9px',
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)'}`,
        color: isDarkMode ? '#f8fafc' : '#0f172a',
        fontSize: '0.8rem',
        fontWeight: '700',
        lineHeight: 1,
        userSelect: 'none',
        boxSizing: 'border-box',
        ...style
      }}
      title={`Table ${cleanTableNumber}`}
    >
      <TableIcon size={15} />
      <span>{cleanTableNumber}</span>
    </div>
  );
}

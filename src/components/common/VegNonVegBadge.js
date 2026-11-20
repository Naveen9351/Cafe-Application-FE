import React from 'react';

/**
 * Standard Indian Veg & Non-Veg Dietary Symbol
 * Green square border with centered solid green circle for Veg
 * Red square border with centered solid red circle for Non-Veg
 * Zero text — pure icon only.
 */
export default function VegNonVegBadge({ isVeg = true, size = 15, style = {}, className = '' }) {
  const isVegetarian = Boolean(isVeg);
  const color = isVegetarian ? '#16a34a' : '#dc2626';
  const dotSize = Math.max(5, Math.round(size * 0.46));

  return (
    <span
      className={className}
      title={isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        border: `1.5px solid ${color}`,
        borderRadius: '3px',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        ...style
      }}
    >
      <span
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'block'
        }}
      />
    </span>
  );
}

export { VegNonVegBadge };

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Star, Plus, Minus,
  Check, Utensils, Flame, Sparkles
} from 'lucide-react';
import { getValidFoodImage } from './AdminPanel';

export function FssaiDietaryBadge({ isVeg = true, size = 16 }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid ${isVeg ? '#16a34a' : '#dc2626'}`,
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5px',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        boxShadow: `0 2px 6px ${isVeg ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`
      }}
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: isVeg ? '#16a34a' : '#dc2626'
        }}
      />
    </div>
  );
}

export default function DishDetailsModal({
  dish,
  isOpen,
  onClose,
  onAddToCart,
  onOpenCustomization,
  isDarkMode = false,
  isFavorite: externalIsFavorite,
  onToggleFavorite
}) {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dish) return null;

  const isFavorite = externalIsFavorite !== undefined ? externalIsFavorite : internalFavorite;

  const handleToggleFav = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(dish, e);
    } else {
      setInternalFavorite(prev => !prev);
    }
  };

  const discount = dish.discount || {};
  const hasDiscount = Boolean(discount.isDiscounted && discount.value > 0);
  let discountedPrice = dish.price;
  if (hasDiscount) {
    if (discount.type === 'percentage') {
      discountedPrice = Math.max(0, Math.round(dish.price * (1 - discount.value / 100)));
    } else {
      discountedPrice = Math.max(0, dish.price - discount.value);
    }
  }

  const vars = dish.variants || dish.sizes || dish.portionSizes || [];
  const addons = dish.addons || [];
  const isCustomizable = vars.length > 0 || addons.length > 0;
  const isOutOfStock = dish.available === false || dish.isAvailable === false;
  const isVeg = dish.isVeg !== false;

  // Modern luxury theme tokens
  const bg = isDarkMode ? '#121110' : '#ffffff';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc';
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const accent = '#ea580c';
  const accentGlow = 'rgba(234, 88, 12, 0.3)';

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: dish.name,
        text: `Check out ${dish.name} on our menu!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAction = (e) => {
    if (isOutOfStock) return;
    if (isCustomizable) {
      onOpenCustomization(dish);
    } else {
      onAddToCart(dish, e, null, [], "", quantity);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          overflowY: 'auto'
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '480px',
            maxHeight: '92vh',
            backgroundColor: bg,
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            borderTop: `1px solid ${border}`
          }}
        >
          {/* Scrollable Modal Content */}
          <div style={{
            overflowY: 'auto',
            paddingBottom: '88px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* Hero Image Showcase */}
            <div style={{ position: 'relative', width: '100%', height: '290px', flexShrink: 0, overflow: 'hidden' }}>
              <motion.img
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                src={getValidFoodImage(dish)}
                alt={dish.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";
                }}
              />

              {/* Gradient Overlays */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)'
              }} />

              {/* Top Navigation Controls */}
              <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
              }}>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}
                  title="Close"
                >
                  <ArrowLeft size={20} strokeWidth={2.5} />
                </motion.button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                    title="Share"
                  >
                    {copied ? <Check size={18} color="#22c55e" strokeWidth={3} /> : <Share2 size={18} strokeWidth={2.2} />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleFav}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: isFavorite ? '#ef4444' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}
                    title="Favorite"
                  >
                    <motion.div animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}>
                      <Heart size={19} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2.2} />
                    </motion.div>
                  </motion.button>
                </div>
              </div>

              {/* Bottom Image Badges (Rating & Discount) */}
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 5
              }}>
                {dish.rating ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: '800'
                  }}>
                    <Star size={13} color="#fbbf24" fill="#fbbf24" />
                    <span>{dish.rating}</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(234, 88, 12, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '100px'
                  }}>
                    <Sparkles size={12} />
                    <span>Chef's Choice</span>
                  </div>
                )}

                {hasDiscount && (
                  <span style={{
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: '900',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}>
                    {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                  </span>
                )}
              </div>
            </div>

            {/* Dish Information Section */}
            <div style={{
              padding: '1.25rem 1.25rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Category & Dietary Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FssaiDietaryBadge isVeg={isVeg} size={16} />
                  <span style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    fontWeight: '800',
                    letterSpacing: '0.05em',
                    color: isVeg ? '#16a34a' : '#dc2626'
                  }}>
                    {isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>

                {dish.category && (
                  <span style={{
                    fontSize: '0.72rem',
                    textTransform: 'capitalize',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    backgroundColor: cardBg,
                    color: textMuted,
                    border: `1px solid ${border}`
                  }}>
                    {dish.category}
                  </span>
                )}
              </div>

              {/* Dish Name */}
              <h1 style={{
                fontSize: '1.45rem',
                fontWeight: '900',
                color: textMain,
                margin: 0,
                lineHeight: 1.25,
                letterSpacing: '-0.02em'
              }}>
                {dish.name}
              </h1>

              {/* Price Details */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: '900', color: hasDiscount ? '#16a34a' : textMain, letterSpacing: '-0.02em' }}>
                  ₹{discountedPrice}
                </span>
                {hasDiscount && (
                  <span style={{ fontSize: '1.1rem', color: textMuted, textDecoration: 'line-through', fontWeight: '600' }}>
                    ₹{dish.price}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: textMuted, fontWeight: '600' }}>
                  (Inclusive of taxes)
                </span>
              </div>

              {/* Authentic Description (Only shown if description exists) */}
              {dish.description && dish.description.trim() && (
                <div style={{
                  backgroundColor: cardBg,
                  padding: '1rem 1.1rem',
                  borderRadius: '16px',
                  border: `1px solid ${border}`,
                  marginTop: '0.2rem'
                }}>
                  <p style={{
                    fontSize: '0.88rem',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    lineHeight: 1.6,
                    margin: 0,
                    fontWeight: '450'
                  }}>
                    {dish.description}
                  </p>
                </div>
              )}

              {/* Customization Notice Pill (if item has options) */}
              {isCustomizable && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.1)' : '#fff7ed',
                  border: `1px solid ${isDarkMode ? 'rgba(234, 88, 12, 0.25)' : '#fed7aa'}`,
                  color: isDarkMode ? '#fdba74' : '#c2410c'
                }}>
                  <Sparkles size={15} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                    Customisable with portion sizes and add-ons
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px))',
            backgroundColor: isDarkMode ? 'rgba(18, 17, 16, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -10px 25px rgba(0,0,0,0.12)',
            zIndex: 20
          }}>
            {!isCustomizable ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                backgroundColor: cardBg,
                border: `1.5px solid ${border}`,
                borderRadius: '14px',
                padding: '6px 14px'
              }}>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', padding: 2, display: 'flex' }}
                >
                  <Minus size={16} strokeWidth={3} />
                </motion.button>
                <span style={{ fontSize: '0.95rem', fontWeight: '900', color: textMain, minWidth: '16px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', padding: 2, display: 'flex' }}
                >
                  <Plus size={16} strokeWidth={3} />
                </motion.button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: textMain, lineHeight: 1.1 }}>
                  ₹{discountedPrice}
                </div>
                <span style={{ fontSize: '0.7rem', color: textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Base Price</span>
              </div>
            )}

            <motion.button
              whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
              disabled={isOutOfStock}
              onClick={handleAction}
              style={{
                background: isOutOfStock ? '#64748b' : `linear-gradient(135deg, ${accent}, #c2410c)`,
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '0.94rem',
                padding: '0.8rem 1.6rem',
                borderRadius: '14px',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                boxShadow: isOutOfStock ? 'none' : `0 6px 20px ${accentGlow}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.01em'
              }}
            >
              <Utensils size={16} />
              <span>
                {isOutOfStock ? 'Out of Stock' : (isCustomizable ? 'Customise' : `Add • ₹${discountedPrice * quantity}`)}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

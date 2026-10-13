import React, { useState, useEffect } from 'react';
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
  const [cachedDish, setCachedDish] = useState(dish);

  useEffect(() => {
    if (dish) {
      setCachedDish(dish);
      setQuantity(1);
      setCopied(false);
    }
  }, [dish]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const activeDish = dish || cachedDish;
  const isFavorite = externalIsFavorite !== undefined ? externalIsFavorite : internalFavorite;

  const handleToggleFav = (e) => {
    e.stopPropagation();
    if (onToggleFavorite && activeDish) {
      onToggleFavorite(activeDish, e);
    } else {
      setInternalFavorite(prev => !prev);
    }
  };

  const discount = activeDish?.discount || {};
  const hasDiscount = Boolean(discount.isDiscounted && discount.value > 0);
  let discountedPrice = activeDish?.price || 0;
  if (hasDiscount && activeDish?.price) {
    if (discount.type === 'percentage') {
      discountedPrice = Math.max(0, Math.round(activeDish.price * (1 - discount.value / 100)));
    } else {
      discountedPrice = Math.max(0, activeDish.price - discount.value);
    }
  }

  const vars = activeDish?.variants || activeDish?.sizes || activeDish?.portionSizes || [];
  const addons = activeDish?.addons || [];
  const isCustomizable = vars.length > 0 || addons.length > 0;
  const isOutOfStock = activeDish?.available === false || activeDish?.isAvailable === false;
  const isVeg = activeDish?.isVeg !== false;

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
    if (!activeDish) return;
    if (navigator.share) {
      navigator.share({
        title: activeDish.name,
        text: `Check out ${activeDish.name} on our menu!`,
        url: window.location.href
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAction = (e) => {
    if (isOutOfStock || !activeDish) return;
    if (isCustomizable) {
      onOpenCustomization(activeDish);
    } else {
      onAddToCart(activeDish, e, null, [], "", quantity);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && activeDish && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              minHeight: '100dvh',
              maxHeight: '100dvh',
              backgroundColor: bg,
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: isDarkMode ? '0 0 50px rgba(0,0,0,0.85)' : '0 0 50px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              borderLeft: `1px solid ${border}`,
              borderRight: `1px solid ${border}`
            }}
          >
            {/* Embedded style to hide scrollbar across all browsers */}
            <style>{`
              .dish-details-scroll::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
            `}</style>

            {/* Pinned Top Navigation Controls (Never Scrolls Away) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 30,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)',
              pointerEvents: 'none'
            }}>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  pointerEvents: 'auto',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
                }}
                title="Close"
                aria-label="Back to menu"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </motion.button>

              <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
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
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: isFavorite ? '#ef4444' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
                  }}
                  title="Favorite"
                >
                  <motion.div animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}>
                    <Heart size={19} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2.2} />
                  </motion.div>
                </motion.button>
              </div>
            </div>

            {/* Scrollable Page Content (Scrollbar Hidden) */}
            <div
              className="dish-details-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Hero Image Showcase */}
              <div style={{ position: 'relative', width: '100%', height: '330px', flexShrink: 0, overflow: 'hidden' }}>
                <motion.img
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  src={getValidFoodImage(activeDish)}
                  alt={activeDish.name}
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
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 35%, transparent 60%, rgba(0,0,0,0.7) 100%)'
                }} />

                {/* Bottom Image Badges (Rating & Discount) */}
                <div style={{
                  position: 'absolute',
                  bottom: 38,
                  left: 16,
                  right: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 5
                }}>
                  {activeDish?.rating ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(15, 23, 42, 0.78)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      padding: '5px 12px',
                      borderRadius: '100px',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
                    }}>
                      <Star size={13} color="#fbbf24" fill="#fbbf24" />
                      <span>{activeDish.rating}</span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(234, 88, 12, 0.9)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      padding: '5px 12px',
                      borderRadius: '100px',
                      boxShadow: '0 4px 15px rgba(234, 88, 12, 0.35)'
                    }}>
                      <Sparkles size={12} />
                      <span>Chef's Choice</span>
                    </div>
                  )}

                  {hasDiscount && (
                    <span style={{
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: '900',
                      padding: '5px 12px',
                      borderRadius: '100px',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.45)',
                      border: '1px solid rgba(255,255,255,0.35)',
                      letterSpacing: '0.02em'
                    }}>
                      {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                    </span>
                  )}
                </div>
              </div>

              {/* Dish Information Section (Curved Sheet Transition Over Image) */}
              <div style={{
                position: 'relative',
                zIndex: 6,
                marginTop: '-24px',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                backgroundColor: bg,
                boxShadow: isDarkMode ? '0 -10px 30px rgba(0,0,0,0.7)' : '0 -10px 30px rgba(15,23,42,0.06)',
                padding: '1.25rem 1.25rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: `1px solid ${border}`
              }}>
                {/* Visual Handle Pill */}
                <div style={{
                  width: '36px',
                  height: '4px',
                  borderRadius: '100px',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
                  margin: '-4px auto 4px',
                  flexShrink: 0
                }} />
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

                  {activeDish?.category && (
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
                      {activeDish.category}
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
                  {activeDish?.name}
                </h1>

                {/* Price Details */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: '900', color: hasDiscount ? '#16a34a' : textMain, letterSpacing: '-0.02em' }}>
                    ₹{discountedPrice}
                  </span>
                  {hasDiscount && (
                    <span style={{ fontSize: '1.1rem', color: textMuted, textDecoration: 'line-through', fontWeight: '600' }}>
                      ₹{activeDish?.price}
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: textMuted, fontWeight: '600' }}>
                    (Inclusive of taxes)
                  </span>
                </div>

                {/* Authentic Description (Only shown if description exists) */}
                {activeDish?.description && activeDish.description.trim() && (
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
                      {activeDish.description}
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
              backgroundColor: isDarkMode ? 'rgba(18, 17, 16, 0.98)' : 'rgba(255, 255, 255, 0.98)',
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
                  {isOutOfStock ? 'Out of Stock' : (isCustomizable ? `Add • ₹${discountedPrice}` : `Add • ₹${discountedPrice * quantity}`)}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

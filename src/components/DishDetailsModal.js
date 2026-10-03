import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Star, Clock, Flame, Sparkles, Plus, Minus,
  Check, Info, Utensils, ShieldCheck, Award, Leaf, Zap, ThumbsUp, Coffee,
  Salad, Wheat, Droplets
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
  isDarkMode = false
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dish) return null;

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

  // Modern luxury theme tokens
  const bg = isDarkMode ? '#0f0d0a' : '#fcfcfd';
  const sheetBg = isDarkMode ? '#171410' : '#ffffff';
  const cardBg = isDarkMode ? '#211c16' : '#f8fafc';
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#a1a1aa' : '#64748b';
  const border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const accent = '#ea580c';
  const accentGlow = 'rgba(234, 88, 12, 0.35)';

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

  // Curated gourmet highlights based on item properties
  const isVeg = dish.isVeg !== false;
  const ingredientChips = [
    { label: isVeg ? "Farm-Fresh Produce" : "Premium Prime Cut", icon: Leaf, color: isVeg ? "#16a34a" : "#ea580c" },
    { label: "Artisanal Spices", icon: Sparkles, color: "#f59e0b" },
    { label: "Freshly Made to Order", icon: Flame, color: "#ef4444" },
    { label: "Zero Artificial Preservatives", icon: ShieldCheck, color: "#3b82f6" }
  ];

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
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto'
        }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '460px',
            minHeight: '100vh',
            maxHeight: '100vh',
            backgroundColor: bg,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {/* Hero Image Showcase with Parallax Glass Floating Actions */}
          <div style={{ position: 'relative', width: '100%', height: '340px', flexShrink: 0, overflow: 'hidden' }}>
            <motion.img
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              src={getValidFoodImage(dish)}
              alt={dish.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";
              }}
            />

            {/* Cinematic Gradient Overlays */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 35%, transparent 60%, rgba(0,0,0,0.85) 100%)'
            }} />

            {/* Top Floating Glass Navigation Controls */}
            <div style={{
              position: 'absolute',
              top: 18,
              left: 16,
              right: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
                }}
                title="Back to Menu"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </motion.button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleShare}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
                  }}
                  title="Share Dish"
                >
                  {copied ? <Check size={18} color="#22c55e" strokeWidth={3} /> : <Share2 size={18} strokeWidth={2.2} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setIsFavorite(!isFavorite)}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: isFavorite ? '#ef4444' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
                  }}
                  title="Save to Favorites"
                >
                  <motion.div animate={isFavorite ? { scale: [1, 1.35, 1] } : { scale: 1 }}>
                    <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2.2} />
                  </motion.div>
                </motion.button>
              </div>
            </div>

            {/* Bottom Hero Glass Floating Badges */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: 18,
              right: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              zIndex: 5
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '5px 12px',
                borderRadius: '100px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
              }}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{dish.rating || '4.8'}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: '600' }}>(150+ reviews)</span>
              </div>

              {hasDiscount ? (
                <span style={{
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  boxShadow: '0 4px 15px rgba(234, 88, 12, 0.5)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                </span>
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
                  borderRadius: '100px',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)'
                }}>
                  <Sparkles size={12} />
                  <span>Chef's Choice</span>
                </div>
              )}
            </div>
          </div>

          {/* Elevated Details Content Area */}
          <div style={{
            position: 'relative',
            marginTop: '-16px',
            backgroundColor: sheetBg,
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            padding: '1.4rem 1.25rem 6.5rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            borderTop: `1px solid ${border}`,
            boxShadow: '0 -10px 30px rgba(0,0,0,0.1)'
          }}>
            {/* Dietary & Category Header Line */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FssaiDietaryBadge isVeg={dish.isVeg !== false} size={17} />
                  <span style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    fontWeight: '800',
                    letterSpacing: '0.06em',
                    color: dish.isVeg !== false ? '#16a34a' : '#dc2626'
                  }}>
                    {dish.isVeg !== false ? '100% Pure Veg' : 'Non-Vegetarian'}
                  </span>
                </div>

                {dish.category && (
                  <span style={{
                    fontSize: '0.72rem',
                    textTransform: 'capitalize',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    backgroundColor: isDarkMode ? '#241e17' : '#f1f5f9',
                    color: textMuted,
                    border: `1px solid ${border}`
                  }}>
                    {dish.category}
                  </span>
                )}
              </div>

              {/* Dish Name */}
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: textMain,
                margin: '0 0 8px 0',
                lineHeight: 1.22,
                letterSpacing: '-0.02em'
              }}>
                {dish.name}
              </h1>

              {/* Price Row with Tax Tag */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '1.65rem', fontWeight: '900', color: hasDiscount ? '#16a34a' : textMain, letterSpacing: '-0.02em' }}>
                  ₹{discountedPrice}
                </span>
                {hasDiscount && (
                  <span style={{ fontSize: '1.15rem', color: textMuted, textDecoration: 'line-through', fontWeight: '600' }}>
                    ₹{dish.price}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: textMuted, fontWeight: '600' }}>
                  (Inclusive of all taxes)
                </span>
              </div>
            </div>

            {/* 3 Luxury Highlight Cards (Grid) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem'
            }}>
              <div style={{
                padding: '0.85rem 0.6rem',
                borderRadius: '16px',
                backgroundColor: cardBg,
                border: `1px solid ${border}`,
                textAlign: 'center',
                boxShadow: isDarkMode ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(234, 88, 12, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px'
                }}>
                  <Clock size={16} color={accent} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '0.68rem', color: textMuted, fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Prep Time</span>
                <span style={{ fontSize: '0.86rem', color: textMain, fontWeight: '800' }}>15-20 mins</span>
              </div>

              <div style={{
                padding: '0.85rem 0.6rem',
                borderRadius: '16px',
                backgroundColor: cardBg,
                border: `1px solid ${border}`,
                textAlign: 'center',
                boxShadow: isDarkMode ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px'
                }}>
                  <Flame size={16} color="#f59e0b" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '0.68rem', color: textMuted, fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Freshness</span>
                <span style={{ fontSize: '0.86rem', color: textMain, fontWeight: '800' }}>Made to Order</span>
              </div>

              <div style={{
                padding: '0.85rem 0.6rem',
                borderRadius: '16px',
                backgroundColor: cardBg,
                border: `1px solid ${border}`,
                textAlign: 'center',
                boxShadow: isDarkMode ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px'
                }}>
                  <Award size={16} color="#3b82f6" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '0.68rem', color: textMuted, fontWeight: '700', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quality</span>
                <span style={{ fontSize: '0.86rem', color: textMain, fontWeight: '800' }}>Chef Master</span>
              </div>
            </div>

            {/* Rich Gourmet Story / Description */}
            <div style={{
              backgroundColor: cardBg,
              padding: '1.1rem 1.15rem',
              borderRadius: '18px',
              border: `1px solid ${border}`,
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <Utensils size={15} color={accent} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: textMain, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Flavor Story & Recipe
                </h3>
              </div>
              <p style={{
                fontSize: '0.88rem',
                color: isDarkMode ? '#d4d4d8' : '#475569',
                lineHeight: 1.55,
                margin: 0,
                fontWeight: '500'
              }}>
                {dish.description || "Prepared fresh to order using authentic secret spices, prime hand-selected ingredients, and artisanal cooking techniques to deliver an unparalleled gourmet taste."}
              </p>
            </div>

            {/* Gourmet Ingredients & Taste Highlights Showcase */}
            <div style={{
              backgroundColor: cardBg,
              padding: '1.1rem 1.15rem',
              borderRadius: '18px',
              border: `1px solid ${border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Sparkles size={15} color="#f59e0b" />
                <h3 style={{ fontSize: '0.86rem', fontWeight: '800', color: textMain, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Gourmet Highlights & Taste Notes
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {ingredientChips.map((chip, idx) => {
                  const IconComp = chip.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '12px',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
                        border: `1px solid ${border}`
                      }}
                    >
                      <IconComp size={15} color={chip.color} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: textMain, lineHeight: 1.25 }}>
                        {chip.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chef's Pairing Recommendation */}
            <div style={{
              backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.08)' : '#fffaf5',
              padding: '1rem 1.15rem',
              borderRadius: '18px',
              border: `1.5px solid ${isDarkMode ? 'rgba(234, 88, 12, 0.25)' : '#fed7aa'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: accent,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(234, 88, 12, 0.3)'
              }}>
                <Coffee size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: textMain, marginBottom: '3px' }}>
                  Chef's Perfect Pairing
                </div>
                <p style={{ fontSize: '0.78rem', color: textMuted, margin: 0, lineHeight: 1.45 }}>
                  Best savored alongside our handcrafted beverages or seasoned crispy appetizers for the ultimate dining experience.
                </p>
              </div>
            </div>

            {/* Hygiene & Kitchen Quality Pledge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.8rem 1rem',
              borderRadius: '16px',
              backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
              border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`
            }}>
              <ShieldCheck size={22} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#4ade80' : '#166534', fontWeight: '800' }}>
                  100% Contactless & Certified Clean Kitchen
                </div>
                <span style={{ fontSize: '0.72rem', color: isDarkMode ? '#86efac' : '#15803d', fontWeight: '600' }}>
                  Prepared fresh adhering to strict FSSAI food safety and hygiene protocols.
                </span>
              </div>
            </div>
          </div>

          {/* Luxury Floating Bottom Sticky Action Bar */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '460px',
            padding: '0.9rem 1.25rem',
            backgroundColor: isDarkMode ? 'rgba(23, 20, 16, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
            zIndex: 20,
            boxSizing: 'border-box'
          }}>
            {/* Quantity Stepper (if single variant) */}
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
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: textMain, lineHeight: 1.1 }}>
                  ₹{discountedPrice}
                </div>
                <span style={{ fontSize: '0.7rem', color: textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Base Price</span>
              </div>
            )}

            {/* Add to Cart / Customize Button */}
            <motion.button
              whileHover={!isOutOfStock ? { scale: 1.03 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
              disabled={isOutOfStock}
              onClick={handleAction}
              style={{
                background: isOutOfStock ? '#64748b' : `linear-gradient(135deg, ${accent}, #c2410c)`,
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '0.94rem',
                padding: '0.8rem 1.8rem',
                borderRadius: '14px',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                boxShadow: isOutOfStock ? 'none' : `0 6px 20px ${accentGlow}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.01em'
              }}
            >
              <Utensils size={17} />
              <span>{isOutOfStock ? 'Out of Stock' : (isCustomizable ? 'Customize & Add' : `Add to Cart • ₹${discountedPrice * quantity}`)}</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

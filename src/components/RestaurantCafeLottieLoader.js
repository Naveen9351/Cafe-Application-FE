import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, UtensilsCrossed, Flame, Clock } from 'lucide-react';

export default function RestaurantCafeLottieLoader({
  cafeName = "Gourmet Bistro",
  tableNumber = "1",
  cafeLogo = null,
  cafeInitials = "CA",
  isDarkMode = false,
  compact = false,
  title = "",
  subtitle = ""
}) {
  const accent = '#ea580c'; // Vibrant warm culinary orange
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e1915' : '#ffffff';
  const border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: compact ? '240px' : 'calc(100vh - 140px)',
      width: '100%',
      padding: compact ? '1.5rem 1rem' : '2rem 1.5rem',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Glow Halo */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.65, 0.35]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: compact ? '180px' : '280px',
          height: compact ? '180px' : '280px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(234, 88, 12, 0.22) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Animated Culinary Illustration Card */}
      <div style={{
        position: 'relative',
        width: compact ? 130 : 170,
        height: compact ? 130 : 170,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: compact ? '1rem' : '1.75rem',
        zIndex: 1
      }}>
        {/* Floating Steam Waves */}
        <div style={{ position: 'absolute', top: -14, display: 'flex', gap: '8px', zIndex: 4 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -22, -34],
                opacity: [0, 0.85, 0],
                scaleX: [1, 1.4, 0.8],
                x: [0, (i - 1) * 6, (i - 1) * 12]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.45,
                ease: "easeOut"
              }}
              style={{
                width: '5px',
                height: '22px',
                borderRadius: '10px',
                background: 'linear-gradient(to top, rgba(234, 88, 12, 0.6), rgba(245, 158, 11, 0.1))',
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>

        {/* Orbiting Cafe & Food Emoticons */}
        {/* Orbit 1: ☕ Hot Coffee */}
        <motion.div
          animate={{
            x: [0, 68, 0, -68, 0],
            y: [-68, 0, 68, 0, -68],
            scale: [0.9, 1.25, 0.9, 1.15, 0.9],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', zIndex: 5, fontSize: '24px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}
        >
          ☕
        </motion.div>

        {/* Orbit 2: 🍔 Juicy Burger */}
        <motion.div
          animate={{
            x: [0, -68, 0, 68, 0],
            y: [68, 0, -68, 0, 68],
            scale: [1, 0.85, 1.25, 0.9, 1],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', zIndex: 5, fontSize: '24px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))' }}
        >
          🍔
        </motion.div>

        {/* Orbit 3: 🍕 Italian Slice */}
        <motion.div
          animate={{
            x: [62, -62, 62],
            y: [-45, 45, -45],
            scale: [0.8, 1.3, 0.8],
            rotate: [-20, 20, -20]
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', zIndex: 5, fontSize: '22px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}
        >
          🍕
        </motion.div>

        {/* Orbit 4: ✨ Chef Seasoning */}
        <motion.div
          animate={{
            x: [-58, 58, -58],
            y: [-35, 35, -35],
            scale: [0.7, 1.35, 0.7],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', zIndex: 5, fontSize: '18px' }}
        >
          ✨
        </motion.div>

        {/* Rotating Outer Culinary Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            border: '2px dashed rgba(234, 88, 12, 0.45)',
            boxShadow: '0 0 25px rgba(234, 88, 12, 0.15)'
          }}
        />

        {/* Rotating Neon Glow Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: '#ea580c',
            borderRightColor: '#f59e0b',
            borderBottomColor: '#fbbf24'
          }}
        />

        {/* Center Pan & Gourmet Cloche Hero SVG */}
        <motion.div
          animate={{
            y: [-3, 3, -3],
            scale: [0.98, 1.02, 0.98]
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 105,
            height: 105,
            borderRadius: '30px',
            backgroundColor: cardBg,
            border: `2px solid ${border}`,
            boxShadow: '0 15px 35px rgba(234, 88, 12, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 3
          }}
        >
          {/* Animated Sizzling Restaurant Pan Vector */}
          <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cloche Dome Cover */}
            <motion.path
              animate={{
                y: [0, -6, 0],
                rotate: [0, -4, 0]
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              d="M20 62C20 42 34 26 50 26C66 26 80 42 80 62H20Z"
              fill="url(#clocheGrad)"
            />
            {/* Cloche Handle Knob */}
            <motion.circle
              animate={{
                y: [0, -6, 0]
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              cx="50"
              cy="22"
              r="5"
              fill="#ea580c"
            />
            {/* Serving Dish Base Platter */}
            <path
              d="M12 65C12 63.3431 13.3431 62 15 62H85C86.6569 62 88 63.3431 88 65C88 67.2091 86.2091 69 84 69H16C13.7909 69 12 67.2091 12 65Z"
              fill="#ea580c"
            />
            {/* Hot Sizzle Flame Underneath */}
            <motion.path
              animate={{
                scaleY: [1, 1.35, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              d="M45 74C45 74 48 70 50 70C52 70 55 74 55 74C55 76.7614 52.7614 79 50 79C47.2386 79 45 76.7614 45 74Z"
              fill="#f59e0b"
            />
            <defs>
              <linearGradient id="clocheGrad" x1="20" y1="26" x2="80" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ea580c" />
                <stop offset="0.5" stopColor="#f97316" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Micro Chef Badge */}
          <div style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            border: '1.5px solid #ffffff'
          }}>
            <UtensilsCrossed size={12} color="#ffffff" strokeWidth={2.8} />
          </div>
        </motion.div>
      </div>

      {/* Sleek Animated Glowing Progress Bar */}
      <div style={{
        width: '180px',
        height: '5px',
        borderRadius: '10px',
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '10px'
      }}>
        <motion.div
          animate={{ x: [-180, 180] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: '80px',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, #ea580c, #f59e0b, transparent)',
            borderRadius: '10px'
          }}
        />
      </div>

      {/* Live Cooking Dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.35, 1, 0.35]
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut"
            }}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: accent
            }}
          />
        ))}
      </div>
    </div>
  );
}

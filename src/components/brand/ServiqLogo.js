import React from "react";

export default function ServiqLogo({
  className = "",
  size = "md",
  showText = true,
  theme = "light",
  onClick
}) {
  const iconSizeMap = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14"
  };

  const textSizeMap = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl"
  };

  const isDark = theme === "dark";

  return (
    <div 
      className={`flex items-center gap-2.5 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Luxury Cloche + Stylized 'S' Monogram */}
      <div
        className={`${iconSizeMap[size]} rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-1.5 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0 hover:scale-105 transition-transform duration-300`}
      >
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          {/* Cloche Top Clapper Handle */}
          <rect x="18" y="4" width="4" height="4" rx="1.5" fill="currentColor" />
          <path d="M16 8H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

          {/* Cloche Outer Arch / Dome */}
          <path
            d="M6 25C6 15.6 12.3 8 20 8C27.7 8 34 15.6 34 25"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Inner Accent Ring */}
          <path
            d="M10 23C11 17 15 12 20 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Bold Connected Golden 'S' Flow */}
          <path
            d="M20 9C15 9 14 14 18 17C23 20.5 22 27 15 27C12 27 9.5 25 8.5 23"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Serving Platter Base Tray */}
          <path
            d="M4 27H36"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M7 30H33"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`${textSizeMap[size]} font-black tracking-wider ${isDark ? 'text-white' : 'text-slate-900'} leading-none`}
          >
            SERVIQ
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600 font-mono -mt-0.5">
            Restaurant OS
          </span>
        </div>
      )}
    </div>
  );
}

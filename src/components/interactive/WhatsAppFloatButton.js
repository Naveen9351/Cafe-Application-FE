import React, { useState } from "react";
import { X } from "lucide-react";

export default function WhatsAppFloatButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappUrl =
    "https://wa.me/919680132562?text=" +
    encodeURIComponent(
      "Hi SERVIQ team, I want to see a live demo and set up QR Table Ordering & Kitchen Display for my cafe/restaurant."
    );

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      {/* Friendly Tooltip Pill */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 shadow-2xl text-xs font-bold text-slate-200 animate-in fade-in slide-in-from-right-4 duration-300">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
          <span>Quick SERVIQ Demo Help</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-slate-400 hover:text-white ml-1 cursor-pointer bg-transparent border-0"
            title="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Official WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl shadow-[#25D366]/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group focus:outline-none ring-2 ring-emerald-400/40"
        title="Chat with SERVIQ on WhatsApp (+91 96801 32562)"
      >
        <svg
          viewBox="0 0 32 32"
          className="w-6 h-6 sm:w-7 sm:h-7 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16 2C8.28 2 2 8.28 2 16C2 18.77 2.8 21.36 4.19 23.55L2.24 29.76L8.63 27.86C10.74 29.15 13.27 29.9 16 29.9C23.72 29.9 30 23.62 30 16C30 8.28 23.72 2 16 2ZM23.38 21.05C23.07 21.91 21.84 22.68 20.9 22.88C20.25 23.01 19.42 23.11 16.55 21.92C12.89 20.4 10.53 16.69 10.35 16.45C10.17 16.21 8.87 14.49 8.87 12.71C8.87 10.93 9.77 10.06 10.14 9.68C10.45 9.36 10.96 9.22 11.45 9.22C11.61 9.22 11.75 9.23 11.88 9.24C12.26 9.26 12.45 9.28 12.7 9.88C13.01 10.63 13.77 12.48 13.86 12.67C13.95 12.86 14.04 13.11 13.92 13.35C13.8 13.59 13.7 13.71 13.52 13.92C13.34 14.13 13.14 14.39 12.98 14.56C12.8 14.75 12.61 14.95 12.82 15.31C13.03 15.67 13.75 16.85 14.82 17.8C16.2 19.03 17.33 19.42 17.74 19.59C18.05 19.72 18.42 19.69 18.64 19.45C18.92 19.14 19.27 18.65 19.63 18.15C19.88 17.79 20.21 17.74 20.57 17.88C20.93 18.01 22.84 18.96 23.23 19.15C23.62 19.34 23.88 19.44 23.97 19.6C24.06 19.76 24.06 20.5 23.75 21.36L23.38 21.05Z" />
        </svg>
      </a>
    </div>
  );
}

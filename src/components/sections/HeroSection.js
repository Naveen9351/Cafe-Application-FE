import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Utensils,
  Clock,
  TrendingUp,
  Flame,
  Store
} from "lucide-react";
import LiveConnectedSimulator from "../interactive/LiveConnectedSimulator";

export default function HeroSection({ onOpenDemoModal }) {
  const marqueeItems = [
    { label: "Fine Casual Bistros & Cafes", icon: Utensils },
    { label: "< 8m Avg Kitchen Prep Time", icon: Clock },
    { label: "+18% Check Size via Modifiers", icon: TrendingUp },
    { label: "Multi-Station Line Splitting", icon: Flame },
    { label: "100% Paperless KOTs", icon: Sparkles },
    { label: "Zero App Download for Guests", icon: CheckCircle2 }
  ];

  return (
    <section className="relative pt-24 pb-14 md:pt-28 md:pb-18 overflow-hidden bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Main Hero Header Content */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs backdrop-blur-md hover:border-orange-300 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
            <span className="text-orange-600 font-extrabold">SERVIQ</span>
            <span className="text-slate-400">•</span>
            <span>The Operating System for Indian Dining & Cafes</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] m-0">
            Turn Tables Faster.{" "}
            <span className="text-orange-600 bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent block mt-1">
              From Table QR to Kitchen Line.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed m-0">
            Everything your cafe, bistro, and dining room need in one connected console. 
            Guests order effortlessly via <strong className="text-slate-900 font-bold">QR Table Menus</strong> in Indian Rupees (₹), 
            tickets route instantly to your <strong className="text-slate-900 font-bold">Kitchen Display Screens</strong>, 
            and your operations run smoothly through every weekend rush.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            {onOpenDemoModal ? (
              <button
                type="button"
                onClick={onOpenDemoModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/demo"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 no-underline"
              >
                <span>Book a Free Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              to="/register"
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 no-underline"
            >
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span>Start 14-Day Free Trial</span>
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 hover:border-slate-300 no-underline"
            >
              <span>Admin Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" /> No App Download for Diners
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Real-Time Kitchen Station Routing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Zero Hardware Lock-In
            </span>
          </div>
        </div>

        {/* Live Interactive Product Simulator Stage */}
        <div className="pt-2">
          <LiveConnectedSimulator />
        </div>

        {/* Live Animated Ticker Marquee */}
        <div className="pt-4 overflow-hidden border-y border-slate-200/80 bg-white/70 py-2.5 rounded-2xl shadow-2xs">
          <div className="flex gap-6 items-center text-xs font-semibold text-slate-700 overflow-x-auto">
            {marqueeItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <span className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span>{item.label}</span>
                  <span className="text-slate-300 ml-3">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

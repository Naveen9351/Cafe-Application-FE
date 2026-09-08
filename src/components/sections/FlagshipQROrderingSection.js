import React from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  ArrowRight,
  Zap,
  Sliders,
  RefreshCw,
  Sparkles
} from "lucide-react";
import GuidedQRExperience from "../interactive/GuidedQRExperience";

export default function FlagshipQROrderingSection({ onOpenDemoModal }) {
  const features = [
    {
      title: "Unique QR Code for Every Table",
      desc: "Assign custom stands or decals to every booth, high-top, or patio table. Orders automatically carry the exact table identity.",
      icon: QrCode
    },
    {
      title: "Photo-Rich Menus & Modifiers",
      desc: "Let guests select steak temperatures, swap sides, add extra sauces, or specify custom allergy exclusions with clear imagery in ₹.",
      icon: Sliders
    },
    {
      title: "No App Download Friction",
      desc: "Opens instantly in mobile Safari or Chrome in under 1 second without forcing account creation, downloads, or passwords.",
      icon: Zap
    },
    {
      title: "Instant 86-Item Menu Control",
      desc: "Sold-out dishes can be toggled off immediately from any smartphone or tablet to prevent disappointed diners.",
      icon: RefreshCw
    }
  ];

  return (
    <section id="qr-ordering" className="py-16 relative bg-white border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <Sparkles className="w-3 h-3 text-orange-600" /> Front-of-House Dining
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight m-0">
            QR Table Ordering.{" "}
            <span className="text-orange-600 bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent block mt-1">
              Delight Guests. Accelerate Table Turns.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0">
            Replace slow physical menus with a frictionless digital ordering experience. 
            Diners browse vivid dish photography, configure modifiers effortlessly, and submit orders directly from their seats.
          </p>
        </div>

        {/* Interactive 4-Step Guided QR Stepper + Phone Experience */}
        <GuidedQRExperience />

        {/* Features 4-Grid & Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:shadow-xs transition-all space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 m-0">{f.title}</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium m-0">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenDemoModal ? (
            <button
              type="button"
              onClick={onOpenDemoModal}
              className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:scale-[1.01] transition-all flex items-center gap-1.5 cursor-pointer border-0"
            >
              <span>Book QR Ordering Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/demo"
              className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:scale-[1.01] transition-all flex items-center gap-1.5 no-underline"
            >
              <span>Book QR Ordering Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            to="/menu"
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs no-underline"
          >
            <span>Live Guest Menu Preview</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

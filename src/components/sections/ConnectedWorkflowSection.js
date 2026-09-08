import React from "react";
import {
  QrCode,
  Smartphone,
  Send,
  LayoutGrid,
  Flame,
  BarChart3,
  Sparkles
} from "lucide-react";

export default function ConnectedWorkflowSection() {
  const steps = [
    {
      num: "01",
      title: "Guest Scans Table QR",
      desc: "Zero app download. Diners scan a sleek table-specific QR code to open your interactive visual menu.",
      icon: QrCode,
      color: "text-orange-600",
      bg: "bg-orange-100",
      border: "border-orange-200"
    },
    {
      num: "02",
      title: "Instant Customization",
      desc: "Guests select dish variants, add-ons, allergy exclusions, and special notes with high-res imagery.",
      icon: Smartphone,
      color: "text-amber-600",
      bg: "bg-amber-100",
      border: "border-amber-200"
    },
    {
      num: "03",
      title: "Instant Kitchen Dispatch",
      desc: "With 1 tap, the order bypasses server bottlenecks and broadcasts across your restaurant network.",
      icon: Send,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      border: "border-indigo-200"
    },
    {
      num: "04",
      title: "KDS Station Routing",
      desc: "Dishes automatically split across Grill, Bar, Fryer, and Expo screens with color-coded SLA timers.",
      icon: LayoutGrid,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      border: "border-emerald-200"
    },
    {
      num: "05",
      title: "Precision Prep & Service",
      desc: "Chefs coordinate courses and tap to bump tickets to 'Ready', notifying floor staff for fast table service.",
      icon: Flame,
      color: "text-teal-600",
      bg: "bg-teal-100",
      border: "border-teal-200"
    },
    {
      num: "06",
      title: "Operations & Sales Insights",
      desc: "Every order automatically updates sales trends, dish popularity, inventory depletion, and prep SLA benchmarks in ₹.",
      icon: BarChart3,
      color: "text-orange-600",
      bg: "bg-orange-100",
      border: "border-orange-200"
    }
  ];

  return (
    <section className="py-16 relative bg-slate-50 border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <Sparkles className="w-3 h-3 text-orange-600" /> One Connected Operating Flow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            The Frictionless Restaurant Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0">
            Eliminate misheard orders, lost paper slips, and delayed table checks. 
            SERVIQ synchronizes every second between your dining room floor and the back-of-house kitchen.
          </p>
        </div>

        {/* Step-by-Step Flow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group relative space-y-3"
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl ${step.bg} ${step.color} border ${step.border} flex items-center justify-center font-bold shadow-2xs`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-mono font-extrabold text-slate-300 group-hover:text-orange-300 transition-colors">
                    {step.num}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors m-0">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connected Journey Strip */}
        <div className="mt-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] font-mono font-bold text-slate-700">
          <span className="text-orange-600 font-extrabold">Customer</span>
          <span className="text-slate-400">→</span>
          <span className="text-orange-600">QR Menu</span>
          <span className="text-slate-400">→</span>
          <span className="text-slate-900 font-bold">Order</span>
          <span className="text-slate-400">→</span>
          <span className="text-emerald-600 font-extrabold">Kitchen Display</span>
          <span className="text-slate-400">→</span>
          <span className="text-emerald-600">Preparation</span>
          <span className="text-slate-400">→</span>
          <span className="text-teal-600">Serve</span>
          <span className="text-slate-400">→</span>
          <span className="text-indigo-600">Insights (₹)</span>
        </div>
      </div>
    </section>
  );
}

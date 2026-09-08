import React from "react";
import {
  XCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function BeforeAfterSection() {
  const frictionPoints = [
    {
      title: "Paper Menus & Server Bottlenecks",
      desc: "Guests wait 5-8 minutes just to get a menu. No photos, zero upselling, and servers mishear allergy notes.",
      stat: "8 mins dead time per table"
    },
    {
      title: "Lost Thermal Paper Chits",
      desc: "Thermal printers jam during rushes. Lost tickets cause dish remakes, cold food, and angry diners.",
      stat: "12-15% kitchen order errors"
    },
    {
      title: "15-Minute Bill Drop Delays",
      desc: "Guests wave down servers, wait for check folders, wait for card machines, freezing prime tables during rush.",
      stat: "14 mins idle seating lag"
    },
    {
      title: "Manual 86 Item Chaos",
      desc: "When steaks run out, servers forget to notify tables. Reprints cost ₹15,000+ and take days to deliver.",
      stat: "Disappointed dining guests"
    }
  ];

  const serviqSolutions = [
    {
      title: "Instant Seated QR Digital Menu",
      desc: "Diners scan table QR in 1 second. Photo-rich modifiers trigger appetite upselling with 0 app download.",
      stat: "+18% higher check size"
    },
    {
      title: "4-Stage Kitchen Display System (KDS)",
      desc: "Tickets route to Grill, Bar, and Fryer screens with color-coded SLA countdown timers and expo quality control.",
      stat: "100% paperless kitchen accuracy"
    },
    {
      title: "Instant Pay-at-Table & Digital Tabs",
      desc: "Guests settle checks via UPI, Apple Pay, or Cards from their phone anytime and depart happily.",
      stat: "14 mins saved per table turn"
    },
    {
      title: "1-Tap Real-Time 86 Synchronization",
      desc: "Mark sold-out dishes from any phone in 1 tap; updates instantly across all dining room QR codes.",
      stat: "Zero order rework or reprint cost"
    }
  ];

  return (
    <section className="py-16 relative bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <Sparkles className="w-3 h-3 text-orange-600" /> Operational Transformation
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight m-0">
            The Traditional Way vs. The SERVIQ Way
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0">
            See how upgrading from fragmented paper slips to a connected restaurant operating system transforms your dining room velocity.
          </p>
        </div>

        {/* Grand 2-Pillar High-Contrast Master Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: ❌ The Traditional Way */}
          <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white border border-rose-200 shadow-md space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      Traditional Restaurant Operations
                    </h3>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                      The Outdated Way
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
                  Dead Time & Rework
                </span>
              </div>

              {/* 4 Pain Points */}
              <div className="space-y-3">
                {frictionPoints.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 m-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{item.title}</span>
                      </h4>
                      <span className="text-[9px] font-bold font-mono text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded">
                        {item.stat}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium pl-3 m-0">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-rose-800 font-bold border-t border-rose-100">
              Result: Slower table turns, stressed staff & lower check sizes.
            </div>
          </div>

          {/* Right Column: ✨ The SERVIQ Way */}
          <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 space-y-5 flex flex-col justify-between ring-4 ring-emerald-500/10">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      With SERVIQ Connected OS
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      The Modern Way
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Synchronized & Fast
                </span>
              </div>

              {/* 4 Solutions */}
              <div className="space-y-3">
                {serviqSolutions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 m-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.title}</span>
                      </h4>
                      <span className="text-[9px] font-bold font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                        {item.stat}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium pl-5 m-0">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-emerald-800 font-bold border-t border-emerald-100 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Result: 3.2x faster table turns, happier chefs & +18% revenue lift.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

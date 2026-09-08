import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Layers,
  GitFork,
  Monitor
} from "lucide-react";
import KDSSimulator from "../interactive/KDSSimulator";

export default function FlagshipKDSSection({ onOpenDemoModal }) {
  const workflowStages = [
    { title: "New Order", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
    { title: "In Preparation", color: "text-amber-800", bg: "bg-amber-100 border-amber-200" },
    { title: "Plating Ready", color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-200" },
    { title: "Served to Table", color: "text-slate-800", bg: "bg-slate-200 border-slate-300" }
  ];

  const kdsCapabilities = [
    {
      title: "Multi-Station Routing",
      desc: "Split beverages to the bar, steaks to the grill, and appetizers to the fryer station displays automatically.",
      icon: GitFork
    },
    {
      title: "Color-Coded SLA Timers",
      desc: "Tickets progress from Green (On Track) to Amber (Warning) and Red (Rush) to maintain ticket pacing.",
      icon: Clock
    },
    {
      title: "Course Pacing & Hold Firing",
      desc: "Synchronize appetizer and entrée prep so tables receive food at the exact right moment.",
      icon: Layers
    },
    {
      title: "Hardware Flexibility",
      desc: "Runs reliably on commercial Android tablets, iPads, touchscreen monitors, and kitchen bump bars.",
      icon: Monitor
    }
  ];

  return (
    <section id="kds" className="py-16 relative bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Back-of-House Operations
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight m-0">
            Kitchen Display System (KDS).{" "}
            <span className="text-emerald-700 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent block mt-1">
              Keep the Line Running at Peak Velocity.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium m-0">
            Eliminate grease-stained paper slips and missed orders. SERVIQ KDS routes tickets to dedicated kitchen stations, tracks prep timers in real-time, and guarantees smooth food service.
          </p>
        </div>

        {/* Workflow Progression Strip */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
          <span className="text-slate-500 uppercase tracking-wider text-[10px]">
            Kitchen Order Lifecycle:
          </span>
          {workflowStages.map((stage, idx) => (
            <React.Fragment key={idx}>
              <span className={`px-2.5 py-0.5 rounded-lg border ${stage.bg} ${stage.color}`}>
                {stage.title}
              </span>
              {idx < workflowStages.length - 1 && <span className="text-slate-400">→</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Interactive KDS Terminal Stage */}
        <div className="pt-1">
          <KDSSimulator />
        </div>

        {/* 4 Capabilities Grid & CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {kdsCapabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 m-0">{cap.title}</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium m-0">{cap.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenDemoModal ? (
            <button
              type="button"
              onClick={onOpenDemoModal}
              className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-md shadow-emerald-600/25 hover:scale-[1.01] transition-all flex items-center gap-1.5 cursor-pointer border-0"
            >
              <span>Book KDS Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/demo"
              className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 shadow-md shadow-emerald-600/25 hover:scale-[1.01] transition-all flex items-center gap-1.5 no-underline"
            >
              <span>Book KDS Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            to="/products#kds"
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs no-underline"
          >
            <span>Kitchen Display Features</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

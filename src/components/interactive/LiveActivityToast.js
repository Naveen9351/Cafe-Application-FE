import React, { useState, useEffect } from "react";
import { Sparkles, Utensils, X, Flame, CheckCircle2 } from "lucide-react";

const ACTIVITIES = [
  {
    id: "act-1",
    venue: "The Copper Chimney",
    action: "Turned Table 14 in 38 mins",
    metric: "Saved 14 mins dead time",
    icon: Sparkles,
    color: "text-orange-600 bg-orange-100 border-orange-200",
    timeAgo: "2m ago"
  },
  {
    id: "act-2",
    venue: "Smokehouse Bistro",
    action: "Grill Station marked Order #104 Ready",
    metric: "Prep time: 6m 20s (Target: <8m)",
    icon: Flame,
    color: "text-amber-600 bg-amber-100 border-amber-200",
    timeAgo: "4m ago"
  },
  {
    id: "act-3",
    venue: "Artisan Pizza Co.",
    action: "Guest added Truffle Aioli modifier",
    metric: "+₹180 check size increase",
    icon: Utensils,
    color: "text-emerald-600 bg-emerald-100 border-emerald-200",
    timeAgo: "5m ago"
  },
  {
    id: "act-4",
    venue: "Blue Bay Lounge",
    action: "Table 8 paid tab instantly via UPI",
    metric: "Zero server bill wait delay",
    icon: CheckCircle2,
    color: "text-indigo-600 bg-indigo-100 border-indigo-200",
    timeAgo: "7m ago"
  }
];

export default function LiveActivityToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setVisible(true);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const current = ACTIVITIES[index];
  const Icon = current.icon;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm transition-all duration-500 ease-out ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
    >
      <div className="p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-900/10 flex items-start gap-2.5 relative group">
        {/* Icon */}
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${current.color}`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4 space-y-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-black text-slate-900 truncate">{current.venue}</span>
            <span className="text-slate-400 font-mono">{current.timeAgo}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-800 leading-tight m-0">
            {current.action}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold font-mono m-0">
            {current.metric}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors cursor-pointer bg-transparent border-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

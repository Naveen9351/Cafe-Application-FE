import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  Flame,
  ArrowUpRight,
  BarChart3
} from "lucide-react";

export default function AnalyticsInteractivePreview() {
  const [period, setPeriod] = useState("30d");

  const data = {
    today: {
      revenue: "₹48,920",
      revenueGrowth: "+21.4%",
      orders: "148",
      ordersGrowth: "+18.2%",
      aov: "₹685",
      aovGrowth: "+4.6%",
      tableTurns: "3.4 turns/day",
      avgPrepTime: "7.8 mins",
      topItems: [
        { name: "Dry-Aged Angus Truffle Burger", count: 46, rev: "₹17,710", pct: 88 },
        { name: "Cedar Smoked Signature Blend", count: 38, rev: "₹13,300", pct: 72 },
        { name: "Woodfired Artisan Margherita", count: 31, rev: "₹9,920", pct: 58 },
        { name: "Salt & Pepper Crispy Calamari", count: 28, rev: "₹7,840", pct: 52 }
      ],
      hourlyBars: [
        { hour: "11h", orders: 12, pct: 20 },
        { hour: "12h", orders: 38, pct: 55 },
        { hour: "13h", orders: 68, pct: 90 },
        { hour: "14h", orders: 55, pct: 75 },
        { hour: "15h", orders: 20, pct: 30 },
        { hour: "16h", orders: 15, pct: 22 },
        { hour: "17h", orders: 28, pct: 40 },
        { hour: "18h", orders: 48, pct: 65 },
        { hour: "19h", orders: 78, pct: 95 },
        { hour: "20h", orders: 82, pct: 100 },
        { hour: "21h", orders: 52, pct: 70 },
        { hour: "22h", orders: 25, pct: 35 }
      ]
    },
    "7d": {
      revenue: "₹3,42,500",
      revenueGrowth: "+26.8%",
      orders: "1,040",
      ordersGrowth: "+22.5%",
      aov: "₹680",
      aovGrowth: "+5.1%",
      tableTurns: "3.6 turns/day",
      avgPrepTime: "7.5 mins",
      topItems: [
        { name: "Dry-Aged Angus Truffle Burger", count: 320, rev: "₹1,23,200", pct: 92 },
        { name: "Woodfired Artisan Margherita", count: 240, rev: "₹76,800", pct: 78 },
        { name: "Cedar Smoked Signature Blend", count: 285, rev: "₹99,750", pct: 74 },
        { name: "Salt & Pepper Crispy Calamari", count: 195, rev: "₹54,600", pct: 60 }
      ],
      hourlyBars: [
        { hour: "11h", orders: 75, pct: 35 },
        { hour: "12h", orders: 140, pct: 65 },
        { hour: "13h", orders: 210, pct: 92 },
        { hour: "14h", orders: 165, pct: 78 },
        { hour: "15h", orders: 85, pct: 40 },
        { hour: "16h", orders: 70, pct: 32 },
        { hour: "17h", orders: 110, pct: 50 },
        { hour: "18h", orders: 180, pct: 75 },
        { hour: "19h", orders: 240, pct: 98 },
        { hour: "20h", orders: 250, pct: 100 },
        { hour: "21h", orders: 175, pct: 75 },
        { hour: "22h", orders: 90, pct: 42 }
      ]
    },
    "30d": {
      revenue: "₹14,86,000",
      revenueGrowth: "+31.2%",
      orders: "4,520",
      ordersGrowth: "+27.9%",
      aov: "₹678",
      aovGrowth: "+6.0%",
      tableTurns: "3.7 turns/day",
      avgPrepTime: "7.2 mins",
      topItems: [
        { name: "Dry-Aged Angus Truffle Burger", count: 1420, rev: "₹5,46,700", pct: 95 },
        { name: "Woodfired Artisan Margherita", count: 1050, rev: "₹3,36,000", pct: 82 },
        { name: "Cedar Smoked Signature Blend", count: 1180, rev: "₹4,13,000", pct: 78 },
        { name: "Salt & Pepper Crispy Calamari", count: 850, rev: "₹2,38,000", pct: 64 }
      ],
      hourlyBars: [
        { hour: "11h", orders: 280, pct: 35 },
        { hour: "12h", orders: 580, pct: 68 },
        { hour: "13h", orders: 880, pct: 95 },
        { hour: "14h", orders: 690, pct: 78 },
        { hour: "15h", orders: 340, pct: 40 },
        { hour: "16h", orders: 290, pct: 32 },
        { hour: "17h", orders: 480, pct: 54 },
        { hour: "18h", orders: 780, pct: 82 },
        { hour: "19h", orders: 940, pct: 98 },
        { hour: "20h", orders: 980, pct: 100 },
        { hour: "21h", orders: 720, pct: 76 },
        { hour: "22h", orders: 380, pct: 44 }
      ]
    }
  };

  const current = data[period];

  return (
    <div className="p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 bg-white space-y-5">
      {/* Header with period toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              Live Operations & Sales
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">
            Restaurant Sales & Speed Reporting
          </h4>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {["today", "7d", "30d"].map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setPeriod(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                period === t
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "today" ? "Today" : t === "7d" ? "Past 7 Days" : "Past 30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500">Total Net Revenue</span>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">{current.revenue}</div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>{current.revenueGrowth} vs prior</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500">Total Orders Served</span>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">{current.orders}</div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>{current.ordersGrowth} vs prior</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500">Average Check Size</span>
          <div className="text-lg sm:text-xl font-black text-orange-600 font-mono">{current.aov}</div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
            <TrendingUp className="w-3 h-3" />
            <span>{current.aovGrowth} modifier lift</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[10px] font-bold text-slate-500">Avg Kitchen Ticket Time</span>
          <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono">{current.avgPrepTime}</div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Speed target: &lt; 10m</span>
          </div>
        </div>
      </div>

      {/* Split Graph & Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Hourly Order Velocity Chart */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-orange-600" /> Hourly Dining Velocity
            </span>
            <span className="text-slate-500 text-[10px] font-medium">Peak rush: 1:00 PM & 8:00 PM</span>
          </div>

          <div className="h-32 flex items-end justify-between gap-1.5 pt-4 px-2 border-b border-slate-200 bg-white rounded-xl p-2 border">
            {current.hourlyBars.map((bar, idx) => {
              const isPeak = bar.pct > 80;
              return (
                <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                    {bar.orders} orders
                  </div>

                  <div
                    style={{ height: `${bar.pct}%` }}
                    className={`w-full max-w-[20px] rounded-t-md transition-all duration-500 ${
                      isPeak
                        ? "bg-gradient-to-t from-orange-600 to-amber-500 shadow-xs"
                        : "bg-gradient-to-t from-slate-300 to-slate-200"
                    }`}
                  />
                  <span className="text-[8px] text-slate-500 font-mono font-bold">
                    {bar.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-600 pt-0.5 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-r from-orange-600 to-amber-500" />
              <span>Dinner & Lunch Rushes</span>
            </span>
            <span className="font-semibold text-slate-700">QR Ordering handled 84% of peak volume</span>
          </div>
        </div>

        {/* Top Grossing Items Leaderboard */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-600" /> Top Selling Dishes
            </span>
            <span className="text-slate-500 text-[10px] font-medium">By Gross Sales</span>
          </div>

          <div className="space-y-2.5 pt-0.5">
            {current.topItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 font-bold truncate pr-2">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="text-orange-600 font-black shrink-0 font-mono">
                    {item.rev}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

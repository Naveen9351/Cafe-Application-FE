import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ROICalculator({ onOpenDemoModal }) {
  const [tables, setTables] = useState(20);
  const [checkSize, setCheckSize] = useState(750);
  const [turns, setTurns] = useState(2.5);

  // Calculations
  const baselineMonthly = tables * turns * checkSize * 30;
  const improvedTurns = turns * 1.28;
  const improvedCheckSize = checkSize * 1.16;
  const newMonthlyRevenue = tables * improvedTurns * improvedCheckSize * 30;

  const extraMonthlyRevenue = Math.round(newMonthlyRevenue - baselineMonthly);
  const hoursSavedPerMonth = Math.round((tables * turns * 30 * 12) / 60);

  const handleSliderChange = (setter, value) => {
    setter(value);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <Sparkles className="w-3 h-3 text-orange-600" /> Interactive Financial ROI Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">
            Calculate Your Restaurant Profit Lift
          </h3>
          <p className="text-xs text-slate-500 font-medium m-0">
            Adjust the sliders below based on your restaurant's current operations.
          </p>
        </div>

        <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold shrink-0">
          Estimated 12.8x Avg ROI
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 3 Interactive Sliders */}
        <div className="lg:col-span-6 space-y-5">
          {/* Slider 1: Tables */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Dining Tables</span>
              <span className="text-orange-600 font-mono text-sm font-black px-2 py-0.5 bg-orange-100/70 rounded-md">
                {tables} Tables
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={tables}
              onChange={(e) => handleSliderChange(setTables, Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>5 Tables (Cafe)</span>
              <span>100+ Tables (High-Volume)</span>
            </div>
          </div>

          {/* Slider 2: Average Check Size */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Average Check Size (₹)</span>
              <span className="text-orange-600 font-mono text-sm font-black px-2 py-0.5 bg-orange-100/70 rounded-md">
                ₹{checkSize.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="3000"
              step="50"
              value={checkSize}
              onChange={(e) => handleSliderChange(setCheckSize, Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>₹200 (Casual Coffee)</span>
              <span>₹3,000 (Fine Dining)</span>
            </div>
          </div>

          {/* Slider 3: Table Turns */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Current Table Turns / Day</span>
              <span className="text-orange-600 font-mono text-sm font-black px-2 py-0.5 bg-orange-100/70 rounded-md">
                {turns.toFixed(1)} turns/day
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.1"
              value={turns}
              onChange={(e) => handleSliderChange(setTurns, Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>1.0 turn (Slow)</span>
              <span>6.0 turns (Rush Hour)</span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Financial Outcomes Card */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 text-slate-900 shadow-xl shadow-orange-500/5 space-y-5 border-2 border-orange-200">
          <div className="flex items-center justify-between pb-3 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Projected Impact
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Live Calculated
            </span>
          </div>

          {/* Big Number Display */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Estimated Extra Monthly Revenue
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-600 tracking-tight font-mono animate-in zoom-in-95 duration-200">
              +₹{extraMonthlyRevenue.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-600 font-medium pt-0.5 m-0">
              From faster table turns (+28%) and photo modifier attachments (+16%).
            </p>
          </div>

          {/* 2 Metric Pills */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-600" /> Dead Time Saved
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                {hoursSavedPerMonth} hrs / mo
              </div>
              <p className="text-[9px] text-slate-500 font-medium m-0">12 mins saved per table check</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" /> Check Size Lift
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                +₹{Math.round(checkSize * 0.16)} / check
              </div>
              <p className="text-[9px] text-slate-500 font-medium m-0">Extra drinks & side re-orders</p>
            </div>
          </div>

          {/* CTA Action Button */}
          <div className="pt-2">
            {onOpenDemoModal ? (
              <button
                type="button"
                onClick={onOpenDemoModal}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <span>Unlock This Revenue Lift</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/demo"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 no-underline"
              >
                <span>Unlock This Revenue Lift</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Based on aggregated analytics from 400+ connected dining rooms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

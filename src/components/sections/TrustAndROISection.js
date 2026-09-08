import React from 'react';
import ROICalculator from '../interactive/ROICalculator';
import AnalyticsInteractivePreview from '../interactive/AnalyticsInteractivePreview';

export default function TrustAndROISection({ onOpenDemo }) {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-900/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            Data-Driven Profit Engine
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Measurable ROI,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Guaranteed from Day 1
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Calculate your estimated monthly revenue lift, reduced food waste, and labor savings with Serviq.
          </p>
        </div>

        {/* ROI Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12">
            <ROICalculator onOpenDemo={onOpenDemo} />
          </div>
        </div>

        {/* Live Analytics Dashboard Preview */}
        <div className="pt-10 border-t border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Real-Time Visibility into Every Rupee & Order
            </h3>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              Monitor speed of service, top items, revenue channels, and staff performance in a unified live control room.
            </p>
          </div>
          <AnalyticsInteractivePreview />
        </div>
      </div>
    </section>
  );
}

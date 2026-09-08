import React from 'react';
import PricingCalculator from '../interactive/PricingCalculator';

export default function PricingSection({ onOpenDemo }) {
  return (
    <section id="pricing" className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            Transparent Indian Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Fair Plans for Every Stage of Growth
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            No hidden setup fees. Free menu digitization, live onboarding, and 24/7 priority support across India.
          </p>
        </div>

        {/* Pricing Table Component */}
        <PricingCalculator onOpenDemo={onOpenDemo} />
      </div>
    </section>
  );
}

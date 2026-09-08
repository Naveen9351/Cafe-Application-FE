import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import PricingCalculator from './interactive/PricingCalculator';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';

export default function PricingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      <Navbar onOpenDemo={() => setIsDemoModalOpen(true)} />

      <main className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            Simple, Transparent Indian Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Plans Designed for High-Growth Indian Restaurants
          </h1>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Choose the tier that fits your outlet capacity. Switch plans anytime or request custom multi-chain enterprise pricing.
          </p>
        </div>

        {/* Pricing component */}
        <PricingCalculator onOpenDemo={() => setIsDemoModalOpen(true)} />

        {/* FAQ Section */}
        <FAQSection onOpenDemo={() => setIsDemoModalOpen(true)} />

        {/* CTA */}
        <CTASection onOpenDemo={() => setIsDemoModalOpen(true)} />
      </main>

      <Footer onOpenDemo={() => setIsDemoModalOpen(true)} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Get Custom Pricing for Your Outlet"
        subtitle="Our team will formulate the most cost-effective package for your restaurant operations."
      />
    </div>
  );
}

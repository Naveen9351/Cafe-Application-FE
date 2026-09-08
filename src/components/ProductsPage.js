import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import FlagshipQROrderingSection from './sections/FlagshipQROrderingSection';
import FlagshipKDSSection from './sections/FlagshipKDSSection';
import EcosystemSection from './sections/EcosystemSection';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';

export default function ProductsPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      <Navbar onOpenDemo={() => setIsDemoModalOpen(true)} />

      <main className="space-y-12">
        <div className="pt-20 pb-10 text-center max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            Complete Product Suite
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Integrated Tools Powering the Modern Indian Food Outlet
          </h1>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Explore our flagship digital ordering, intelligent kitchen display, inventory control, and real-time analytics.
          </p>
        </div>

        <FlagshipQROrderingSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <FlagshipKDSSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <EcosystemSection />
        <CTASection onOpenDemo={() => setIsDemoModalOpen(true)} />
      </main>

      <Footer onOpenDemo={() => setIsDemoModalOpen(true)} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Schedule a Full Product Suite Demo"
        subtitle="See how our integrated products eliminate operational friction across your business."
      />
    </div>
  );
}

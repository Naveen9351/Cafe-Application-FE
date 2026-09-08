import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import { SOLUTIONS } from '../data/solutionsData';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';

export default function SolutionsPage() {
  const [activeTab, setActiveTab] = useState(SOLUTIONS[0].id);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const selectedSolution = SOLUTIONS.find(s => s.id === activeTab) || SOLUTIONS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      <Navbar onOpenDemo={() => setIsDemoModalOpen(true)} />

      <main className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Tailored Industry Solutions
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Every Restaurant Model
          </h1>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Whether you run a fast-paced cafe, fine dining venue, high-traffic QSR, or cloud kitchen chain, Serviq is configured for your floor plan.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {SOLUTIONS.map((sol) => (
            <button
              key={sol.id}
              onClick={() => setActiveTab(sol.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === sol.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sol.name}
            </button>
          ))}
        </div>

        {/* Selected Solution Detail Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              {selectedSolution.tagline}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {selectedSolution.name}
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              {selectedSolution.description}
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Capabilities</h3>
              {selectedSolution.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 font-medium">{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <span>Request Custom {selectedSolution.name} Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Impact Metric</span>
                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">Verified</span>
              </div>
              <div className="text-center py-6 space-y-2">
                <div className="text-4xl sm:text-5xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {selectedSolution.id === 'cafe' && '+35% Faster Service'}
                  {selectedSolution.id === 'qsr' && '45-Sec Order Dispatch'}
                  {selectedSolution.id === 'dine-in' && '2.4x Table Turn Rate'}
                  {selectedSolution.id === 'cloud-kitchen' && '10+ Brands Unified'}
                  {selectedSolution.id === 'multi-outlet' && '100% Central Control'}
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Measured across active restaurants operating on the Serviq infrastructure.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Recommended Module Package:
                </div>
                <div className="text-slate-400">
                  {selectedSolution.id === 'cafe' && 'Digital QR Menu + Barista KDS + UPI Instant Settle + Inventory'}
                  {selectedSolution.id === 'qsr' && 'Self-Serve Kiosk + High-Speed KDS + Token Calling Display'}
                  {selectedSolution.id === 'dine-in' && 'QR Table Ordering + Captain POS + Multi-Station KDS + Split Billing'}
                  {selectedSolution.id === 'cloud-kitchen' && 'Aggregator Sync + Multi-Brand KDS + Central Commissary Stock'}
                  {selectedSolution.id === 'multi-outlet' && 'Franchise Governance + Multi-Location Live Analytics + Central Menu'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <CTASection onOpenDemo={() => setIsDemoModalOpen(true)} />
      </main>

      <Footer onOpenDemo={() => setIsDemoModalOpen(true)} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title={`Custom ${selectedSolution.name} Consultation`}
        subtitle="Speak with an operations architect tailored to your restaurant configuration."
      />
    </div>
  );
}

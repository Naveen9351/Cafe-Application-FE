import React from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import LeadCaptureForm from './interactive/LeadCaptureForm';
import { CheckCircle2, ShieldCheck, Sparkles, PhoneCall, Clock, Calendar } from 'lucide-react';

export default function BookDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      <Navbar onOpenDemo={() => {}} />

      <main className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Value proposition */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Live 1-on-1 Product Demo
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Experience the Power of Serviq for Your Food Outlet
              </h1>
              <p className="mt-4 text-slate-400 text-base leading-relaxed">
                Schedule a 15-minute customized walkthrough with our restaurant technology engineers. See how Serviq solves rush-hour bottlenecks, speeds up kitchen output, and maximizes table turnover.
              </p>
            </div>

            {/* What to expect list */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                What happens during the demo?
              </h3>
              
              <div className="space-y-3.5">
                {[
                  {
                    title: 'Tailored Workflow Audit',
                    desc: 'We review your seating capacity, kitchen stations, and existing billing hardware.',
                  },
                  {
                    title: 'Live QR & KDS Demonstration',
                    desc: 'Experience placing an order on customer phone and seeing it hit the kitchen in real-time.',
                  },
                  {
                    title: 'Free Menu Digitization',
                    desc: 'Send us your PDF/photo menu and our team will upload and optimize it at no cost.',
                  },
                  {
                    title: 'Custom Pricing & Setup Plan',
                    desc: 'Get exact pricing tailored to your restaurant count with zero lock-in contracts.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick trust metrics */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>15 Min Session</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Same-Day Availability</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>No Commitment</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-2xl font-bold text-white mb-2">Request Your Demo</h2>
            <p className="text-slate-400 text-sm mb-8">
              Fill in your outlet details below. A restaurant tech specialist will reach out within 30 minutes.
            </p>

            <LeadCaptureForm sourcePage="BookDemoPage" />
          </div>

        </div>
      </main>

      <Footer onOpenDemo={() => {}} />
    </div>
  );
}

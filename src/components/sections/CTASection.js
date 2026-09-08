import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection({ onOpenDemo }) {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-16 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-700/60 shadow-2xl overflow-hidden text-center">
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Zero Setup Fee • 14-Day Free Trial
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Ready to Transform Your Restaurant Operations?
          </h2>

          <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking Indian cafes, QSRs, and fine dine restaurants cutting wait times and maximizing table turn rates with Serviq.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Schedule Live Walkthrough</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Create Restaurant Account</span>
            </Link>
          </div>

          {/* Value Props Strip */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Works with any Android/iOS device</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Free instant menu QR generation</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <PhoneCall className="w-4 h-4 text-indigo-400" />
              <span>Direct Indian support via WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

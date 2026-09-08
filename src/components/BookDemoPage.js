import React from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import LeadCaptureForm from './interactive/LeadCaptureForm';
import { CheckCircle2, ShieldCheck, Sparkles, Clock, Calendar } from 'lucide-react';

export default function BookDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => {}} />

      <main style={{ padding: '140px 20px 80px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'start' }}>
          
          {/* Left Column: Value proposition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div className="badge-pill badge-blue" style={{ marginBottom: 16 }}>
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>Live 1-on-1 Product Demo</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                Experience the Velocity of SARVIQ for Your Food Outlet
              </h1>
              <p style={{ marginTop: 16, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Schedule a 15-minute customized walkthrough with our restaurant technology engineers. See how SARVIQ solves rush-hour bottlenecks, speeds up kitchen throughput, and maximizes table turnover.
              </p>
            </div>

            {/* What to expect list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                What happens during the demo?
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  {
                    title: 'Tailored Workflow Audit',
                    desc: 'We review your table capacity, kitchen stations, and existing billing hardware.',
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
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{item.title}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick trust metrics */}
            <div className="card-luxury" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                <span>15 Min Session</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar style={{ width: 16, height: 16, color: 'var(--color-emerald)' }} />
                <span>Same-Day Availability</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck style={{ width: 16, height: 16, color: 'var(--color-indigo)' }} />
                <span>No Commitment</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="card-luxury" style={{ padding: '36px 32px' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 8px 0' }}>Request Your Demo</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Fill in your outlet details below. A restaurant tech specialist will reach out within 30 minutes.
            </p>

            <LeadCaptureForm sourcePage="BookDemoPage" />
          </div>

        </div>
      </main>

      <Footer onOpenDemoModal={() => {}} />
    </div>
  );
}

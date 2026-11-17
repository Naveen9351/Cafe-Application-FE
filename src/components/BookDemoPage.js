import React from 'react';
import Navbar from './layout/Navbar';
import LeadCaptureForm from './interactive/LeadCaptureForm';
import { CheckCircle2, ShieldCheck, Sparkles, Clock, Calendar } from 'lucide-react';

export default function BookDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenDemoModal={() => {}} />

      <main style={{ flex: 1, padding: '85px 20px 25px', maxWidth: 1060, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'center', width: '100%' }}>
          
          {/* Left Column: Value proposition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="badge-pill badge-blue" style={{ marginBottom: 10, padding: '3px 10px', fontSize: 11 }}>
                <Sparkles style={{ width: 13, height: 13 }} />
                <span>Live 1-on-1 Product Demo</span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
                Experience DINEVIQ in Action
              </h1>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '8px 0 0' }}>
                15-minute personalized walkthrough. See how DINEVIQ eliminates rush-hour bottlenecks and accelerates table turnover.
              </p>
            </div>

            {/* What to expect list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                What happens during the demo?
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    title: 'Tailored Workflow Audit',
                    desc: 'Review table capacity, kitchen stations & POS setup.',
                  },
                  {
                    title: 'Live QR & KDS Demonstration',
                    desc: 'Place an order on customer phone & watch real-time kitchen sync.',
                  },
                  {
                    title: 'Free Menu Setup & Custom Pricing',
                    desc: 'Send your menu for complimentary digitization & ROI review.',
                  },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle2 style={{ width: 13, height: 13, color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{item.title}</h4>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '1px 0 0 0', lineHeight: 1.35 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick trust metrics */}
            <div className="card-luxury" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
                <span>15 Min Session</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar style={{ width: 14, height: 14, color: 'var(--color-emerald)' }} />
                <span>Same-Day Availability</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: 'var(--color-indigo)' }} />
                <span>Zero Commitment</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="card-luxury" style={{ padding: '22px 24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0' }}>Request Your Demo</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Fill in your outlet details. A restaurant specialist will connect within 15 minutes.
            </p>

            <LeadCaptureForm sourcePage="BookDemoPage" hideHeader={true} compact={true} />
          </div>

        </div>
      </main>

      <footer style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)', textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} DINEVIQ Technologies. 24/7 Support: support@dineviq.com • +91 96801 32562
      </footer>
    </div>
  );
}

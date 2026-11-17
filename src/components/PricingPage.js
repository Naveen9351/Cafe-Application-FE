import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import PricingCalculator from './interactive/PricingCalculator';
import LeadCaptureModal from './interactive/LeadCaptureModal';
import { CreditCard } from 'lucide-react';

export default function PricingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenDemoModal={() => setIsDemoModalOpen(true)} />

      <main style={{ flex: 1, padding: '95px 20px 60px 20px', maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 36 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div className="badge-pill badge-blue" style={{ padding: '3px 10px', fontSize: 11 }}>
            <CreditCard style={{ width: 13, height: 13 }} />
            <span>Simple, Transparent Indian Pricing in ₹</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            Plans Engineered for Restaurant Velocity
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 640, margin: 0, lineHeight: 1.5 }}>
            Choose the tier that fits your table count. Switch plans anytime or request custom multi-chain enterprise pricing.
          </p>
        </div>

        {/* Pricing component */}
        <PricingCalculator onOpenDemoModal={() => setIsDemoModalOpen(true)} />
      </main>

      <Footer onOpenDemoModal={() => setIsDemoModalOpen(true)} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Get Custom Pricing for Your Outlet"
        subtitle="Our team will formulate the most cost-effective package for your restaurant operations."
      />
    </div>
  );
}

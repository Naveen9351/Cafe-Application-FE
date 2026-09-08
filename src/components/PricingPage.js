import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import PricingCalculator from './interactive/PricingCalculator';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';
import { CreditCard } from 'lucide-react';

export default function PricingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => setIsDemoModalOpen(true)} />

      <main style={{ padding: '140px 20px 80px 20px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 60 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <CreditCard style={{ width: 14, height: 14 }} />
            <span>Simple, Transparent Indian Pricing in ₹</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            Plans Engineered for Restaurant Velocity
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            Choose the tier that fits your table count. Switch plans anytime or request custom multi-chain enterprise pricing.
          </p>
        </div>

        {/* Pricing component */}
        <PricingCalculator onOpenDemoModal={() => setIsDemoModalOpen(true)} />

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

import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import FlagshipQROrderingSection from './sections/FlagshipQROrderingSection';
import FlagshipKDSSection from './sections/FlagshipKDSSection';
import EcosystemSection from './sections/EcosystemSection';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';
import { Layers } from 'lucide-react';

export default function ProductsPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => setIsDemoModalOpen(true)} />

      <main style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ paddingTop: 140, paddingBottom: 40, paddingLeft: 20, paddingRight: 20, textAlign: 'center', maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Layers style={{ width: 14, height: 14 }} />
            <span>Complete Autonomous Suite</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            Integrated Tools Powering Modern Indian Food Outlets
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
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

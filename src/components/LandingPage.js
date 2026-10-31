import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HeroSection from './sections/HeroSection';
import FlagshipQROrderingSection from './sections/FlagshipQROrderingSection';
import FlagshipKDSSection from './sections/FlagshipKDSSection';
import BeforeAfterSection from './sections/BeforeAfterSection';
import EcosystemSection from './sections/EcosystemSection';
import TrustAndROISection from './sections/TrustAndROISection';
import PricingSection from './sections/PricingSection';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenDemo = () => setIsDemoModalOpen(true);
  const handleCloseDemo = () => setIsDemoModalOpen(false);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)", color: "var(--text-main)", overflowX: "hidden" }}>
      {/* Top sticky navigation */}
      <Navbar onOpenDemoModal={handleOpenDemo} />

      {/* Main Landing Page Sections */}
      <main>
        {/* 1. Hero Section with GSAP motion, Rotating Headline & Connected Simulator */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* 2. Flagship QR Table Dining Showcase */}
        <FlagshipQROrderingSection onOpenDemo={handleOpenDemo} />

        {/* 3. Flagship Zero-Latency Kitchen Display System (KDS) */}
        <FlagshipKDSSection onOpenDemo={handleOpenDemo} />

        {/* 4. Before vs After Comparison */}
        <section id="about">
          <BeforeAfterSection />
        </section>

        {/* 5. Comprehensive Ecosystem (FOH, BOH, AI Intelligence) */}
        <EcosystemSection />

        {/* 6. Measurable ROI & Live Analytics Preview */}
        <TrustAndROISection onOpenDemo={handleOpenDemo} />

        {/* 7. Transparent Indian Pricing */}
        <PricingSection onOpenDemo={handleOpenDemo} />

        {/* 8. Frequently Asked Questions */}
        <FAQSection onOpenDemo={handleOpenDemo} />

        {/* 9. High-Impact Call to Action */}
        <CTASection onOpenDemo={handleOpenDemo} />
      </main>

      {/* Footer */}
      <section id="contact">
        <Footer onOpenDemo={handleOpenDemo} />
      </section>

      {/* Interactive Overlays */}
      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={handleCloseDemo}
        title="Schedule a Personalized DINEVIQ Walkthrough"
        subtitle="See how DINEVIQ cuts table turn times and automates your kitchen in under 15 minutes."
      />
    </div>
  );
}

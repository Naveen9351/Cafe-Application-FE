import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HeroSection from './sections/HeroSection';
import ConnectedWorkflowSection from './sections/ConnectedWorkflowSection';
import FlagshipQROrderingSection from './sections/FlagshipQROrderingSection';
import FlagshipKDSSection from './sections/FlagshipKDSSection';
import BeforeAfterSection from './sections/BeforeAfterSection';
import EcosystemSection from './sections/EcosystemSection';
import TrustAndROISection from './sections/TrustAndROISection';
import PricingSection from './sections/PricingSection';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';
import LiveActivityToast from './interactive/LiveActivityToast';
import LandingChatbot from './LandingChatbot';

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

        {/* 2. Infinite Connected Automation Loop Workflow */}
        <ConnectedWorkflowSection />

        {/* 3. Flagship QR Table Dining Showcase */}
        <FlagshipQROrderingSection onOpenDemo={handleOpenDemo} />

        {/* 4. Flagship Zero-Latency Kitchen Display System (KDS) */}
        <FlagshipKDSSection onOpenDemo={handleOpenDemo} />

        {/* 5. Before vs After Comparison */}
        <BeforeAfterSection />

        {/* 6. Comprehensive Ecosystem (FOH, BOH, AI Intelligence) */}
        <EcosystemSection />

        {/* 7. Measurable ROI & Live Analytics Preview */}
        <TrustAndROISection onOpenDemo={handleOpenDemo} />

        {/* 8. Transparent Indian Pricing */}
        <PricingSection onOpenDemo={handleOpenDemo} />

        {/* 9. Frequently Asked Questions */}
        <FAQSection onOpenDemo={handleOpenDemo} />

        {/* 10. High-Impact Call to Action */}
        <CTASection onOpenDemo={handleOpenDemo} />
      </main>

      {/* Footer */}
      <Footer onOpenDemo={handleOpenDemo} />

      {/* Interactive Overlays & Dedicated AI Concierge (Zero Overlap) */}
      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={handleCloseDemo}
        title="Schedule a Personalized SERVIQ Walkthrough"
        subtitle="See how SERVIQ cuts table turn times and automates your kitchen in under 15 minutes."
      />

      <LiveActivityToast />
      <LandingChatbot onOpenDemo={handleOpenDemo} />
    </div>
  );
}

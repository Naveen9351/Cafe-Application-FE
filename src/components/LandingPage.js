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
import WhatsAppFloatButton from './interactive/WhatsAppFloatButton';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenDemo = () => setIsDemoModalOpen(true);
  const handleCloseDemo = () => setIsDemoModalOpen(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased overflow-x-hidden">
      {/* Top sticky navigation */}
      <Navbar onOpenDemo={handleOpenDemo} />

      {/* Main Landing Page Sections */}
      <main>
        {/* 1. Hero Section with Connected Simulator */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* 2. Connected End-to-End Workflow */}
        <ConnectedWorkflowSection />

        {/* 3. Flagship QR Table Ordering Showcase */}
        <FlagshipQROrderingSection onOpenDemo={handleOpenDemo} />

        {/* 4. Flagship Zero-Latency Kitchen Display System (KDS) */}
        <FlagshipKDSSection onOpenDemo={handleOpenDemo} />

        {/* 5. Before vs After Comparison */}
        <BeforeAfterSection />

        {/* 6. Comprehensive Ecosystem (FOH, BOH, Analytics) */}
        <EcosystemSection />

        {/* 7. Measurable ROI & Live Analytics Preview */}
        <TrustAndROISection onOpenDemo={handleOpenDemo} />

        {/* 8. Transparent Indian Pricing */}
        <PricingSection onOpenDemo={handleOpenDemo} />

        {/* 9. Frequently Asked Questions */}
        <FAQSection onOpenDemo={handleOpenDemo} />

        {/* 10. Call to Action (Free Trial & Walkthrough) */}
        <CTASection onOpenDemo={handleOpenDemo} />
      </main>

      {/* Footer */}
      <Footer onOpenDemo={handleOpenDemo} />

      {/* Interactive Global Overlays & Modals */}
      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={handleCloseDemo}
        title="Schedule a Personalized 1-on-1 Walkthrough"
        subtitle="See how Serviq cuts table turn times and automates your kitchen in under 15 minutes."
      />

      <LiveActivityToast />
      <WhatsAppFloatButton onOpenDemo={handleOpenDemo} />
    </div>
  );
}

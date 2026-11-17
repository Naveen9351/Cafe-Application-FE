import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HeroSection from './sections/HeroSection';
import VisualAppShowcase from './sections/VisualAppShowcase';
import ScrollScrubVisuals from './sections/ScrollScrubVisuals';
import BeforeAfterSection from './sections/BeforeAfterSection';
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

      {/* Main Landing Page Visual Experience */}
      <main>
        {/* 1. Hero Section with GSAP motion, Rotating Headline & Connected Simulator */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* 2. Flagship Interactive Real-UI App Explorer (POS, KDS, Dashboard, Menu, Khata, AI) */}
        <VisualAppShowcase onOpenDemo={handleOpenDemo} />

        {/* 3. 3D Perspective GSAP Scroll Scrub Animation Flow */}
        <ScrollScrubVisuals onOpenDemo={handleOpenDemo} />

        {/* 4. Before vs After Comparison */}
        <section id="about">
          <BeforeAfterSection />
        </section>

        {/* 5. Transparent Indian Pricing */}
        <PricingSection onOpenDemo={handleOpenDemo} />

        {/* 6. Frequently Asked Questions */}
        <FAQSection onOpenDemo={handleOpenDemo} />

        {/* 7. High-Impact Call to Action */}
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

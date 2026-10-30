import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import TenantRegister from './TenantRegister';
import LeadCaptureModal from './interactive/LeadCaptureModal';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const location = useLocation();

  const handleOpenDemo = () => setIsDemoModalOpen(true);
  const handleCloseDemo = () => setIsDemoModalOpen(false);

  const handleScrollToOnboard = () => {
    const el = document.getElementById('onboard') || document.getElementById('register');
    if (el) {
      const navOffset = 75;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth'
      });
    }
  };

  // If query params have invite token or hash has #onboard, smoothly scroll down
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (
      params.get('invite') ||
      params.get('token') ||
      location.hash === '#onboard' ||
      location.hash === '#register' ||
      location.pathname === '/register'
    ) {
      const t1 = setTimeout(handleScrollToOnboard, 150);
      const t2 = setTimeout(handleScrollToOnboard, 500);
      const t3 = setTimeout(handleScrollToOnboard, 900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [location]);

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
        <CTASection onOpenDemo={handleOpenDemo} onScrollToOnboard={handleScrollToOnboard} />

        {/* 10. Embedded Cafe Onboarding & Registration Form */}
        <section id="onboard" style={{ padding: '60px 0 100px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', position: 'relative' }}>
          <div className="container" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 14px', borderRadius: '100px', display: 'inline-block' }}>
              ⚡ 14-Day Free Trial • Instant Cafe Onboarding
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 42px)', fontWeight: 900, color: '#0f172a', margin: '12px 0 6px', letterSpacing: '-0.02em' }}>
              Register & Launch Your Restaurant
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '580px', margin: '0 auto', lineHeight: 1.5 }}>
              Enter your restaurant details below, verify your email via OTP, and submit your application for fast-track Super Admin approval.
            </p>
          </div>
          <TenantRegister embedded={true} />
        </section>
      </main>

      {/* Footer */}
      <section id="contact">
        <Footer onOpenDemo={handleOpenDemo} />
      </section>

      {/* Interactive Overlays (Zero Overlap) */}
      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={handleCloseDemo}
        title="Schedule a Personalized DINEVIQ Walkthrough"
        subtitle="See how DINEVIQ cuts table turn times and automates your kitchen in under 15 minutes."
      />
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import PricingCalculator from '../interactive/PricingCalculator';
import { CreditCard } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function PricingSection({ onOpenDemo }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const pricingCardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Pricing Calculator Container Entrance
      if (pricingCardRef.current) {
        gsap.fromTo(
          pricingCardRef.current,
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: pricingCardRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" style={{ padding: "100px 0", background: "#ffffff", borderTop: "1px solid var(--border-subtle)", position: "relative" }}>
      <div className="container">
        {/* Section Header */}
        <div ref={headerRef} style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 50px auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="badge-pill badge-blue">
            <CreditCard style={{ width: 14, height: 14 }} />
            <span>Transparent Indian Pricing in ₹</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
            Fair Plans for Every Stage of Growth
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
            No hidden setup fees. Free menu digitization, live onboarding, and 24/7 priority support across India.
          </p>
        </div>

        {/* Pricing Table Component */}
        <div ref={pricingCardRef}>
          <PricingCalculator onOpenDemoModal={onOpenDemo} />
        </div>
      </div>
    </section>
  );
}

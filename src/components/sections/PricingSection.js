import React, { useEffect, useRef } from 'react';
import PricingCalculator from '../interactive/PricingCalculator';
import { CreditCard } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/Pricing.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function PricingSection({ onOpenDemo }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const pricingCardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Header scrub reveal
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              end: "top 55%",
              scrub: 1
            }
          }
        );
      }

      // 2. Pricing table card 3D lift scrub
      if (pricingCardRef.current) {
        gsap.fromTo(
          pricingCardRef.current,
          { opacity: 0.4, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: pricingCardRef.current,
              start: "top 90%",
              end: "top 45%",
              scrub: 1.2
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className={styles.pricingSection}>
      <div className="container">
        {/* Section Header */}
        <div ref={headerRef} className={styles.sectionHeader}>
          <div className="badge-pill badge-blue">
            <CreditCard style={{ width: 14, height: 14 }} />
            <span>Transparent Indian Pricing in ₹</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Fair Plans for Every Stage of Growth
          </h2>
          <p className={styles.sectionSubtitle}>
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

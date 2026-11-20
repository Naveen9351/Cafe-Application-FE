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
      // 1. Header blur-to-focus reveal
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 32, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // 2. Pricing table card 3D lift scrub
      if (pricingCardRef.current) {
        gsap.fromTo(
          pricingCardRef.current,
          { opacity: 0.25, y: 60, scale: 0.94, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: pricingCardRef.current,
              start: "top 92%",
              end: "top 42%",
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

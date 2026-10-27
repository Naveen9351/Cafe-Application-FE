import React, { useEffect, useRef } from 'react';
import ROICalculator from '../interactive/ROICalculator';
import AnalyticsInteractivePreview from '../interactive/AnalyticsInteractivePreview';
import { TrendingUp } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function TrustAndROISection({ onOpenDemo }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const roiRef = useRef(null);
  const analyticsHeaderRef = useRef(null);
  const analyticsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Snappy non-blocking entrance
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} style={{ padding: "100px 0", background: "var(--bg-card-subtle)", borderTop: "1px solid var(--border-subtle)", position: "relative" }}>
      <div className="container">
        
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 50px auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="badge-pill badge-blue">
            <TrendingUp style={{ width: 14, height: 14 }} />
            <span>Data-Driven Profit Engine</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
            Measurable ROI, <span className="gradient-text">Guaranteed from Day 1</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
            Calculate your estimated monthly revenue lift, reduced ticket errors, and labor savings with DINEVIQ.
          </p>
        </div>

        {/* ROI Calculator Component */}
        <div ref={roiRef} style={{ marginBottom: 60 }}>
          <ROICalculator onOpenDemoModal={onOpenDemo} />
        </div>

        {/* Live Analytics Dashboard Preview */}
        <div style={{ paddingTop: 40, borderTop: "1px solid var(--border-subtle)" }}>
          <div ref={analyticsHeaderRef} style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 30px auto" }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", margin: "0 0 8px 0" }}>
              Real-Time Visibility into Every Rupee & Order
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Monitor speed of service, top items, revenue channels, and staff performance in a unified live control room.
            </p>
          </div>
          <div ref={analyticsRef}>
            <AnalyticsInteractivePreview />
          </div>
        </div>

      </div>
    </section>
  );
}

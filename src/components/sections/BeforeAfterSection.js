import React, { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "../../styles/BeforeAfterSection.module.css";

gsap.registerPlugin(ScrollTrigger);

const COMPARISON_DATA = [
  {
    dimension: "Seated Table Ordering",
    legacy: "Waiters write notes on paper; punch tickets into a central terminal 6-10 mins later.",
    platform: "Instant table QR scan; orders arrive directly on kitchen screens in < 50ms."
  },
  {
    dimension: "Kitchen SLA & Timers",
    legacy: "Paper slips pinned to kitchen rail with grease & heat damage; zero countdown visibility.",
    platform: "Color-coded SLA timers (Green → Amber → Red) with automatic multi-station balancing."
  },
  {
    dimension: "Recipe Stock Depletion",
    legacy: "Manual end-of-day stock count with undetected wastage and weekend ingredient run-outs.",
    platform: "Live recipe-level deduction every time a dish is ordered with automated vendor PO alerts."
  },
  {
    dimension: "Table Checkout & Payment",
    legacy: "Diners wait 12-15 mins for check folder, card machine handover, and printed slip.",
    platform: "Direct UPI table settlement (GPay, PhonePe, Paytm) anytime with instant WhatsApp receipts."
  },
  {
    dimension: "Hardware Lock-In",
    legacy: "Proprietary expensive terminals ($1,500+), wired cables, and annual maintenance contracts.",
    platform: "Zero hardware lock-in — runs seamlessly on any Android, iOS tablet, phone, or laptop."
  }
];

export default function BeforeAfterSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tableCardRef = useRef(null);
  const rowsRef = useRef([]);

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

      // 2. High-Impact 3D Scroll Scrub on Table Card
      if (tableCardRef.current) {
        gsap.fromTo(
          tableCardRef.current,
          { opacity: 0.35, y: 70, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: tableCardRef.current,
              start: "top 90%",
              end: "top 45%",
              scrub: 1.2
            }
          }
        );
      }

      // 3. Staggered Row reveals on scroll
      if (rowsRef.current.length) {
        gsap.fromTo(
          rowsRef.current,
          { opacity: 0.4, y: 15 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            ease: "power1.out",
            scrollTrigger: {
              trigger: tableCardRef.current,
              start: "top 75%",
              end: "top 35%",
              scrub: 1
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.sectionWrapper}>
      <div className="container">
        
        {/* Section Heading */}
        <div ref={headerRef} className={styles.sectionHeader}>
          <div className="badge-pill badge-blue">
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Operational Shift</span>
          </div>

          <h2 className={styles.sectionTitle}>
            Legacy Terminal POS &amp; Paper <span style={{ color: "var(--text-light)" }}>vs</span> <span className="gradient-text">DINEVIQ Platform</span>
          </h2>

          <p className={styles.sectionSubtitle}>
            See how forward-thinking restaurants replace legacy friction with autonomous digital speed.
          </p>
        </div>

        {/* Clean Comparison Table Card — Desktop View */}
        <div ref={tableCardRef} className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.thDimension}>Operational Dimension</th>
                  <th className={styles.thLegacy}>Legacy Terminal POS &amp; Paper</th>
                  <th className={styles.thPlatform}>DINEVIQ Autonomous Platform</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, idx) => (
                  <tr
                    key={idx}
                    ref={(el) => { rowsRef.current[idx] = el; }}
                    className={styles.tableBodyRow}
                  >
                    <td className={styles.tdDimension}>{row.dimension}</td>
                    <td className={styles.tdLegacy}>{row.legacy}</td>
                    <td className={styles.tdPlatform}>{row.platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Responsive Cards View (Clean, High-Contrast Mobile Cards) */}
        <div className={styles.mobileCardsList}>
          {COMPARISON_DATA.map((row, idx) => (
            <div key={idx} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileDimensionNum}>0{idx + 1}</span>
                <span className={styles.mobileDimensionTitle}>{row.dimension}</span>
              </div>
              <div className={styles.mobileLegacyBox}>
                <div className={styles.mobileTagLegacy}>Legacy Paper POS</div>
                <div className={styles.mobileLegacyText}>{row.legacy}</div>
              </div>
              <div className={styles.mobileDineviqBox}>
                <div className={styles.mobileTagDineviq}>DINEVIQ Platform</div>
                <div className={styles.mobileDineviqText}>{row.platform}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

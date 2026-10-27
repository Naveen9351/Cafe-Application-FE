import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  ArrowRight,
  Sparkles,
  Flame,
  Zap,
  CheckCircle2
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import KDSSimulator from "../interactive/KDSSimulator";
import { FLAGSHIP_PRODUCTS } from "../../data/productsData";
import styles from "../../styles/FlagshipSections.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function FlagshipKDSSection({ onOpenDemo }) {
  const kdsProduct = FLAGSHIP_PRODUCTS[1];
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const metricsRef = useRef(null);
  const simulatorCardRef = useRef(null);

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
    <section ref={sectionRef} className={`${styles.section} ${styles.sectionWhite}`}>
      <div className="container">
        
        {/* Header Row */}
        <div ref={headerRef} className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className="badge-pill badge-indigo">
              <LayoutGrid style={{ width: 14, height: 14 }} />
              <span>{kdsProduct.badge} • Kitchen Coordination Engine</span>
            </div>
            <h2 className={styles.title}>
              {kdsProduct.name}
            </h2>
            <p className={styles.desc}>
              {kdsProduct.description}
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={onOpenDemo}
              className="btn-electric"
              style={{ fontSize: 13, padding: "12px 24px" }}
            >
              <span>Schedule KDS Walkthrough</span>
              <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
            <Link
              to="/features/kitchen-ops"
              className="btn-white"
              style={{ fontSize: 13, padding: "12px 20px" }}
            >
              <span>View Multi-Station Specs</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div ref={metricsRef} className={styles.metricsRow}>
          <div
            className={styles.metricCard}
            style={{ transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(37,99,235,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div className={styles.metricValue}>&lt; 50ms</div>
            <div className={styles.metricTitle}>Instant KOT Arrival Speed</div>
            <p className={styles.metricDesc}>Zero waiting for servers to punch tickets at stationary POS.</p>
          </div>

          <div
            className={styles.metricCard}
            style={{ transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(16,185,129,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div className={styles.metricValue} style={{ color: "var(--color-emerald)" }}>0 Paper KOTs</div>
            <div className={styles.metricTitle}>100% Digital Queue Accuracy</div>
            <p className={styles.metricDesc}>Eliminates lost tickets, grease damage, and thermal paper waste.</p>
          </div>

          <div
            className={styles.metricCard}
            style={{ transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(79,70,229,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div className={styles.metricValue} style={{ color: "var(--color-indigo)" }}>4-Stage Flow</div>
            <div className={styles.metricTitle}>Complete Kitchen Visibility</div>
            <p className={styles.metricDesc}>New → Preparing → Ready → Served synchronized lifecycle.</p>
          </div>
        </div>

        {/* Real Interactive KDS Grid Simulator */}
        <div ref={simulatorCardRef} className={styles.cardContainer}>
          <div className={styles.cardHeader}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text-main)" }}>
                Live Interactive Kitchen Display System (KDS)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Click "Start Preparing", "Mark Ready", or "Undo" on any ticket to test live state transitions.
              </div>
            </div>
            <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>
              Live Telemetry Active
            </span>
          </div>

          <KDSSimulator />
        </div>

      </div>
    </section>
  );
}

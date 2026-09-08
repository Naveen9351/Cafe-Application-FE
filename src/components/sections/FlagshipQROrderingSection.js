import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Zap
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GuidedQRExperience from "../interactive/GuidedQRExperience";
import ScannableQRWidget from "../interactive/ScannableQRWidget";
import { FLAGSHIP_PRODUCTS } from "../../data/productsData";
import styles from "../../styles/FlagshipSections.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function FlagshipQROrderingSection({ onOpenDemo }) {
  const qrProduct = FLAGSHIP_PRODUCTS[0];
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const spotlightsRef = useRef(null);
  const widgetRef = useRef(null);
  const guidedRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Spotlight Image Cards Stagger & 3D tilt entrance
      if (spotlightsRef.current) {
        gsap.fromTo(
          spotlightsRef.current.children,
          { opacity: 0, y: 40, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: spotlightsRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Live Scannable Widget
      if (widgetRef.current) {
        gsap.fromTo(
          widgetRef.current,
          { opacity: 0, y: 45 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: widgetRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Guided Simulator Box
      if (guidedRef.current) {
        gsap.fromTo(
          guidedRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: guidedRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.sectionLight}`}>
      <div className="container">
        
        {/* Header Row */}
        <div ref={headerRef} className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className="badge-pill badge-blue">
              <QrCode style={{ width: 14, height: 14 }} />
              <span>{qrProduct.badge} • Flagship Innovation</span>
            </div>
            <h2 className={styles.title}>
              {qrProduct.name}
            </h2>
            <p className={styles.desc}>
              {qrProduct.description}
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={onOpenDemo}
              className="btn-electric"
              style={{ fontSize: 13, padding: "12px 24px" }}
            >
              <span>Schedule QR Walkthrough</span>
              <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
            <Link
              to="/menu"
              className="btn-white"
              style={{ fontSize: 13, padding: "12px 20px" }}
            >
              <span>Open Full Screen QR Menu</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>

        {/* Visual Spotlight Grid with Interactive Hover Transforms */}
        <div
          ref={spotlightsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}
        >
          <div
            style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              height: 200,
              background: '#f8fafc',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(37,99,235,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
              alt="Gourmet Food Experience"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 18px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.4) 60%, transparent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Sparkles style={{ width: 14, height: 14, color: '#60a5fa' }} />
              Visual Dish Descriptions & AI Modifiers
            </div>
          </div>

          <div
            style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              height: 200,
              background: '#f8fafc',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(16,185,129,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
              alt="Artisan Dining"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 18px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.4) 60%, transparent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Zap style={{ width: 14, height: 14, color: '#34d399' }} />
              Instant UPI Table Settlement (GPay / PhonePe)
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Showcases */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Live Scannable Real Camera QR Card */}
          <div ref={widgetRef}>
            <ScannableQRWidget />
          </div>

          {/* Guided Step Walkthrough Card */}
          <div ref={guidedRef} className={styles.cardContainer}>
            <div className={styles.cardHeader}>
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                Live Interactive Ordering Stage Simulator
              </span>
              <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>
                Interactive
              </span>
            </div>

            <GuidedQRExperience />
          </div>
        </div>

      </div>
    </section>
  );
}

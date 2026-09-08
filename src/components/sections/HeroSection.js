import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Utensils,
  TrendingUp,
  Flame,
  Zap,
  QrCode,
  ShieldCheck,
  Award
} from "lucide-react";
import { gsap } from "gsap";
import LiveConnectedSimulator from "../interactive/LiveConnectedSimulator";
import styles from "../../styles/HeroSection.module.css";

const ROTATING_PHRASES = [
  "Scale High-Speed Kitchens",
  "Table QR to Kitchen Line",
  "Recipe-Level Stock Automation",
  "Maximize Table Velocity",
  "Zero-Latency KDS Queues"
];

const MARQUEE_ITEMS = [
  { label: "Bistros, Cafes & Fine Dining", icon: Utensils },
  { label: "< 50ms KOT Dispatch", icon: Zap },
  { label: "+24% Check Size via Modifiers", icon: TrendingUp },
  { label: "Multi-Station Kitchen Balancing", icon: Flame },
  { label: "Recipe-Level Stock Depletion", icon: Sparkles },
  { label: "UPI & Zero App Downloads", icon: CheckCircle2 },
  { label: "AI-Powered Upsell Engine", icon: Sparkles },
  { label: "Real-Time BI Dashboard", icon: TrendingUp },
  { label: "Zomato & Swiggy Integration", icon: Utensils },
  { label: "WhatsApp Order Receipts", icon: CheckCircle2 }
];

export default function HeroSection({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;

  // Typewriter states
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(60);

  const heroRef = useRef(null);
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const consoleRef = useRef(null);
  const showcaseRef = useRef(null);
  const marqueeRef = useRef(null);
  const trustRef = useRef(null);

  // GSAP Entrance Timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: -20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7 }
      )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.4"
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          trustRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          showcaseRef.current?.children || [],
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: "back.out(1.4)" },
          "-=0.3"
        )
        .fromTo(
          consoleRef.current,
          { opacity: 0, y: 35, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          marqueeRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Character-by-character typewriter loop
  useEffect(() => {
    const currentPhrase = ROTATING_PHRASES[phraseIndex];

    const handleType = () => {
      if (!isDeleting) {
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        setTypingSpeed(45);

        if (displayText.length + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        setTypingSpeed(25);

        if (displayText.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
          setTypingSpeed(300);
        }
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex, typingSpeed]);

  // Doubled items for seamless marquee loop
  const doubledMarquee = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <section ref={heroRef} className={styles.heroSection}>
      {/* Ambient Lighting Cones */}
      <div className={styles.ambientCone1} />
      <div className={styles.ambientCone2} />

      <div className="container">
        
        {/* Main Hero Header */}
        <div className={styles.heroContent}>
          
          {/* Top Badge */}
          <div ref={badgeRef} className={styles.heroBadge}>
            <span className={styles.pulseDot} />
            <span>SARVIQ 2026 AI OS • Autonomous Restaurant Platform</span>
          </div>

          {/* Dynamic Headline with Active Typewriter */}
          <h1 ref={titleRef} className={styles.heroTitle}>
            The Autonomous OS for{" "}
            <br />
            <span className={`${styles.typingPhrase} gradient-text`}>
              {displayText}
              <span className={styles.typeCursor}>|</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p ref={subtitleRef} className={styles.heroSubtitle}>
            Eliminate server wait times, coordinate multi-station kitchens with sub-50ms KDS queues, and automate raw ingredient stock depletion — all unified in one cloud console.
          </p>

          {/* Action CTAs */}
          <div ref={ctaRef} className={styles.heroCtas}>
            {triggerDemo ? (
              <button
                type="button"
                onClick={triggerDemo}
                className="btn-electric"
                style={{ padding: "12px 24px", fontSize: 13 }}
              >
                <span>Book a 15-Min Live Demo</span>
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            ) : (
              <Link
                to="/demo"
                className="btn-electric"
                style={{ padding: "12px 24px", fontSize: 13 }}
              >
                <span>Book a 15-Min Live Demo</span>
                <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            )}

            <Link
              to="/menu"
              className="btn-white"
              style={{ padding: "12px 20px", fontSize: 13 }}
            >
              <QrCode style={{ width: 15, height: 15, color: "var(--color-emerald)" }} />
              <span>Test Live Customer QR Menu</span>
            </Link>

            <Link
              to="/pricing"
              className="btn-secondary-pill"
              style={{ padding: "9px 16px", fontSize: 12 }}
            >
              <span>Explore Plans in ₹</span>
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Trust Value Badges */}
          <div ref={trustRef} className={styles.trustMetrics}>
            <div className={styles.metricItem}>
              <CheckCircle2 style={{ width: 15, height: 15, color: "var(--color-emerald)" }} />
              <span>14-Day Free Trial</span>
            </div>
            <div className={styles.metricItem}>
              <ShieldCheck style={{ width: 15, height: 15, color: "var(--color-primary)" }} />
              <span>Zero Hardware Lock-in</span>
            </div>
            <div className={styles.metricItem}>
              <Award style={{ width: 15, height: 15, color: "var(--color-indigo)" }} />
              <span>Live in 20 Minutes</span>
            </div>
          </div>
        </div>

        {/* ── Visual Showcase Image Cards ── */}
        <div ref={showcaseRef} className={styles.heroShowcaseGrid}>
          <div className={styles.heroCardImg}>
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
              alt="Modern Restaurant Dining"
              loading="lazy"
            />
            <div className={styles.heroCardOverlay}>
              <span className={styles.heroCardLabel}>Dine-In Atmosphere</span>
              <span className={styles.heroCardPill}>Table QR Ready</span>
            </div>
          </div>

          <div className={styles.heroCardImg}>
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"
              alt="High-Speed Kitchen Display"
              loading="lazy"
            />
            <div className={styles.heroCardOverlay}>
              <span className={styles.heroCardLabel}>Kitchen KDS Line</span>
              <span className={styles.heroCardPill}>&lt; 50ms Dispatch</span>
            </div>
          </div>

          <div className={styles.heroCardImg}>
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
              alt="Artisan Food & Drinks"
              loading="lazy"
            />
            <div className={styles.heroCardOverlay}>
              <span className={styles.heroCardLabel}>Recipe Inventory</span>
              <span className={styles.heroCardPill}>Auto-Depleted</span>
            </div>
          </div>
        </div>

        {/* ── Interactive Live Dual Simulator Box ── */}
        <div ref={consoleRef} className={styles.simulatorWrapper}>
          <div className={styles.simulatorTopRibbon}>
            <Sparkles style={{ width: 14, height: 14 }} />
            Interactive Live Sandbox: Tap to Place an Order Below!
          </div>

          <LiveConnectedSimulator />
        </div>

        {/* ── Auto-Scrolling Marquee Feature Ticker ── */}
        <div ref={marqueeRef} className={styles.marqueeBar}>
          <div className={styles.marqueeTrack}>
            {doubledMarquee.map((item, idx) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={idx}>
                  <div className={styles.marqueeChip}>
                    <Icon style={{ width: 14, height: 14, color: "var(--color-primary)", flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </div>
                  <div className={styles.marqueeDivider} />
                </React.Fragment>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

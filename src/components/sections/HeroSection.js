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
  Award,
  ChevronDown
} from "lucide-react";
import { gsap } from "gsap";
import LiveConnectedSimulator from "../interactive/LiveConnectedSimulator";
import heroImg from "../../assets/hero-dineviq-3d-ecosystem-transparent.png";
import styles from "../../styles/HeroSection.module.css";

const ROTATING_PHRASES = [
  "High-Speed Kitchens",
  "Zero-Wait QR Dining",
  "Recipe Stock Depletion",
  "Multi-Station KDS",
  "Instant Cloud POS"
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
  const trustRef = useRef(null);
  const imageRef = useRef(null);
  const consoleRef = useRef(null);
  const marqueeRef = useRef(null);

  // Fast, instant entrance animation (Snappy, zero delay)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [badgeRef.current, titleRef.current, subtitleRef.current, ctaRef.current, trustRef.current],
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }
      );
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }
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
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        setTypingSpeed(22);

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

  const handleScrollDown = (e) => {
    e.preventDefault();
    const sandboxEl = document.getElementById("live-sandbox");
    if (sandboxEl) {
      sandboxEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={heroRef} className={styles.heroSection}>
      {/* Ambient Lighting Cones */}
      <div className={styles.ambientCone1} />
      <div className={styles.ambientCone2} />

      {/* ── 1. Full Screen Initial Viewport (100vh on Desktop) ── */}
      <div className={styles.heroViewport}>
        <div className={styles.heroContainer}>
          <div className={styles.heroGrid}>
            
            {/* ── Left Column: Headline, Subtitle, CTAs & Trust Badges ── */}
            <div className={styles.heroTextColumn}>
              
              {/* Top Status Pill */}
              <div ref={badgeRef} className={styles.heroBadge}>
                <span className={styles.pulseDot} />
                <span>DINEVIQ 2026 AI OS • Autonomous Restaurant Platform</span>
              </div>

              {/* Dynamic Headline with Active Typewriter (Reduced Size, Left-aligned, Unbreakable) */}
              <h1 ref={titleRef} className={styles.heroTitle}>
                The Autonomous OS for{" "}
                <br />
                <span className={styles.typingPhraseWrapper}>
                  <span className={`${styles.typingPhrase} gradient-text`}>
                    {displayText}
                  </span>
                  <span className={styles.typeCursor}>|</span>
                </span>
              </h1>

              {/* Clear Value Proposition Subtitle */}
              <p ref={subtitleRef} className={styles.heroSubtitle}>
                Eliminate server wait times, coordinate multi-station kitchens with sub-50ms KDS queues, and automate raw ingredient stock depletion — all unified in one cloud console.
              </p>

              {/* Action Buttons */}
              <div ref={ctaRef} className={styles.heroCtas}>
                {triggerDemo ? (
                  <button
                    type="button"
                    onClick={triggerDemo}
                    className="btn-electric"
                    style={{ padding: "11px 22px", fontSize: 13, cursor: "pointer" }}
                  >
                    <span>Book a 15-Min Live Demo</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                ) : (
                  <Link
                    to="/demo"
                    className="btn-electric"
                    style={{ padding: "11px 22px", fontSize: 13 }}
                  >
                    <span>Book a 15-Min Live Demo</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                )}

                <Link
                  to="/menu"
                  className="btn-white"
                  style={{ padding: "11px 20px", fontSize: 13 }}
                >
                  <QrCode style={{ width: 15, height: 15, color: "var(--color-emerald)" }} />
                  <span>Test Customer QR Menu</span>
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
                  <CheckCircle2 style={{ width: 14, height: 14, color: "var(--color-emerald)" }} />
                  <span>14-Day Free Trial</span>
                </div>
                <div className={styles.metricItem}>
                  <ShieldCheck style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
                  <span>Zero Hardware Lock-in</span>
                </div>
                <div className={styles.metricItem}>
                  <Award style={{ width: 14, height: 14, color: "var(--color-indigo)" }} />
                  <span>Live in 20 Minutes</span>
                </div>
              </div>

            </div>

            {/* ── Right Column: 3D DINEVIQ Ecosystem Showcase ── */}
            <div ref={imageRef} className={styles.heroVisualColumn}>
              <div className={styles.imageShowcaseWrapper}>
                <img
                  src={heroImg}
                  alt="DINEVIQ AI OS — Kitchen KDS, QR Dining, Khushi AI, UPI Billing & Inventory Ecosystem"
                  className={styles.heroEcosystemImg}
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll Cue Indicator */}
        <a
          href="#live-sandbox"
          onClick={handleScrollDown}
          className={styles.scrollIndicator}
          aria-label="Scroll to explore live sandbox"
        >
          <span>Scroll to explore live sandbox</span>
          <ChevronDown className={styles.scrollChevron} />
        </a>
      </div>

      {/* ── 2. Extended Content (Revealed upon scrolling down) ── */}
      <div className={styles.heroExtendedSection}>
        {/* Auto-Scrolling Marquee Feature Ticker */}
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

        {/* Interactive Live Dual Simulator Box */}
        <div id="live-sandbox" ref={consoleRef} className={styles.simulatorWrapper}>
          <div className={styles.simulatorTopRibbon}>
            <Sparkles style={{ width: 14, height: 14 }} />
            Interactive Live Sandbox: Tap to Place an Order Below!
          </div>

          <LiveConnectedSimulator />
        </div>
      </div>
    </section>
  );
}

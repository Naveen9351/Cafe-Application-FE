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
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LiveConnectedSimulator from "../interactive/LiveConnectedSimulator";
import heroImg from "../../assets/hero-dineviq-3d-ecosystem-transparent.png";
import styles from "../../styles/HeroSection.module.css";

gsap.registerPlugin(ScrollTrigger);

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
  const pill1Ref = useRef(null);
  const pill2Ref = useRef(null);
  const consoleRef = useRef(null);
  const marqueeRef = useRef(null);

  // High-End GSAP Animations & Scroll Scrub Physics
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Cinematic initial entrance with Blur-to-focus & Stagger
      if (badgeRef.current) {
        gsap.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.9, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.6)" }
        );
      }
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 26, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, delay: 0.1, ease: "power3.out" }
        );
      }
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, delay: 0.25, ease: "power3.out" }
        );
      }
      if (ctaRef.current?.children) {
        gsap.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 16, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 0.38, stagger: 0.08, ease: "power2.out" }
        );
      }
      if (trustRef.current?.children) {
        gsap.fromTo(
          trustRef.current.children,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.52, stagger: 0.08, ease: "power2.out" }
        );
      }
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { opacity: 0, scale: 0.9, y: 32, filter: "blur(12px)" },
          { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1.1, delay: 0.18, ease: "power3.out" }
        );
      }

      // 2. Continuous organic floating levitation on the 3D visual & pills
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          y: -12,
          rotation: 0.7,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      if (pill1Ref.current) {
        gsap.to(pill1Ref.current, {
          y: -9,
          x: 5,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
      if (pill2Ref.current) {
        gsap.to(pill2Ref.current, {
          y: 9,
          x: -5,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      // 3. Smooth scroll scrub parallax on hero 3D visual
      if (imageRef.current && heroRef.current) {
        gsap.to(imageRef.current, {
          y: -75,
          scale: 1.05,
          rotateY: -7,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.3
          }
        });
      }

      // 4. High-Impact Scroll Scrub 3D Lift on Simulator Box
      if (consoleRef.current) {
        gsap.fromTo(
          consoleRef.current,
          { opacity: 0.28, y: 90, scale: 0.93, rotateX: 7 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: consoleRef.current,
              start: "top 95%",
              end: "top 42%",
              scrub: 1.2
            }
          }
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Interactive 3D mouse tilt tracking for hero ecosystem visual
  const handleHeroMouseMove = (e) => {
    if (!imageRef.current || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    gsap.to(imageRef.current, {
      rotateY: x * 5.5,
      rotateX: -y * 4.5,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const handleHeroMouseLeave = () => {
    if (!imageRef.current) return;
    gsap.to(imageRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.9,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

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
    <section
      ref={heroRef}
      className={styles.heroSection}
      onMouseMove={handleHeroMouseMove}
      onMouseLeave={handleHeroMouseLeave}
    >
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
                    <span className={styles.btnFullText}>Book a 15-Min Live Demo</span>
                    <span className={styles.btnShortText}>Book Live Demo</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                ) : (
                  <Link
                    to="/demo"
                    className="btn-electric"
                    style={{ padding: "11px 22px", fontSize: 13 }}
                  >
                    <span className={styles.btnFullText}>Book a 15-Min Live Demo</span>
                    <span className={styles.btnShortText}>Book Live Demo</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                )}

                <Link
                  to="/menu"
                  className="btn-white"
                  style={{ padding: "11px 20px", fontSize: 13 }}
                >
                  <QrCode style={{ width: 15, height: 15, color: "var(--color-emerald)" }} />
                  <span className={styles.btnFullText}>Test Customer QR Menu</span>
                  <span className={styles.btnShortText}>Test QR Menu</span>
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
                <div ref={pill1Ref} className={styles.heroFloatingPill1}>
                  <span className={styles.pulseDotGreen} />
                  <Zap style={{ width: 13, height: 13, color: "var(--color-primary)" }} />
                  <span>&lt; 50ms KOT Instant Dispatch</span>
                </div>

                <img
                  src={heroImg}
                  alt="DINEVIQ AI OS — Kitchen KDS, QR Dining, DineviQ AI, UPI Billing & Inventory Ecosystem"
                  className={styles.heroEcosystemImg}
                  loading="eager"
                  fetchpriority="high"
                />

                <div ref={pill2Ref} className={styles.heroFloatingPill2}>
                  <TrendingUp style={{ width: 13, height: 13, color: "var(--color-emerald)" }} />
                  <span>+24% Check Size via Modifiers</span>
                </div>
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
          <LiveConnectedSimulator />
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, PhoneCall, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/CTASection.module.css';

gsap.registerPlugin(ScrollTrigger);

const VALUE_PROPS = [
  { icon: ShieldCheck, color: "#86efac", text: "Works on any mobile / iOS browser", shortText: "Works on any device" },
  { icon: Zap, color: "#fde047", text: "Instant table QR menu generation", shortText: "Instant QR setup" },
  { icon: PhoneCall, color: "#ffffff", text: "Direct Indian WhatsApp tech support", shortText: "WhatsApp support" },
  { icon: CheckCircle2, color: "#6ee7b7", text: "14-Day free trial, zero setup fee", shortText: "14-Day free trial" }
];

// Floating particle positions (deterministic)
const PARTICLES = [
  { size: 6, top: "15%", left: "8%", delay: 0, dur: 6 },
  { size: 4, top: "25%", left: "85%", delay: 1, dur: 7 },
  { size: 8, top: "60%", left: "12%", delay: 2, dur: 8 },
  { size: 5, top: "70%", left: "80%", delay: 0.5, dur: 6.5 },
  { size: 6, top: "40%", left: "92%", delay: 1.5, dur: 7.5 },
  { size: 4, top: "85%", left: "20%", delay: 3, dur: 9 },
  { size: 5, top: "10%", left: "55%", delay: 2.5, dur: 6 },
  { size: 7, top: "50%", left: "48%", delay: 4, dur: 8.5 }
];

export default function CTASection({ onOpenDemo }) {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const actionsRef = useRef(null);
  const propsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. High-Impact Scroll Scrub Zoom on CTA Card
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0.4, y: 70, scale: 0.93 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: cardRef.current,
              start: "top 90%",
              end: "top 45%",
              scrub: 1.2
            }
          }
        );

        // Continuous subtle neon pulse on the card border glow
        gsap.to(cardRef.current, {
          boxShadow: "0 30px 80px rgba(15,23,42,0.55), 0 0 60px rgba(16,185,129,0.32)",
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }

      // 2. Coordinated text, button & trust prop reveal inside card
      if (cardRef.current) {
        const contentTl = gsap.timeline({
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        });

        if (badgeRef.current) {
          contentTl.fromTo(
            badgeRef.current,
            { opacity: 0, scale: 0.9, y: 12 },
            { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }
          );
        }
        if (titleRef.current) {
          contentTl.fromTo(
            titleRef.current,
            { opacity: 0, y: 22, filter: "blur(10px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75, ease: "power3.out" },
            "-=0.4"
          );
        }
        if (subtitleRef.current) {
          contentTl.fromTo(
            subtitleRef.current,
            { opacity: 0, y: 18, filter: "blur(6px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.65, ease: "power3.out" },
            "-=0.4"
          );
        }
        if (actionsRef.current?.children) {
          contentTl.fromTo(
            actionsRef.current.children,
            { opacity: 0, y: 16, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
            "-=0.3"
          );
        }
        if (propsRef.current?.children) {
          contentTl.fromTo(
            propsRef.current.children,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" },
            "-=0.3"
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.ctaSection}>
      <div className="container">
        <div ref={cardRef} className={styles.ctaCard}>
          {/* Animated Floating Particles */}
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
                pointerEvents: "none",
                zIndex: 1
              }}
            />
          ))}

          {/* Mesh grid overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            zIndex: 1,
            pointerEvents: "none"
          }} />

          {/* Ambient light top center */}
          <div style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 300,
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
            zIndex: 1
          }} />

          {/* Content above z-index particles */}
          <div style={{ position: "relative", zIndex: 2 }}>
            {/* Badge */}
            <div ref={badgeRef} className={styles.ctaBadge}>
              <Sparkles style={{ width: 14, height: 14 }} />
              Zero Setup Fee • 14-Day Free Trial
            </div>

            {/* Heading */}
            <h2 ref={titleRef} className={styles.ctaTitle}>
              Ready to Transform Your Restaurant?
            </h2>

            <p ref={subtitleRef} className={styles.ctaSubtitle}>
              <span className={styles.subFullText}>
                Join hundreds of forward-thinking Indian cafes, QSRs, and dining rooms cutting wait times and maximizing table turn rates with DINEVIQ.
              </span>

            </p>

            {/* CTA Buttons in 2-Col Grid on Mobile */}
            <div ref={actionsRef} className={styles.ctaActions}>
              <button
                type="button"
                onClick={onOpenDemo}
                className={styles.btnPrimary}
              >
                <span className={styles.btnFullText}>Schedule Live Walkthrough</span>
                <span className={styles.btnShortText}>Live Demo</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>

              <Link
                to="/register"
                className={styles.btnSecondary}
              >
                <Zap style={{ width: 14, height: 14, color: "#fde047" }} />
                <span className={styles.btnFullText}>Create Restaurant Account</span>
                <span className={styles.btnShortText}>Create Account</span>
              </Link>
            </div>

            {/* Value Props Strip */}
            <div ref={propsRef} className={styles.valueProps}>
              {VALUE_PROPS.map((prop, i) => {
                const Icon = prop.icon;
                return (
                  <div key={i} className={styles.valuePropItem}>
                    <Icon style={{ width: 15, height: 15, color: prop.color, flexShrink: 0 }} />
                    <span className={styles.propFullText}>{prop.text}</span>
                    <span className={styles.propShortText}>{prop.shortText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

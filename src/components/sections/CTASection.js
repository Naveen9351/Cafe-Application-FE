import React, { useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, PhoneCall, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VALUE_PROPS = [
  { icon: ShieldCheck, color: "#86efac", text: "Works on any mobile / iOS browser" },
  { icon: Zap, color: "#fde047", text: "Instant table QR menu generation" },
  { icon: PhoneCall, color: "#ffffff", text: "Direct Indian WhatsApp tech support" },
  { icon: CheckCircle2, color: "#6ee7b7", text: "14-Day free trial, zero setup fee" }
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
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse"
        },
        defaults: { ease: "power3.out" }
      });

      tl.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.94, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.9 }
      )
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: -15, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
          "-=0.5"
        )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3"
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          actionsRef.current.children,
          { opacity: 0, y: 20, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(1.5)" },
          "-=0.25"
        )
        .fromTo(
          propsRef.current.children,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.2"
        );

      // Continuous subtle pulse on the card border glow
      gsap.to(cardRef.current, {
        boxShadow: "0 30px 70px rgba(37,99,235,0.55), 0 0 50px rgba(79,70,229,0.25)",
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} style={{ padding: "100px 0", background: "#ffffff", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container">
        <div
          ref={cardRef}
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "64px 48px",
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #4f46e5 80%, #7c3aed 100%)",
            color: "#ffffff",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(37,99,235,0.35)",
            position: "relative",
            overflow: "hidden"
          }}
        >
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
            <div
              ref={badgeRef}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 18px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 20,
                backdropFilter: "blur(10px)"
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              Zero Setup Fee • 14-Day Free Trial
            </div>

            {/* Heading */}
            <h2
              ref={titleRef}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 4.5vw, 58px)",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                maxWidth: 820,
                margin: "0 auto 16px auto"
              }}
            >
              Ready to Transform Your Restaurant Operations?
            </h2>

            <p
              ref={subtitleRef}
              style={{
                fontSize: "clamp(15px, 1.8vw, 18px)",
                color: "rgba(255, 255, 255, 0.88)",
                maxWidth: 640,
                margin: "0 auto 40px auto",
                lineHeight: 1.6
              }}
            >
              Join hundreds of forward-thinking Indian cafes, QSRs, and dining rooms cutting wait times and maximizing table turn rates with SERVIQ.
            </p>

            {/* CTA Buttons */}
            <div ref={actionsRef} style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={onOpenDemo}
                style={{
                  padding: "15px 34px",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff",
                  color: "var(--color-primary)",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                  transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 18px 36px rgba(0,0,0,0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.18)";
                }}
              >
                <span>Schedule Live Walkthrough</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>

              <Link
                to="/register"
                style={{
                  padding: "15px 28px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(15, 23, 42, 0.35)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  backdropFilter: "blur(8px)",
                  transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                  e.currentTarget.style.background = "rgba(15, 23, 42, 0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.background = "rgba(15, 23, 42, 0.35)";
                }}
              >
                <Zap style={{ width: 15, height: 15, color: "#fde047" }} />
                <span>Create Restaurant Account</span>
              </Link>
            </div>

            {/* Value Props Strip */}
            <div
              ref={propsRef}
              style={{
                marginTop: 52,
                paddingTop: 28,
                borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                justifyContent: "center",
                gap: 32,
                flexWrap: "wrap",
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.9)"
              }}
            >
              {VALUE_PROPS.map((prop, i) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "transform 0.2s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <Icon style={{ width: 16, height: 16, color: prop.color }} />
                    <span>{prop.text}</span>
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

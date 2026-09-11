import React, { useEffect, useRef } from "react";
import {
  XCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const traditionalChaos = [
  {
    title: "Paper Menus & Waiter Bottlenecks",
    desc: "Guests wait 5-8 minutes just to receive a laminated menu. Zero imagery, lost allergy notes, and slow table turns.",
    stat: "8 mins dead time per table"
  },
  {
    title: "Lost Thermal Paper KOT Chits",
    desc: "Printers jam during rush hours. Lost tickets cause expensive kitchen remakes, cold dishes, and guest frustration.",
    stat: "12-15% kitchen order errors"
  },
  {
    title: "15-Minute Bill Drop & Card Delays",
    desc: "Guests wave down waitstaff, wait for manual check folders, and wait for EDC machines, freezing high-value tables.",
    stat: "14 mins idle table lag"
  },
  {
    title: "Manual 86 Item Out-of-Stock Chaos",
    desc: "When items run out, servers forget to notify tables, leading to post-ordering cancellations and reprint costs.",
    stat: "Disappointed dining guests"
  }
];

const sarviqVelocity = [
  {
    title: "Instant Seated QR Visual Menu",
    desc: "Diners scan in 1 second. High-res imagery and AI modifiers trigger instant upselling with zero app download.",
    stat: "+24% higher average check size"
  },
  {
    title: "Sub-50ms Multi-Station KDS Queue",
    desc: "Tickets route to designated station screens with dynamic SLA countdown timers and expo quality control.",
    stat: "100% paperless kitchen accuracy"
  },
  {
    title: "Instant Table-Side UPI Settle",
    desc: "Guests settle checks via direct UPI (GPay, PhonePe, Paytm) anytime and leave happily with instant WhatsApp receipts.",
    stat: "14 mins saved per seated party"
  },
  {
    title: "1-Tap Real-Time 86 Sync",
    desc: "Mark sold-out dishes from any phone in 1 tap; updates live across all digital QR menus instantly.",
    stat: "Zero order rework or misfires"
  }
];

export default function BeforeAfterSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const leftCardRef = useRef(null);
  const rightCardRef = useRef(null);
  const leftItemsRef = useRef([]);
  const rightItemsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation — fires when section top hits 90% from viewport top
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
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

      // Left Column Slide-In (from left)
      if (leftCardRef.current) {
        gsap.fromTo(
          leftCardRef.current,
          { opacity: 0, x: -60, scale: 0.97 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: leftCardRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Right Column Slide-In (from right)
      if (rightCardRef.current) {
        gsap.fromTo(
          rightCardRef.current,
          { opacity: 0, x: 60, scale: 0.97 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightCardRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Stagger left items
      if (leftItemsRef.current.length) {
        gsap.fromTo(
          leftItemsRef.current,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: leftCardRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Stagger right items
      if (rightItemsRef.current.length) {
        gsap.fromTo(
          rightItemsRef.current,
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: rightCardRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: "100px 0",
        background: "var(--bg-card-subtle)",
        borderTop: "1px solid var(--border-subtle)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative background orbs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          animation: "orbitFloat 9s ease-in-out infinite"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "-5%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          animation: "orbitFloat 11s ease-in-out 4s infinite"
        }}
      />

      <div className="container">
        
        {/* Section Heading */}
        <div ref={headerRef} style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 50px auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="badge-pill badge-blue">
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Operational Shift</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
            Traditional Dining Chaos <span style={{ color: "var(--text-light)" }}>vs</span> <span className="gradient-text">SERVIQ Velocity</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
            See how forward-thinking restaurants replace legacy friction with autonomous digital speed.
          </p>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid-2">
          
          {/* Column 1: Traditional Dining */}
          <div
            ref={leftCardRef}
            className="card-luxury"
            style={{
              padding: 32,
              borderColor: "var(--color-rose-border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 24,
              transition: "transform 0.3s ease, box-shadow 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(244,63,94,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid var(--color-rose-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--color-rose-light)", color: "var(--color-rose)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <XCircle style={{ width: 18, height: 18 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", margin: 0 }}>Traditional Floor Workflow</h3>
                </div>
                <span className="badge-pill" style={{ background: "var(--color-rose-light)", color: "var(--color-rose)", fontSize: 10 }}>
                  Legacy Friction
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                {traditionalChaos.map((item, idx) => (
                  <div
                    key={idx}
                    ref={(el) => { leftItemsRef.current[idx] = el; }}
                    style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--color-rose-light)", border: "1px solid rgba(244,63,94,0.15)", transition: "transform 0.2s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{item.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-rose)", background: "#ffffff", padding: "2px 6px", borderRadius: 4 }}>{item.stat}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-rose-light)", color: "var(--color-rose)", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
              Result: Slower table turns, high ticket error rate & lost weekend revenue.
            </div>
          </div>

          {/* Column 2: SERVIQ Autonomous OS */}
          <div
            ref={rightCardRef}
            className="card-luxury"
            style={{
              padding: 32,
              border: "2px solid var(--color-primary)",
              boxShadow: "0 16px 40px rgba(37,99,235,0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 24,
              transition: "transform 0.3s ease, box-shadow 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
              e.currentTarget.style.boxShadow = "0 22px 50px rgba(37,99,235,0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(37,99,235,0.15)";
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid var(--color-primary-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 style={{ width: 18, height: 18 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)", margin: 0 }}>SERVIQ Autonomous OS</h3>
                </div>
                <span className="badge-pill badge-blue" style={{ fontSize: 10 }}>
                  AI Velocity
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                {sarviqVelocity.map((item, idx) => (
                  <div
                    key={idx}
                    ref={(el) => { rightItemsRef.current[idx] = el; }}
                    style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--color-primary-light)", border: "1px solid var(--color-primary-border)", transition: "transform 0.2s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(-4px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{item.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--color-primary)", background: "#ffffff", padding: "2px 6px", borderRadius: 4 }}>{item.stat}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--color-primary)", color: "#ffffff", fontSize: 12, fontWeight: 800, textAlign: "center", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
              Result: 2.4x Faster table turns, zero ticket waste & 99.8% kitchen accuracy.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

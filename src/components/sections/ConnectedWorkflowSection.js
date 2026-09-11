import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Send,
  LayoutGrid,
  Flame,
  BarChart3,
  Cpu,
  Repeat,
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  CheckCircle2,
  Zap,
  Check,
  Smartphone,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Three3DRestaurantEcosystem from "../interactive/Three3DRestaurantEcosystem";
import styles from "../../styles/ServiqWorkflow.module.css";

gsap.registerPlugin(ScrollTrigger);

// Floating particles for dark bg
const DARK_PARTICLES = [
  { size: 3, top: "8%", left: "15%", delay: 0, dur: 7, opacity: 0.3 },
  { size: 5, top: "20%", left: "88%", delay: 1.5, dur: 9, opacity: 0.25 },
  { size: 4, top: "45%", left: "5%", delay: 3, dur: 8, opacity: 0.35 },
  { size: 3, top: "65%", left: "92%", delay: 0.5, dur: 6.5, opacity: 0.2 },
  { size: 6, top: "80%", left: "30%", delay: 2, dur: 10, opacity: 0.15 },
  { size: 4, top: "35%", left: "70%", delay: 4, dur: 8, opacity: 0.3 },
  { size: 3, top: "90%", left: "55%", delay: 1, dur: 7.5, opacity: 0.25 },
  { size: 5, top: "15%", left: "45%", delay: 2.5, dur: 9.5, opacity: 0.2 }
];

export default function ConnectedWorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const sectionRef = useRef(null);
  const bannerRef = useRef(null);
  const headerRef = useRef(null);
  const scrubberRef = useRef(null);
  const stageGridRef = useRef(null);

  // 6 Structured SERVIQ Workflow Stages
  const stages = [
    {
      id: "table-qr",
      num: "01",
      label: "Table QR",
      title: "01 — Table QR",
      headline: "Frictionless Table QR Menu & Visual Ordering",
      desc: "Guest scans a table QR and instantly opens the interactive visual menu in Indian Rupees (₹) — zero app downloads required.",
      icon: QrCode,
      metricLabel: "Diner Friction Time",
      metricValue: "0s Wait Time",
      color: "#10b981",
      internalData: {
        item1: "Woodfired Artisan Margherita",
        price1: "₹420",
        item2: "Dry-Aged Truffle Burger",
        price2: "₹485",
        status: "Scan Beam Active • Table #04"
      }
    },
    {
      id: "ai-modifier",
      num: "02",
      label: "AI Engine",
      title: "02 — AI Modifier Engine",
      headline: "Intelligent Dietary Analysis & Modifier Upselling",
      desc: "SERVIQ AI analyzes dietary tags (Veg/Non-Veg), sides, and pairing combinations to dynamically recommend high-margin add-ons.",
      icon: Cpu,
      metricLabel: "Potential AOV Uplift",
      metricValue: "+24% Lift",
      color: "#2563eb",
      internalData: {
        rec1: "Add Garlic Herb Naan (+₹80)",
        rec2: "Combo with Berry Cold Brew (+₹160)",
        status: "AI Neural Core Processing"
      }
    },
    {
      id: "kds-routing",
      num: "03",
      label: "KDS Routing",
      title: "03 — Instant KDS Routing",
      headline: "Sub-50ms Zero-Latency WebSocket Dispatch",
      desc: "Instant order confirmation bypasses waiter bottlenecks and broadcasts via persistent WebSockets directly to designated kitchen lines.",
      icon: Send,
      metricLabel: "Dispatch Latency",
      metricValue: "< 50ms Speed",
      color: "#4f46e5",
      internalData: {
        route1: "Grill Station (Truffle Patty)",
        route2: "Fryer Station (Crispy Fries)",
        route3: "Bar Station (Cold Brew)",
        status: "WebSocket Packet Stream Active"
      }
    },
    {
      id: "multi-kitchen",
      num: "04",
      label: "Kitchen Ops",
      title: "04 — Multi-Station Kitchen",
      headline: "Multi-Station Line Balancing & SLA Timers",
      desc: "Orders automatically split across Grill, Bar, Fryer, and Bakery screens with dynamic SLA urgency timers and visual delay alerts.",
      icon: LayoutGrid,
      metricLabel: "Kitchen Queue Flow",
      metricValue: "100% Paperless",
      color: "#06b6d4",
      internalData: {
        station1: "Grill: Truffle Burger [Cooking • 4m]",
        station2: "Fryer: Loaded Fries [Prep • 2m]",
        station3: "Bar: Cold Brew [Ready ✓]",
        status: "Line Balancing Active"
      }
    },
    {
      id: "ready-payment",
      num: "05",
      label: "Ready & Pay",
      title: "05 — Ready + Payment",
      headline: "1-Tap Plating & Table-Side UPI Settlement",
      desc: "Chefs bump completed stations into unified orders. Diners settle bills instantly via table-side UPI (GPay, PhonePe, Paytm).",
      icon: CreditCard,
      metricLabel: "Table Turn Savings",
      metricValue: "14 Mins Saved",
      color: "#f43f5e",
      internalData: {
        summary: "Order #204 All Stations Plated ✓",
        payment: "UPI Instant Settle: ₹1,145 Received ✓",
        status: "Payment & Plating Synchronized"
      }
    },
    {
      id: "inventory-bi",
      num: "06",
      label: "Stock & BI",
      title: "06 — Inventory + BI",
      headline: "Recipe-Level Stock Depletion & P&L Telemetry",
      desc: "Every completed bill triggers perpetual recipe raw ingredient deductions, automated vendor PO alerts, and real-time gross margin telemetry.",
      icon: BarChart3,
      metricLabel: "Inventory Variance",
      metricValue: "0% Leakage",
      color: "#7c3aed",
      internalData: {
        dep1: "Organic Tomato ↓ 1.2 kg",
        dep2: "Truffle Cheese ↓ 250 g",
        dep3: "Artisan Flour ↓ 500 g",
        status: "Operational Intelligence Updated"
      }
    }
  ];

  // IntersectionObserver to pause heavy rendering when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Continuous autonomous 14-second loop
  useEffect(() => {
    if (!isPlaying || !isVisible) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % stages.length);
    }, 3400);

    return () => clearInterval(timer);
  }, [isPlaying, isVisible, stages.length]);

  // GSAP Smooth banner entrance on stage switch
  useEffect(() => {
    if (bannerRef.current) {
      gsap.fromTo(
        bannerRef.current,
        { opacity: 0.7, y: 10, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" }
      );
    }
  }, [activeStep]);

  // GSAP ScrollTrigger entrance for section elements
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 35 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
      // Timeline scrubber
      if (scrubberRef.current) {
        gsap.fromTo(
          scrubberRef.current,
          { opacity: 0, y: 25 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: {
              trigger: scrubberRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
      // Stage cards stagger
      if (stageGridRef.current) {
        gsap.fromTo(
          stageGridRef.current.children,
          { opacity: 0, y: 30, scale: 0.96 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power2.out",
            scrollTrigger: {
              trigger: stageGridRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const activeStage = stages[activeStep];
  const progressPercent = ((activeStep + 1) / stages.length) * 100;

  return (
    <section ref={sectionRef} className={styles.workflowSection}>
      {/* Background Ambient Glowing Cones */}
      <div className={styles.ambientGlowTop} />
      <div className={styles.ambientGlowBottom} />

      {/* Floating Dark Particles */}
      {DARK_PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `rgba(96, 165, 250, ${p.opacity})`,
            animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: "none",
            zIndex: 1
          }}
        />
      ))}

      <div className="container">

        {/* ── Section Header ── */}
        <div ref={headerRef} className={styles.header}>
          <div className={styles.brandBadge}>
            <span className={styles.pulseDot} />
            <span>SERVIQ Autonomous Operating System • Continuous Live Flow</span>
          </div>

          <h2 className={styles.title}>
            The Autonomous Engine Powering <br />
            <span className="gradient-text">
              Every Order from Table to Telemetry
            </span>
          </h2>

          <p className={styles.subtitle}>
            Watch a live order travel from guest table scan through AI upselling, multi-station kitchen coordination, UPI settlement, and automated stock intelligence in under 15 seconds.
          </p>
        </div>

        {/* ── 3D WebGL Three.js Holographic Ecosystem ── */}
        {/* <div className={styles.threeContainer}>
          <Three3DRestaurantEcosystem activeStage={activeStep} />
        </div> */}

        {/* ── Horizontal Interactive Timeline Scrubber ── */}
        <div ref={scrubberRef} className={styles.scrubberWrapper}>
          <div className={styles.scrubberTopRow}>
            <div className={styles.scrubberLegend}>
              <Repeat style={{ width: 14, height: 14, color: "#60a5fa" }} />
              <span>SERVIQ Order Lifecycle Progress:</span>
              <span style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                Step {activeStep + 1} of 6
              </span>
            </div>

            <div className={styles.scrubberControls}>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={styles.controlBtn}
                title="Toggle Autonomous Flow Loop"
              >
                {isPlaying ? <Pause style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
                <span>{isPlaying ? "Auto Flow: Running" : "Auto Flow: Paused"}</span>
              </button>
            </div>
          </div>

          {/* Connected Timeline Track */}
          <div className={styles.timelineTrack}>
            <div className={styles.timelineProgressBar}>
              <div
                className={styles.timelineProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {stages.map((stg, idx) => {
              const isCurrent = activeStep === idx;
              const isPast = activeStep > idx;

              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => {
                    setActiveStep(idx);
                    setIsPlaying(false);
                  }}
                  className={styles.timelineStepNode}
                >
                  <div
                    className={`${styles.nodeCircle} ${isCurrent
                      ? styles.nodeCircleActive
                      : isPast
                        ? styles.nodeCircleCompleted
                        : ""
                      }`}
                  >
                    {isPast ? <Check style={{ width: 12, height: 12 }} /> : stg.num}
                  </div>
                  <span
                    className={`${styles.nodeLabel} ${isCurrent ? styles.nodeLabelActive : ""
                      }`}
                  >
                    {stg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Stage Master Highlight Showcase Banner ── */}
        <div ref={bannerRef} className={styles.activeShowcaseBanner}>
          <div className={styles.bannerLeftGroup}>
            <div
              className={styles.bannerIconBox}
              style={{
                borderColor: activeStage.color,
                color: activeStage.color,
                boxShadow: `0 0 25px ${activeStage.color}40`
              }}
            >
              {React.createElement(activeStage.icon, { style: { width: 32, height: 32 } })}
            </div>

            <div>
              <div className={styles.bannerStageTag} style={{ color: activeStage.color }}>
                {activeStage.title}
              </div>
              <h3 className={styles.bannerHeading}>
                {activeStage.headline}
              </h3>
              <p className={styles.bannerText}>
                {activeStage.desc}
              </p>
            </div>
          </div>

          <div className={styles.bannerRightMetric}>
            <div className={styles.bannerMetricLabel}>
              {activeStage.metricLabel}
            </div>
            <div className={styles.bannerMetricValue} style={{ color: activeStage.color }}>
              {activeStage.metricValue}
            </div>
          </div>
        </div>

        {/* ── 6-Card Interactive Stage Grid ── */}
        <div ref={stageGridRef} className={styles.stageGrid}>
          {stages.map((stg, idx) => {
            const Icon = stg.icon;
            const isSelected = activeStep === idx;

            return (
              <div
                key={stg.id}
                onClick={() => {
                  setActiveStep(idx);
                  setIsPlaying(false);
                }}
                className={`${styles.stageCard} ${isSelected ? styles.stageCardActive : ""}`}
              >
                {isSelected && (
                  <div
                    className={styles.cardAccentLine}
                    style={{ background: `linear-gradient(90deg, ${stg.color}, #60a5fa)` }}
                  />
                )}

                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIconBox} style={{ color: stg.color, borderColor: isSelected ? stg.color : undefined }}>
                      <Icon style={{ width: 18, height: 18 }} />
                    </div>
                    <span className={styles.cardNumber} style={{ color: isSelected ? stg.color : undefined }}>
                      {stg.num}
                    </span>
                  </div>

                  <h4 className={styles.cardTitle}>{stg.title}</h4>
                  <p className={styles.cardDesc}>{stg.desc}</p>
                </div>

                {/* Internal Stage Simulator Widget */}
                <div>
                  {idx === 0 && (
                    <div className={styles.internalWidget}>
                      <div className={styles.menuPill}>
                        <span>{stg.internalData.item1}</span>
                        <span style={{ color: "#38bdf8" }}>{stg.internalData.price1}</span>
                      </div>
                      <div className={styles.menuPill}>
                        <span>{stg.internalData.item2}</span>
                        <span style={{ color: "#38bdf8" }}>{stg.internalData.price2}</span>
                      </div>
                    </div>
                  )}

                  {idx === 1 && (
                    <div className={styles.internalWidget}>
                      <div style={{ color: "#93c5fd", fontWeight: 700 }}>AI Suggestions:</div>
                      <div className={styles.aiPill}>{stg.internalData.rec1}</div>
                      <div className={styles.aiPill}>{stg.internalData.rec2}</div>
                    </div>
                  )}

                  {idx === 2 && (
                    <div className={styles.internalWidget}>
                      <div style={{ color: "#cbd5e1", fontSize: 10 }}>Stream Dispatching:</div>
                      <div style={{ color: "#a5b4fc", fontWeight: 700, marginTop: 2 }}>{stg.internalData.route1}</div>
                      <div style={{ color: "#a5b4fc", fontWeight: 700 }}>{stg.internalData.route2}</div>
                    </div>
                  )}

                  {idx === 3 && (
                    <div className={styles.internalWidget}>
                      <div className={styles.stationRow}>
                        <span className={styles.stationChip}>Grill: 4m SLA</span>
                        <span className={styles.stationChip}>Fryer: 2m SLA</span>
                        <span className={styles.stationChip} style={{ color: "#34d399" }}>Bar: Ready ✓</span>
                        <span className={styles.stationChip}>Expo: Sync</span>
                      </div>
                    </div>
                  )}

                  {idx === 4 && (
                    <div className={styles.internalWidget}>
                      <div style={{ color: "#34d399", fontWeight: 800 }}>{stg.internalData.summary}</div>
                      <div style={{ color: "#fca5a5", fontSize: 10, marginTop: 2 }}>{stg.internalData.payment}</div>
                    </div>
                  )}

                  {idx === 5 && (
                    <div className={styles.internalWidget}>
                      <div className={styles.depletionItem}>
                        <span>{stg.internalData.dep1}</span>
                        <span style={{ color: "#c084fc", fontWeight: 800 }}>Depleted</span>
                      </div>
                      <div className={styles.depletionItem}>
                        <span>{stg.internalData.dep2}</span>
                        <span style={{ color: "#c084fc", fontWeight: 800 }}>Depleted</span>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom Footer */}
                  <div className={styles.cardFooter}>
                    <span>{stg.metricValue}</span>
                    <span style={{ fontSize: 10, textTransform: "uppercase", color: isSelected ? stg.color : "#64748b" }}>
                      {isSelected ? "● Live Stage" : "Tap to Inspect"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

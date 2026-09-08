import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  BookOpen,
  Grid,
  ListOrdered,
  BarChart3,
  Boxes,
  HeartHandshake,
  Banknote,
  Building,
  Layers,
  CheckCircle2,
  Utensils,
  ChefHat,
  TrendingUp,
  Cpu
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function EcosystemSection() {
  const [activeCategory, setActiveCategory] = useState("foh");
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const cardsGridRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
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

      // Tab switcher entrance
      if (tabsRef.current) {
        gsap.fromTo(
          tabsRef.current.children,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: tabsRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate cards whenever activeCategory changes
  useEffect(() => {
    if (cardsGridRef.current) {
      gsap.fromTo(
        cardsGridRef.current.children,
        { opacity: 0, y: 30, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out"
        }
      );
    }
  }, [activeCategory]);

  const pillars = {
    foh: {
      id: "foh",
      title: "Front-of-House & Guest Velocity",
      badge: "Dine-In Operations",
      icon: Utensils,
      color: "var(--color-primary)",
      modules: [
        {
          name: "Point of Sale (POS)",
          tagline: "Ultra-Fast Table & Counter Billing",
          desc: "Touchscreen terminal with split bills, visual table maps, and 1-click cash drawer sync in ₹.",
          icon: CreditCard,
          features: ["Table & Seat Splitting", "Staff PIN Access", "EDC & Thermal Sync"]
        },
        {
          name: "Dynamic Visual QR Menus",
          tagline: "Instant Catalog Control",
          desc: "Update prices, add seasonal dishes, and manage dietary badges across all dining tables live.",
          icon: BookOpen,
          features: ["1-Tap 86 Item Out-of-Stock", "Scheduled Dayparts", "Allergen & Veg Filters"]
        },
        {
          name: "Table Floorplan Engine",
          tagline: "Live Seating & Section Map",
          desc: "Keep hosts and servers in sync with live table occupancy, seated duration timers, and balanced sections.",
          icon: Grid,
          features: ["Visual Floorplan Map", "Seated Duration Timers", "Section Staff Assignment"]
        },
        {
          name: "Direct UPI & Split Payments",
          tagline: "Instant Mobile Checkout",
          desc: "Guests settle smoothly via UPI, Cards, or digital tabs without waving down servers.",
          icon: Banknote,
          features: ["PhonePe, GPay, Paytm Sync", "Automatic GST Breakdown", "Instant WhatsApp Receipts"]
        }
      ]
    },
    boh: {
      id: "boh",
      title: "Back-of-House & Production Operations",
      badge: "Kitchen Control",
      icon: ChefHat,
      color: "var(--color-indigo)",
      modules: [
        {
          name: "Multi-Station KDS Screens",
          tagline: "Paperless Kitchen Pipeline",
          desc: "Dishes route instantly to Grill, Bar, Fryer, and Expo lines with live color-coded SLA timers.",
          icon: ListOrdered,
          features: ["Multi-Station Splitting", "Prep Time Countdown", "Expo Quality Control"]
        },
        {
          name: "Recipe-Level Stock Depletion",
          tagline: "Zero-Variance Raw Material",
          desc: "Ingredients deplete automatically with every placed order, preventing surprise mid-shift shortages.",
          icon: Boxes,
          features: ["Real-Time Unit Depletion", "Low-Stock Alerts", "Automated Vendor POs"]
        },
        {
          name: "Aggregator Order Consolidation",
          tagline: "Unified Delivery Bridge",
          desc: "Accept Zomato and Swiggy deliveries in one unified kitchen screen without managing 5 separate tablets.",
          icon: Building,
          features: ["Single Screen Inbox", "Menu Sync Across Aggregators", "Rider Handover Queue"]
        },
        {
          name: "Prep Pacing & Course Firing",
          tagline: "Coordinated Table Service",
          desc: "Fire appetizers, mains, and desserts with timed delays for synchronized banquet and table pacing.",
          icon: Utensils,
          features: ["Timed Course Delays", "Hold & Fire Controls", "Expo Plating Verification"]
        }
      ]
    },
    growth: {
      id: "growth",
      title: "Autonomous Intelligence & Retention",
      badge: "Revenue Growth",
      icon: TrendingUp,
      color: "var(--color-violet)",
      modules: [
        {
          name: "Executive BI & P&L Telemetry",
          tagline: "Real-Time Profit Control Room",
          desc: "Live visibility into gross sales, food cost percentages, bestsellers, and peak-hour labor output.",
          icon: BarChart3,
          features: ["Live Hourly Volume", "Menu Engineering Matrix", "Food Cost Margin Tracker"]
        },
        {
          name: "WhatsApp Guest Retention & CRM",
          tagline: "Automated Visit Frequency",
          desc: "Capture guest contacts effortlessly through QR checks and re-engage with tailored WhatsApp offers.",
          icon: HeartHandshake,
          features: ["Guest Visit History", "Automated Birthday Perks", "Win-Back Campaign Triggers"]
        },
        {
          name: "Predictive AI Demand Engine",
          tagline: "Weather & Trend Forecasting",
          desc: "Forecast weekend prep quantities based on historical dining trends, local events, and weather forecasts.",
          icon: Cpu,
          features: ["Prep Sheet Recommendations", "Dynamic Dish Upsells", "Deadstock Clearance Alerts"]
        },
        {
          name: "Franchise Governance OS",
          tagline: "Multi-Outlet Centralized Hub",
          desc: "Govern 10 to 500+ locations with 1-click global menu updates and automated franchise royalty audits.",
          icon: Building,
          features: ["Central Menu Sync", "Franchise Royalty Ledgers", "Role-Based Permissions"]
        }
      ]
    }
  };

  const currentPillar = pillars[activeCategory];

  return (
    <section ref={sectionRef} style={{ padding: "100px 0", background: "#ffffff", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container">
        
        {/* Section Header */}
        <div ref={headerRef} style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 50px auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="badge-pill badge-blue">
            <Layers style={{ width: 14, height: 14 }} />
            <span>Unified Product Ecosystem</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
            A Complete Suite Designed to <span className="gradient-text">Grow with Your Restaurant</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
            Whether you run a single busy cafe or a 50-location franchise, activate modules on demand.
          </p>
        </div>

        {/* 3 Pillar Tab Switcher */}
        <div ref={tabsRef} style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
          {Object.values(pillars).map((pillar) => {
            const Icon = pillar.icon;
            const isActive = activeCategory === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => setActiveCategory(pillar.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: "var(--radius-lg)",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: `1.5px solid ${isActive ? "var(--color-primary)" : "var(--border-subtle)"}`,
                  background: isActive ? "var(--color-primary)" : "var(--bg-card-subtle)",
                  color: isActive ? "#ffffff" : "var(--text-main)",
                  boxShadow: isActive ? "0 8px 24px rgba(37,99,235,0.25)" : "none",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                  transition: "all 0.25s ease"
                }}
              >
                <Icon style={{ width: 16, height: 16 }} />
                <span>{pillar.title}</span>
              </button>
            );
          })}
        </div>

        {/* 4 Module Cards Grid */}
        <div ref={cardsGridRef} className="grid-2">
          {currentPillar.modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="card-luxury"
                style={{
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 18,
                  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 18px 40px -10px rgba(37,99,235,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 20, height: 20 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-light)", textTransform: "uppercase" }}>
                      {mod.tagline}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-main)", margin: "0 0 6px 0" }}>
                    {mod.name}
                  </h3>

                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    {mod.desc}
                  </p>
                </div>

                <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--text-light)", marginBottom: 8 }}>
                    Capabilities
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>
                    {mod.features.map((feat, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: "var(--color-emerald)", flexShrink: 0 }} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{feat}</span>
                      </div>
                    ))}
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

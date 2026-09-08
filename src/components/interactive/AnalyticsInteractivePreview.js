import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Clock,
  Flame,
  ArrowUpRight,
  BarChart3,
  Sparkles
} from "lucide-react";
import { gsap } from "gsap";
import styles from "../../styles/AnalyticsPreview.module.css";

const ANALYTICS_DATA = {
  today: {
    revenue: "₹48,920",
    revenueGrowth: "+21.4%",
    orders: "148",
    ordersGrowth: "+18.2%",
    aov: "₹685",
    aovGrowth: "+4.6%",
    tableTurns: "3.4 turns/day",
    avgPrepTime: "7.8 mins",
    topItems: [
      { name: "Dry-Aged Angus Truffle Burger", count: 46, rev: "₹17,710", pct: 88 },
      { name: "Cedar Smoked Signature Blend", count: 38, rev: "₹13,300", pct: 72 },
      { name: "Woodfired Artisan Margherita", count: 31, rev: "₹9,920", pct: 58 },
      { name: "Salt & Pepper Crispy Calamari", count: 28, rev: "₹7,840", pct: 52 }
    ],
    hourlyBars: [
      { hour: "11h", orders: 12, pct: 20 },
      { hour: "12h", orders: 38, pct: 55 },
      { hour: "13h", orders: 68, pct: 90 },
      { hour: "14h", orders: 55, pct: 75 },
      { hour: "15h", orders: 20, pct: 30 },
      { hour: "16h", orders: 15, pct: 22 },
      { hour: "17h", orders: 28, pct: 40 },
      { hour: "18h", orders: 48, pct: 65 },
      { hour: "19h", orders: 78, pct: 95 },
      { hour: "20h", orders: 82, pct: 100 },
      { hour: "21h", orders: 52, pct: 70 },
      { hour: "22h", orders: 25, pct: 35 }
    ]
  },
  "7d": {
    revenue: "₹3,42,500",
    revenueGrowth: "+26.8%",
    orders: "1,040",
    ordersGrowth: "+22.5%",
    aov: "₹680",
    aovGrowth: "+5.1%",
    tableTurns: "3.6 turns/day",
    avgPrepTime: "7.5 mins",
    topItems: [
      { name: "Dry-Aged Angus Truffle Burger", count: 320, rev: "₹1,23,200", pct: 92 },
      { name: "Woodfired Artisan Margherita", count: 240, rev: "₹76,800", pct: 78 },
      { name: "Cedar Smoked Signature Blend", count: 285, rev: "₹99,750", pct: 74 },
      { name: "Salt & Pepper Crispy Calamari", count: 195, rev: "₹54,600", pct: 60 }
    ],
    hourlyBars: [
      { hour: "11h", orders: 75, pct: 35 },
      { hour: "12h", orders: 140, pct: 65 },
      { hour: "13h", orders: 210, pct: 92 },
      { hour: "14h", orders: 165, pct: 78 },
      { hour: "15h", orders: 85, pct: 40 },
      { hour: "16h", orders: 70, pct: 32 },
      { hour: "17h", orders: 110, pct: 50 },
      { hour: "18h", orders: 180, pct: 75 },
      { hour: "19h", orders: 240, pct: 98 },
      { hour: "20h", orders: 250, pct: 100 },
      { hour: "21h", orders: 175, pct: 75 },
      { hour: "22h", orders: 90, pct: 42 }
    ]
  },
  "30d": {
    revenue: "₹14,86,000",
    revenueGrowth: "+31.2%",
    orders: "4,520",
    ordersGrowth: "+27.9%",
    aov: "₹678",
    aovGrowth: "+6.0%",
    tableTurns: "3.7 turns/day",
    avgPrepTime: "7.2 mins",
    topItems: [
      { name: "Dry-Aged Angus Truffle Burger", count: 1420, rev: "₹5,46,700", pct: 95 },
      { name: "Woodfired Artisan Margherita", count: 1050, rev: "₹3,36,000", pct: 82 },
      { name: "Cedar Smoked Signature Blend", count: 1180, rev: "₹4,13,000", pct: 78 },
      { name: "Salt & Pepper Crispy Calamari", count: 850, rev: "₹2,38,000", pct: 64 }
    ],
    hourlyBars: [
      { hour: "11h", orders: 280, pct: 35 },
      { hour: "12h", orders: 580, pct: 68 },
      { hour: "13h", orders: 880, pct: 95 },
      { hour: "14h", orders: 690, pct: 78 },
      { hour: "15h", orders: 340, pct: 40 },
      { hour: "16h", orders: 290, pct: 32 },
      { hour: "17h", orders: 480, pct: 54 },
      { hour: "18h", orders: 780, pct: 82 },
      { hour: "19h", orders: 940, pct: 98 },
      { hour: "20h", orders: 980, pct: 100 },
      { hour: "21h", orders: 720, pct: 76 },
      { hour: "22h", orders: 380, pct: 44 }
    ]
  }
};

export default function AnalyticsInteractivePreview() {
  const [period, setPeriod] = useState("30d");
  const barsRef = useRef(null);
  const progressBarsRef = useRef([]);
  const kpiRef = useRef(null);

  const current = ANALYTICS_DATA[period];

  // Animate bars whenever period changes
  useEffect(() => {
    if (barsRef.current) {
      const barEls = barsRef.current.querySelectorAll("[data-bar]");
      barEls.forEach((el, idx) => {
        const targetPct = current.hourlyBars[idx]?.pct ?? 0;
        gsap.fromTo(
          el,
          { height: "0%" },
          {
            height: `${targetPct}%`,
            duration: 0.6,
            delay: idx * 0.04,
            ease: "power2.out"
          }
        );
      });
    }

    // Animate KPI cards
    if (kpiRef.current) {
      gsap.fromTo(
        kpiRef.current.children,
        { opacity: 0, y: 12, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out"
        }
      );
    }

    // Animate progress bars
    progressBarsRef.current.forEach((el, idx) => {
      if (!el) return;
      const targetPct = current.topItems[idx]?.pct ?? 0;
      gsap.fromTo(
        el,
        { width: "0%" },
        { width: `${targetPct}%`, duration: 0.7, delay: 0.1 + idx * 0.1, ease: "power2.out" }
      );
    });
  }, [period, current]);

  return (
    <div className={styles.container}>
      {/* Header with period toggle */}
      <div className={styles.header}>
        <div>
          <div className={styles.liveTag}>
            <span>Live Operations & Telemetry</span>
            <span className={styles.liveDot} />
          </div>
          <h4 className={styles.headerTitle}>
            Restaurant Sales & Speed Reporting
          </h4>
        </div>

        <div className={styles.periodToggle}>
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "Past 7 Days" },
            { id: "30d", label: "Past 30 Days" }
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setPeriod(t.id)}
              className={`${styles.periodBtn} ${period === t.id ? styles.periodBtnActive : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid — animated on period change */}
      <div ref={kpiRef} className={styles.kpiGrid}>
        {/* Metric 1 */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Net Revenue</span>
          <div className={styles.kpiValue}>{current.revenue}</div>
          <div className={styles.kpiLift}>
            <ArrowUpRight style={{ width: 14, height: 14 }} />
            <span>{current.revenueGrowth} vs prior</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Orders Served</span>
          <div className={styles.kpiValue}>{current.orders}</div>
          <div className={styles.kpiLift}>
            <ArrowUpRight style={{ width: 14, height: 14 }} />
            <span>{current.ordersGrowth} vs prior</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Average Check Size</span>
          <div className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>{current.aov}</div>
          <div className={styles.kpiLift}>
            <TrendingUp style={{ width: 14, height: 14 }} />
            <span>{current.aovGrowth} modifier lift</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Avg Kitchen Ticket Time</span>
          <div className={styles.kpiValue} style={{ color: "var(--color-emerald)" }}>{current.avgPrepTime}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-subtle)", fontWeight: 600 }}>
            <Clock style={{ width: 13, height: 13, color: "var(--color-emerald)" }} />
            <span>Speed target: &lt; 10m</span>
          </div>
        </div>
      </div>

      {/* Split Graph & Top Dishes */}
      <div className={styles.splitGrid}>
        {/* Hourly Order Velocity Chart with animated bars */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>
              <BarChart3 style={{ width: 16, height: 16, color: "var(--color-primary)" }} /> Hourly Dining Velocity
            </span>
            <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 600 }}>Peak rush: 1:00 PM & 8:00 PM</span>
          </div>

          <div ref={barsRef} className={styles.chartBarsContainer}>
            {current.hourlyBars.map((bar, idx) => {
              const isPeak = bar.pct > 80;
              return (
                <div key={`${period}-${idx}`} className={styles.barCol} title={`${bar.hour}: ${bar.orders} orders`}>
                  <div
                    data-bar
                    style={{ height: `${bar.pct}%` }}
                    className={`${styles.barPill} ${isPeak ? styles.barPillPeak : ""}`}
                  />
                  <span className={styles.barHour}>{bar.hour}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, paddingTop: 4 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--color-primary)" }} />
              <span>Dinner & Lunch Rushes</span>
            </span>
            <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>QR Ordering handled 84% volume</span>
          </div>
        </div>

        {/* Top Grossing Items Leaderboard with animated progress bars */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>
              <Flame style={{ width: 16, height: 16, color: "var(--color-primary)" }} /> Top Selling Dishes
            </span>
            <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 600 }}>By Gross Sales</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 6 }}>
            {current.topItems.map((item, idx) => (
              <div key={`${period}-dish-${idx}`} className={styles.topDishItem}>
                <div className={styles.dishInfo}>
                  <span className={styles.dishName}>
                    {idx + 1}. {item.name}
                  </span>
                  <span className={styles.dishRev}>
                    {item.rev}
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    ref={(el) => { progressBarsRef.current[idx] = el; }}
                    style={{ width: `${item.pct}%` }}
                    className={styles.progressBarFill}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

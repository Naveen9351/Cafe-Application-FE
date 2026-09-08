import React, { useState } from "react";
import {
  TrendingUp,
  Coins,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function ROICalculator({ onOpenDemoModal }) {
  const [tables, setTables] = useState(20);
  const [checkSize, setCheckSize] = useState(750);
  const [turns, setTurns] = useState(2.5);

  // Calculations
  const baselineMonthly = tables * turns * checkSize * 30;
  const improvedTurns = turns * 1.28;
  const improvedCheckSize = checkSize * 1.16;
  const newMonthlyRevenue = tables * improvedTurns * improvedCheckSize * 30;

  const extraMonthlyRevenue = Math.round(newMonthlyRevenue - baselineMonthly);
  const hoursSavedPerMonth = Math.round((tables * turns * 30 * 12) / 60);

  return (
    <div className="card-luxury" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="badge-pill badge-blue" style={{ marginBottom: 6 }}>
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>Interactive Financial ROI Engine</span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-main)", margin: 0 }}>
            Calculate Your Restaurant Profit Lift
          </h3>
        </div>

        <span className="badge-pill badge-emerald" style={{ fontSize: 11 }}>
          Estimated 12.8x Avg ROI
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
        {/* Left: 3 Interactive Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Slider 1: Tables */}
          <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--bg-card-subtle)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              <span>Dining Tables</span>
              <span style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{tables} Tables</span>
            </div>
            <input
              type="range"
              min="4"
              max="80"
              step="1"
              value={tables}
              onChange={(e) => setTables(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer" }}
            />
          </div>

          {/* Slider 2: Average Check Size */}
          <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--bg-card-subtle)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              <span>Average Order Value (AOV in ₹)</span>
              <span style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>₹{checkSize}</span>
            </div>
            <input
              type="range"
              min="150"
              max="3000"
              step="50"
              value={checkSize}
              onChange={(e) => setCheckSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer" }}
            />
          </div>

          {/* Slider 3: Table Turns */}
          <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--bg-card-subtle)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              <span>Table Turns / Day</span>
              <span style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{turns} Turns</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={turns}
              onChange={(e) => setTurns(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Right: Output Telemetry Metrics Box */}
        <div
          style={{
            padding: 28,
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
            border: "1.5px solid var(--color-primary-border)",
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-light)" }}>
              Estimated Monthly Profit Lift
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 900, color: "var(--color-primary)", margin: "4px 0" }}>
              +₹{extraMonthlyRevenue.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              via +24% upsells & faster table turns
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 16, borderTop: "1px solid var(--color-primary-border)" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Kitchen Hours Saved</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--color-indigo)", fontFamily: "var(--font-mono)" }}>
                {hoursSavedPerMonth} hrs/mo
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Turnaround Velocity</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--color-emerald)", fontFamily: "var(--font-mono)" }}>
                +28% Faster
              </div>
            </div>
          </div>

          {onOpenDemoModal && (
            <button
              type="button"
              onClick={onOpenDemoModal}
              className="btn-electric"
              style={{ width: "100%", padding: 12, fontSize: 12, marginTop: 6 }}
            >
              <span>Verify ROI with Live Outlets</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

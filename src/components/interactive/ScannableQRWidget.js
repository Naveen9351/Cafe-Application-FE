import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Camera
} from "lucide-react";

export default function ScannableQRWidget() {
  const [demoUrl, setDemoUrl] = useState("http://localhost:3001/menu");
  const [qrCodeSrc, setQrCodeSrc] = useState(
    "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=https://serviq.com/menu&color=0f172a&bgcolor=ffffff&margin=1"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/menu`;
      setDemoUrl(url);
      setQrCodeSrc(
        `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
          url
        )}&color=0f172a&bgcolor=ffffff&margin=1`
      );
    }
  }, []);

  return (
    <div className="card-luxury" style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 24, alignItems: "center" }}>
        {/* Left Side: Value & Guidance */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="badge-pill badge-blue" style={{ alignSelf: "flex-start" }}>
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Live Interactive Mobile Experience</span>
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", margin: 0, lineHeight: 1.2 }}>
            Test the Guest QR Menu on Your Own Smartphone Right Now
          </h3>

          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Open your smartphone camera, point it at the QR code on the right, and experience the visual menu, modifiers, and 1-tap table checkout live in your hand.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--text-main)", fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: "var(--color-emerald)" }} />
              <span>Zero app download required (native Safari & Chrome)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: "var(--color-emerald)" }} />
              <span>Photo-rich dish menu in Indian Rupees (₹) with modifiers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: "var(--color-primary)" }} />
              <span>Table #14 automatically synced to active kitchen lines</span>
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <Link
              to="/menu"
              target="_blank"
              className="btn-white"
              style={{ fontSize: 12, padding: "8px 16px" }}
            >
              <span>Open Mobile Web Menu Directly</span>
              <ExternalLink style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>

        {/* Right Side: High-Definition Scannable QR Card */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 180,
              padding: 16,
              borderRadius: "var(--radius-xl)",
              background: "#ffffff",
              textAlign: "center",
              boxShadow: "var(--shadow-xl)",
              border: "2px solid var(--color-primary-border)"
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.08em", color: "var(--color-primary)", textTransform: "uppercase" }}>
              SERVIQ DINING
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-main)", margin: "2px 0 8px 0" }}>
              TABLE #14
            </div>

            <div style={{ width: 130, height: 130, margin: "0 auto", padding: 6, borderRadius: 12, border: "1px solid var(--border-subtle)", background: "#ffffff" }}>
              <img
                src={qrCodeSrc}
                alt="Scan to test live SERVIQ guest menu"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--text-main)" }}>
                <Camera style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
                <span>Scan with Phone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

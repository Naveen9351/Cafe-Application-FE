import React from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  LayoutGrid,
  Phone,
  Mail,
  MapPin,
  Sparkles
} from "lucide-react";
import ServiqLogo from "../brand/ServiqLogo";

export default function Footer({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;

  return (
    <footer style={{ background: "#0f172a", color: "#94a3b8", paddingTop: 80, paddingBottom: 40, borderTop: "1px solid #1e293b" }}>
      <div className="container">
        
        {/* Top 4-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40, marginBottom: 60 }}>
          
          {/* Col 1: Brand & Mission */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <ServiqLogo size="lg" theme="dark" />
            </Link>

            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, maxWidth: 360, margin: 0 }}>
              SERVIQ is the autonomous AI-powered restaurant operating system uniting guest QR Table Ordering, real-time Kitchen Display Systems (KDS), POS billing, live recipe inventory, and predictive telemetry into one connected console.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: "#cbd5e1", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
                <span>support@serviq.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone style={{ width: 14, height: 14, color: "var(--color-emerald)" }} />
                <span>+91 96801 32562 (Direct Indian WhatsApp Support)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: "var(--color-indigo)" }} />
                <span>Bangalore • Mumbai • Delhi NCR • Cloud Infrastructure</span>
              </div>
            </div>
          </div>

          {/* Col 2: Flagship Products */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffffff", marginBottom: 16 }}>
              Flagship Suite
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Link to="/products" style={{ color: "#94a3b8", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <QrCode style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
                <span>Dynamic QR Table Ordering</span>
              </Link>
              <Link to="/products" style={{ color: "#94a3b8", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <LayoutGrid style={{ width: 14, height: 14, color: "var(--color-indigo)" }} />
                <span>Multi-Station KDS Queue</span>
              </Link>
              <Link to="/features/inventory" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Recipe Inventory Depletion
              </Link>
              <Link to="/features/pos-billing" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Cloud POS Terminal in ₹
              </Link>
              <Link to="/features/crm-loyalty" style={{ color: "#94a3b8", textDecoration: "none" }}>
                WhatsApp CRM & Marketing
              </Link>
              <Link to="/features/ai-copilot" style={{ color: "#94a3b8", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles style={{ width: 14, height: 14, color: "#fde047" }} />
                <span>SERVIQ AI Forecasting</span>
              </Link>
            </div>
          </div>

          {/* Col 3: Outlet Solutions */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffffff", marginBottom: 16 }}>
              Outlet Solutions
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Link to="/solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Specialty Cafes & Bakeries
              </Link>
              <Link to="/solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>
                QSR & Fast Food Counters
              </Link>
              <Link to="/solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Full Service & Fine Dining
              </Link>
              <Link to="/solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Cloud Kitchen Hubs & Brands
              </Link>
              <Link to="/solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Multi-Outlet Chains & Franchises
              </Link>
            </div>
          </div>

          {/* Col 4: Platform & Support */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffffff", marginBottom: 16 }}>
              Resources & Access
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Link to="/pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Pricing Plans in ₹
              </Link>
              <Link to="/menu" style={{ color: "var(--color-emerald)", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <QrCode style={{ width: 14, height: 14 }} />
                <span>Live Customer QR Menu</span>
              </Link>
              <Link to="/about" style={{ color: "#94a3b8", textDecoration: "none" }}>
                About SERVIQ
              </Link>
              <Link to="/contact" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Contact Support
              </Link>
              <Link to="/careers" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Careers
              </Link>
              <Link to="/login" style={{ color: "#94a3b8", textDecoration: "none" }}>
                Staff / Admin Login
              </Link>
              <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 800, textDecoration: "none" }}>
                Register Restaurant
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div style={{ paddingTop: 28, borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#64748b" }}>
          <div>
            © {new Date().getFullYear()} SERVIQ Technologies India Pvt. Ltd. All rights reserved.
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/press-kit" style={{ color: "#64748b", textDecoration: "none" }}>Press Kit</Link>
            <Link to="/contact" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</Link>
            <Link to="/contact" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

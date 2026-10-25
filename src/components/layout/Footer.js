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
import { getBillingPortalUrl } from "../../utils/subdomain";
import styles from "../../styles/Footer.module.css";

export default function Footer({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;

  return (
    <footer className={styles.footer}>
      <div className="container">
        
        {/* Top Responsive Column Grid */}
        <div className={styles.footerGrid}>
          
          {/* Col 1: Brand & Mission */}
          <div className={styles.brandCol}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <ServiqLogo size="lg" theme="dark" />
            </Link>

            <p className={styles.brandText}>
              DINEVIQ is the autonomous AI-powered restaurant operating system uniting guest QR Table Ordering, real-time Kitchen Display Systems (KDS), POS billing, live recipe inventory, and predictive telemetry into one connected console.
            </p>

            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <Mail style={{ width: 14, height: 14, color: "var(--color-primary)", flexShrink: 0 }} />
                <span>support@dineviq.com</span>
              </div>
              <div className={styles.contactItem}>
                <Phone style={{ width: 14, height: 14, color: "var(--color-emerald)", flexShrink: 0 }} />
                <span>+91 96801 32562 (Direct Indian WhatsApp Support)</span>
              </div>
              <div className={styles.contactItem}>
                <MapPin style={{ width: 14, height: 14, color: "var(--color-primary)", flexShrink: 0 }} />
                <span>Bangalore • Mumbai • Delhi NCR • Cloud Infrastructure</span>
              </div>
            </div>
          </div>

          {/* Col 2: Flagship Products */}
          <div>
            <h4 className={styles.colTitle}>
              Flagship Suite
            </h4>
            <div className={styles.linkList}>
              <Link to="/products" className={styles.footerLink}>
                <QrCode style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
                <span>Dynamic QR Table Ordering</span>
              </Link>
              <Link to="/products" className={styles.footerLink}>
                <LayoutGrid style={{ width: 14, height: 14, color: "var(--color-primary)" }} />
                <span>Multi-Station KDS Queue</span>
              </Link>
              <Link to="/features/inventory" className={styles.footerLink}>
                Recipe Inventory Depletion
              </Link>
              <Link to="/features/pos-billing" className={styles.footerLink}>
                Cloud POS Terminal in ₹
              </Link>
              <Link to="/features/crm-loyalty" className={styles.footerLink}>
                WhatsApp CRM & Marketing
              </Link>
              <Link to="/features/ai-copilot" className={styles.footerLink}>
                <Sparkles style={{ width: 14, height: 14, color: "#fde047" }} />
                <span>DINEVIQ AI Forecasting</span>
              </Link>
            </div>
          </div>

          {/* Col 3: Outlet Solutions */}
          <div>
            <h4 className={styles.colTitle}>
              Outlet Solutions
            </h4>
            <div className={styles.linkList}>
              <Link to="/solutions" className={styles.footerLink}>
                Specialty Cafes & Bakeries
              </Link>
              <Link to="/solutions" className={styles.footerLink}>
                QSR & Fast Food Counters
              </Link>
              <Link to="/solutions" className={styles.footerLink}>
                Full Service & Fine Dining
              </Link>
              <Link to="/solutions" className={styles.footerLink}>
                Cloud Kitchen Hubs & Brands
              </Link>
              <Link to="/solutions" className={styles.footerLink}>
                Multi-Outlet Chains & Franchises
              </Link>
            </div>
          </div>

          {/* Col 4: Platform & Support */}
          <div>
            <h4 className={styles.colTitle}>
              Resources & Access
            </h4>
            <div className={styles.linkList}>
              <Link to="/pricing" className={styles.footerLink}>
                Pricing Plans in ₹
              </Link>
              <Link to="/menu" className={styles.footerLink} style={{ color: "var(--color-emerald)", fontWeight: 800 }}>
                <QrCode style={{ width: 14, height: 14 }} />
                <span>Live Customer QR Menu</span>
              </Link>
              <Link to="/about" className={styles.footerLink}>
                About DINEVIQ
              </Link>
              <Link to="/contact" className={styles.footerLink}>
                Contact Support
              </Link>
              <Link to="/careers" className={styles.footerLink}>
                Careers
              </Link>
              <a href={getBillingPortalUrl()} className={styles.footerLink} title="DineviQ Restaurant & Cafe Login Portal">
                Restaurant & Cafe Login
              </a>
              <Link to="/register" className={styles.footerLink} style={{ color: "var(--color-primary)", fontWeight: 800 }}>
                Register Restaurant
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className={styles.footerBottom}>
          <div>
            © {new Date().getFullYear()} DINEVIQ Technologies India Pvt. Ltd. All rights reserved.
          </div>

          <div className={styles.bottomLinks}>
            <Link to="/press-kit" style={{ color: "#64748b", textDecoration: "none" }}>Press Kit</Link>
            <Link to="/contact" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</Link>
            <Link to="/contact" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

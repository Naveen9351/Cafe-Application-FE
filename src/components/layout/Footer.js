import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  ShieldCheck
} from "lucide-react";
import ServiqLogo from "../brand/ServiqLogo";
import styles from "../../styles/Footer.module.css";

export default function Footer({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;

  return (
    <footer className={styles.footer}>
      <div className="container">
        
        {/* Main Content Grid */}
        <div className={styles.footerGrid}>
          
          {/* Brand & Direct Contact */}
          <div className={styles.brandCol}>
            <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <ServiqLogo size="md" theme="dark" />
            </Link>

            <p className={styles.brandText}>
              Autonomous AI-powered restaurant operating system — QR table ordering, kitchen displays, and POS billing engineered for modern food outlets.
            </p>

            {/* Desktop Contact Info */}
            <div className={styles.desktopContactList}>
              <a href="mailto:support@dineviq.com" className={styles.contactItem}>
                <Mail style={{ width: 14, height: 14, color: "var(--color-primary)", flexShrink: 0 }} />
                <span>support@dineviq.com</span>
              </a>
              <a
                href="https://wa.me/919680132562?text=Hi%20DineviQ%2C%20I%20would%20like%20to%20know%20more."
                target="_blank"
                rel="noreferrer"
                className={styles.contactItem}
              >
                <Phone style={{ width: 14, height: 14, color: "var(--color-emerald)", flexShrink: 0 }} />
                <span>+91 96801 32562 <span className={styles.supportTag}>(WhatsApp Support)</span></span>
              </a>
            </div>
          </div>

          {/* Clean Column 1: Navigation */}
          <div>
            <h4 className={styles.colTitle}>Navigation</h4>
            <div className={styles.linkList}>
              <Link to="/pricing" className={styles.footerLink}>
                Pricing
              </Link>
              <Link to="/about" className={styles.footerLink}>
                About Us
              </Link>
              <Link to="/contact" className={styles.footerLink}>
                Contact
              </Link>
              {triggerDemo ? (
                <button
                  type="button"
                  onClick={triggerDemo}
                  className={styles.footerLinkBtn}
                >
                  Book a Demo
                </button>
              ) : (
                <Link to="/demo" className={styles.footerLink}>
                  Book a Demo
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Direct Contact (Moved Below Navigation as Requested) */}
          <div className={styles.mobileContactList}>
            <a href="mailto:support@dineviq.com" className={styles.contactItem}>
              <Mail style={{ width: 14, height: 14, color: "var(--color-primary)", flexShrink: 0 }} />
              <span>support@dineviq.com</span>
            </a>
            <a
              href="https://wa.me/919680132562?text=Hi%20DineviQ%2C%20I%20would%20like%20to%20know%20more."
              target="_blank"
              rel="noreferrer"
              className={styles.contactItem}
            >
              <Phone style={{ width: 14, height: 14, color: "var(--color-emerald)", flexShrink: 0 }} />
              <span>+91 96801 32562</span>
            </a>
          </div>

          {/* Clean Column 2: Trust & SLA Card (Hidden on Mobile) */}
          <div className={styles.slaCol}>
            <div className={styles.slaCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 12, fontWeight: 700 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span>Operational Cloud Infrastructure</span>
              </div>
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.4 }}>
                Real-time sub-50ms WebSocket telemetry for POS, kitchen lines & billing.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginTop: 8 }}>
                <ShieldCheck style={{ width: 13, height: 13, color: 'var(--color-primary)' }} />
                <span>99.98% Guaranteed Uptime SLA</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className={styles.footerBottom}>
          <div style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} DINEVIQ. All rights reserved.
          </div>

          <div className={styles.bottomLinks}>
            <Link to="/privacy-policy" className={styles.bottomLink}>Privacy Policy</Link>
            <span style={{ color: '#334155' }}>•</span>
            <Link to="/terms-of-service" className={styles.bottomLink}>Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

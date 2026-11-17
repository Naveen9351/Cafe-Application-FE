import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  QrCode,
  Menu as MenuIcon,
  X,
  ArrowRight,
  LogIn,
  Store
} from "lucide-react";
import ServiqLogo from "../brand/ServiqLogo";
import { useAuth } from "../../context/AuthContext";
import styles from "../../styles/Navbar.module.css";

export default function Navbar({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;
  const { user } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 60) {
        setScrolled(true);
        if (currentScrollY > lastScrollY + 8) {
          // Scrolling down -> hide header
          setHidden(true);
        } else if (lastScrollY - currentScrollY > 8) {
          // Scrolling up -> show header with animation
          setHidden(false);
        }
      } else {
        setScrolled(false);
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeDropdowns = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""} ${hidden ? styles.headerHidden : ""}`}>
      <div className="container">
        <div className={styles.navContainer}>

          {/* Brand Logo */}
          <Link
            to="/"
            onClick={closeDropdowns}
            className={styles.brandLink}
          >
            <ServiqLogo size="md" theme="light" />
          </Link>

          {/* Desktop Navigation Links (Single Row) */}
          <nav className={styles.navLinks}>
            {/* Direct Links */}
            <Link
              to="/pricing"
              onClick={(e) => {
                if (pathname === "/" || pathname === "/register") {
                  const el = document.getElementById("pricing");
                  if (el) {
                    e.preventDefault();
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 70;
                    window.scrollTo({ top: y, behavior: "smooth" });
                    closeDropdowns();
                  }
                }
              }}
              className={`${styles.navBtn} ${pathname === "/pricing" ? styles.navBtnActive : ""}`}
            >
              Pricing
            </Link>

            <Link
              to="/about"
              onClick={closeDropdowns}
              className={`${styles.navBtn} ${pathname === "/about" ? styles.navBtnActive : ""}`}
            >
              About
            </Link>

            <Link
              to="/contact"
              onClick={closeDropdowns}
              className={`${styles.navBtn} ${pathname === "/contact" ? styles.navBtnActive : ""}`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Action CTAs (Single Row) */}
          <div className={styles.rightActions}>
            {user ? (
              <Link
                to={user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard'}
                className={styles.loginBtn}
                title="Restaurant Dashboard"
              >
                <Store style={{ width: 12, height: 12 }} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={styles.loginBtn}
                title="Restaurant Login Portal"
              >
                <LogIn style={{ width: 12, height: 12 }} />
                <span>Restaurant Login</span>
              </Link>
            )}

            {triggerDemo ? (
              <button
                type="button"
                onClick={triggerDemo}
                className="btn-electric"
                style={{ padding: '7px 14px', fontSize: 12 }}
              >
                <span>Book a Demo</span>
                <ArrowRight style={{ width: 13, height: 13 }} />
              </button>
            ) : (
              <Link
                to="/demo"
                className="btn-electric"
                style={{ padding: '7px 14px', fontSize: 12 }}
              >
                <span>Book a Demo</span>
                <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            )}
          </div>

          {/* Mobile Animated Hamburger -> Cross Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`${styles.hamburgerBtn} ${mobileMenuOpen ? styles.hamburgerActive : ""}`}
            aria-label="Toggle Menu"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Staggered Entrance Animation & 2-Col Button Grid */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <div className={styles.drawerItem}>
            <Link to="/pricing" onClick={closeDropdowns} className={styles.navBtn}>Pricing</Link>
          </div>
          <div className={styles.drawerItem}>
            <Link to="/about" onClick={closeDropdowns} className={styles.navBtn}>About</Link>
          </div>
          <div className={styles.drawerItem}>
            <Link to="/contact" onClick={closeDropdowns} className={styles.navBtn}>Contact</Link>
          </div>
          <div className={styles.drawerItem}>
            <Link to="/menu" onClick={closeDropdowns} className="badge-pill badge-emerald" style={{ alignSelf: 'flex-start' }}>
              <QrCode style={{ width: 14, height: 14 }} /> Live QR Menu Demo
            </Link>
          </div>

          <div className={`${styles.drawerItem} ${styles.mobileDrawerGrid}`}>
            {user ? (
              <Link
                to={user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard'}
                onClick={closeDropdowns}
                className={styles.drawerBtnLogin}
              >
                <Store style={{ width: 13, height: 13 }} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={closeDropdowns}
                className={styles.drawerBtnLogin}
              >
                <LogIn style={{ width: 13, height: 13 }} />
                <span>Restaurant Login</span>
              </Link>
            )}

            {triggerDemo ? (
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  triggerDemo();
                }}
                className={styles.drawerBtnDemo}
              >
                <span>Book Demo</span>
                <ArrowRight style={{ width: 13, height: 13 }} />
              </button>
            ) : (
              <Link
                to="/demo"
                onClick={closeDropdowns}
                className={styles.drawerBtnDemo}
              >
                <span>Book Demo</span>
                <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
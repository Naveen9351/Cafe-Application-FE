import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  QrCode,
  ChevronDown,
  Menu as MenuIcon,
  X,
  ArrowRight,
  LogIn,
  Store,
  Sparkles,
  Phone
} from "lucide-react";
import { FLAGSHIP_PRODUCTS } from "../../data/productsData";
import { SOLUTIONS } from "../../data/solutionsData";
import ServiqLogo from "../brand/ServiqLogo";
import styles from "../../styles/Navbar.module.css";

export default function Navbar({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeDropdowns = () => {
    setProductsDropdownOpen(false);
    setSolutionsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
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

            {/* Products Mega Dropdown */}
            <div
              className={styles.dropdownWrapper}
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button
                type="button"
                className={`${styles.navBtn} ${pathname?.startsWith("/products") ? styles.navBtnActive : ""}`}
              >
                <span>Products</span>
                <ChevronDown
                  style={{
                    width: 13,
                    height: 13,
                    transition: 'transform 0.2s',
                    transform: productsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              {productsDropdownOpen && (
                <div className={`${styles.dropdownMenu} ${styles.megaMenuProducts}`}>
                  <div className={styles.dropdownHeader}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 14, height: 14 }} />
                      Flagship AI Restaurant Architecture
                    </span>
                    <Link
                      to="/products"
                      onClick={closeDropdowns}
                      style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}
                    >
                      All Modules →
                    </Link>
                  </div>

                  <div className={styles.dropdownGrid}>
                    {FLAGSHIP_PRODUCTS.map((prod) => (
                      <Link
                        key={prod.id}
                        to="/products"
                        onClick={closeDropdowns}
                        className={styles.dropdownCard}
                      >
                        <span className={styles.cardBadge}>{prod.badge}</span>
                        <div className={styles.cardTitle}>{prod.name}</div>
                        <p className={styles.cardDesc}>{prod.tagline}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div
              className={styles.dropdownWrapper}
              onMouseEnter={() => setSolutionsDropdownOpen(true)}
              onMouseLeave={() => setSolutionsDropdownOpen(false)}
            >
              <button
                type="button"
                className={`${styles.navBtn} ${pathname?.startsWith("/solutions") ? styles.navBtnActive : ""}`}
              >
                <span>Solutions</span>
                <ChevronDown
                  style={{
                    width: 13,
                    height: 13,
                    transition: 'transform 0.2s',
                    transform: solutionsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              {solutionsDropdownOpen && (
                <div className={`${styles.dropdownMenu} ${styles.megaMenuSolutions}`}>
                  <div className={styles.dropdownHeader}>
                    <span>Outlets & Venues</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {SOLUTIONS.map((sol) => (
                      <Link
                        key={sol.id}
                        to="/solutions"
                        onClick={closeDropdowns}
                        className={styles.dropdownCard}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <div>
                          <div className={styles.cardTitle}>{sol.name}</div>
                          <div className={styles.cardDesc}>{sol.tagline}</div>
                        </div>
                        <ArrowRight style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Links */}
            <Link
              to="/pricing"
              className={`${styles.navBtn} ${pathname === "/pricing" ? styles.navBtnActive : ""}`}
            >
              Pricing
            </Link>

            <Link
              to="/about"
              className={`${styles.navBtn} ${pathname === "/about" ? styles.navBtnActive : ""}`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`${styles.navBtn} ${pathname === "/contact" ? styles.navBtnActive : ""}`}
            >
              Contact
            </Link>

          </nav>

          {/* Right Action CTAs (Single Row) */}
          <div className={styles.rightActions}>
            <a
              href="https://wa.me/919680132562"
              target="_blank"
              rel="noreferrer"
              className={styles.whatsappPill}
              title="Chat with Tech Specialist"
            >
              <Phone style={{ width: 12, height: 12 }} />
              <span>WhatsApp</span>
            </a>

            <Link
              to="/login"
              className="btn-white"
              style={{ padding: '7px 12px', fontSize: 12 }}
            >
              <LogIn style={{ width: 13, height: 13 }} />
              <span>Login</span>
            </Link>

            <Link
              to="/register"
              className="btn-white"
              style={{ padding: '7px 12px', fontSize: 12 }}
            >
              <Store style={{ width: 13, height: 13, color: 'var(--color-primary)' }} />
              <span>Sign Up</span>
            </Link>

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

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={styles.mobileToggle}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X style={{ width: 22, height: 22 }} /> : <MenuIcon style={{ width: 22, height: 22 }} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <Link to="/products" onClick={closeDropdowns} className={styles.navBtn}>Products Suite</Link>
          <Link to="/solutions" onClick={closeDropdowns} className={styles.navBtn}>Solutions for Outlets</Link>
          <Link to="/pricing" onClick={closeDropdowns} className={styles.navBtn}>Pricing (₹)</Link>
          <Link to="/about" onClick={closeDropdowns} className={styles.navBtn}>About SERVIQ</Link>
          <Link to="/contact" onClick={closeDropdowns} className={styles.navBtn}>Contact Support</Link>
          <Link to="/menu" onClick={closeDropdowns} className="badge-pill badge-emerald" style={{ alignSelf: 'flex-start' }}>
            <QrCode style={{ width: 14, height: 14 }} /> Live Customer QR Menu
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <Link to="/login" onClick={closeDropdowns} className="btn-white">Login</Link>
            <Link to="/register" onClick={closeDropdowns} className="btn-white">Sign Up Free</Link>
            <button
              type="button"
              onClick={() => { closeDropdowns(); if (triggerDemo) triggerDemo(); }}
              className="btn-electric"
            >
              Book a Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

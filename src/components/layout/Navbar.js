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
  Phone,
  Monitor,
  CreditCard,
  Boxes,
  HeartHandshake,
  Coffee,
  Zap,
  UtensilsCrossed,
  Flame,
  Building2
} from "lucide-react";
import { FLAGSHIP_PRODUCTS, ECOSYSTEM_PRODUCTS } from "../../data/productsData";
import { SOLUTIONS } from "../../data/solutionsData";
import ServiqLogo from "../brand/ServiqLogo";
import { getBillingPortalUrl } from "../../utils/subdomain";
import { useAuth } from "../../context/AuthContext";
import styles from "../../styles/Navbar.module.css";

export default function Navbar({ onOpenDemoModal, onOpenDemo }) {
  const triggerDemo = onOpenDemo || onOpenDemoModal;
  const { user } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.dropdownWrapper}`)) {
        setProductsDropdownOpen(false);
        setSolutionsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const closeDropdowns = () => {
    setProductsDropdownOpen(false);
    setSolutionsDropdownOpen(false);
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

            {/* Products Mega Dropdown (Click to Open) */}
            <div className={styles.dropdownWrapper}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductsDropdownOpen((prev) => !prev);
                  setSolutionsDropdownOpen(false);
                }}
                className={`${styles.navBtn} ${pathname?.startsWith("/products") || productsDropdownOpen ? styles.navBtnActive : ""}`}
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
                      DineviQ Autonomous Restaurant Suite
                    </span>
                    <Link
                      to="/products"
                      onClick={closeDropdowns}
                      style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 800 }}
                    >
                      All Modules & Specs →
                    </Link>
                  </div>

                  <div className={styles.dropdownSplit}>
                    {/* Left Column: Flagship Engines */}
                    <div className={styles.dropdownCol} style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span className={styles.dropdownColTitle}>Flagship Core Engines</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.08)', padding: '1px 6px', borderRadius: 4 }}>
                          Autonomous
                        </span>
                      </div>

                      <Link
                        to="/products"
                        onClick={closeDropdowns}
                        className={styles.flagshipCard}
                        style={{ padding: '12px 14px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div className={`${styles.iconBox} ${styles.iconBoxBlue}`} style={{ width: 34, height: 34 }}>
                            <QrCode style={{ width: 18, height: 18 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                                QR Table Dining
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-emerald)', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                                +24% Check
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
                              Visual digital menus, table ordering & direct UPI settlements in ₹.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--color-primary)' }}>
                              <span>Zero app installs</span>
                              <span>•</span>
                              <span>WhatsApp receipts</span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      <Link
                        to="/products"
                        onClick={closeDropdowns}
                        className={styles.flagshipCard}
                        style={{ padding: '12px 14px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div className={`${styles.iconBox} ${styles.iconBoxEmerald}`} style={{ width: 34, height: 34 }}>
                            <Monitor style={{ width: 18, height: 18 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                                Kitchen Display (KDS)
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                                Sub-50ms
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
                              Paperless kitchen routing, station SLA timers & pass load-balancing.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--color-emerald)' }}>
                              <span>Multi-station queues</span>
                              <span>•</span>
                              <span>Urgency alerts</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Right Column: Operational & AI Modules */}
                    <div className={styles.dropdownCol}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span className={styles.dropdownColTitle}>Operations & Intelligence</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>4 Modules</span>
                      </div>

                      <Link to="/products" onClick={closeDropdowns} className={styles.subCard}>
                        <div className={`${styles.iconBox} ${styles.iconBoxIndigo}`} style={{ width: 28, height: 28 }}>
                          <CreditCard style={{ width: 14, height: 14 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>Cloud POS & Billing</span>
                            <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                          </div>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Split bills, floorplan maps & thermal printer sync
                          </p>
                        </div>
                      </Link>

                      <Link to="/products" onClick={closeDropdowns} className={styles.subCard}>
                        <div className={`${styles.iconBox} ${styles.iconBoxAmber}`} style={{ width: 28, height: 28 }}>
                          <Boxes style={{ width: 14, height: 14 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>Recipe Inventory & Wastage</span>
                            <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                          </div>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Live BOM recipe depletion & dynamic reorders
                          </p>
                        </div>
                      </Link>

                      <Link to="/products" onClick={closeDropdowns} className={styles.subCard}>
                        <div className={`${styles.iconBox} ${styles.iconBoxRose}`} style={{ width: 28, height: 28 }}>
                          <HeartHandshake style={{ width: 14, height: 14 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>Guest CRM & WhatsApp</span>
                            <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                          </div>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Digital bills on WhatsApp & repeat guest loyalty
                          </p>
                        </div>
                      </Link>

                      <Link to="/products" onClick={closeDropdowns} className={styles.subCard}>
                        <div className={`${styles.iconBox} ${styles.iconBoxPurple}`} style={{ width: 28, height: 28 }}>
                          <Sparkles style={{ width: 14, height: 14 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>Autonomous AI Intelligence</span>
                            <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                          </div>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Hourly rush velocity & prep recommendations
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className={styles.dropdownFooter}>
                    <Link
                      to="/menu"
                      onClick={closeDropdowns}
                      style={{ color: 'var(--color-emerald)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <QrCode style={{ width: 14, height: 14 }} />
                      <span>Test Live Guest QR Menu in ₹</span>
                    </Link>
                    <Link
                      to="/products"
                      onClick={closeDropdowns}
                      style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                    >
                      View Platform Architecture →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown (Click to Open) */}
            <div className={styles.dropdownWrapper}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSolutionsDropdownOpen((prev) => !prev);
                  setProductsDropdownOpen(false);
                }}
                className={`${styles.navBtn} ${pathname?.startsWith("/solutions") || solutionsDropdownOpen ? styles.navBtnActive : ""}`}
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 14, height: 14 }} />
                      Tailored Outlet Architectures
                    </span>
                    <Link
                      to="/solutions"
                      onClick={closeDropdowns}
                      style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 800 }}
                    >
                      All 5 Venues →
                    </Link>
                  </div>

                  <div className={styles.dropdownGrid}>
                    {/* Card 1: Cafes & Coffee Bars */}
                    <Link to="/solutions" onClick={closeDropdowns} className={styles.venueCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className={`${styles.iconBox} ${styles.iconBoxAmber}`} style={{ width: 24, height: 24 }}>
                            <Coffee style={{ width: 13, height: 13 }} />
                          </div>
                          <span className={`${styles.cardBadge} ${styles.cardBadgeEmerald}`}>Specialty & Artisan</span>
                        </div>
                        <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                      </div>
                      <div className={styles.cardTitle}>Cafes & Coffee Bars</div>
                      <div className={styles.cardDesc} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        High-concurrency barista queues & zero-friction table ordering
                      </div>
                    </Link>

                    {/* Card 2: QSR & Quick-Service Food */}
                    <Link to="/solutions" onClick={closeDropdowns} className={styles.venueCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className={`${styles.iconBox} ${styles.iconBoxBlue}`} style={{ width: 24, height: 24 }}>
                            <Zap style={{ width: 13, height: 13 }} />
                          </div>
                          <span className={`${styles.cardBadge} ${styles.cardBadgeEmerald}`}>High Velocity</span>
                        </div>
                        <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                      </div>
                      <div className={styles.cardTitle}>QSR & Quick-Service Food</div>
                      <div className={styles.cardDesc} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        45-second kitchen throughput, line-busting ordering & counter tokens
                      </div>
                    </Link>

                    {/* Card 3: Casual & Fine Dining */}
                    <Link to="/solutions" onClick={closeDropdowns} className={styles.venueCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className={`${styles.iconBox} ${styles.iconBoxEmerald}`} style={{ width: 24, height: 24 }}>
                            <UtensilsCrossed style={{ width: 13, height: 13 }} />
                          </div>
                          <span className={`${styles.cardBadge} ${styles.cardBadgeEmerald}`}>Full Service</span>
                        </div>
                        <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                      </div>
                      <div className={styles.cardTitle}>Casual & Fine Dining</div>
                      <div className={styles.cardDesc} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Multi-course pacing, captain POS handhelds & table-side UPI settle
                      </div>
                    </Link>

                    {/* Card 4: Cloud Kitchens & Dark Brands */}
                    <Link to="/solutions" onClick={closeDropdowns} className={styles.venueCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className={`${styles.iconBox} ${styles.iconBoxRose}`} style={{ width: 24, height: 24 }}>
                            <Flame style={{ width: 13, height: 13 }} />
                          </div>
                          <span className={`${styles.cardBadge} ${styles.cardBadgeEmerald}`}>Delivery Hub</span>
                        </div>
                        <ArrowRight style={{ width: 12, height: 12, color: 'var(--text-light)' }} />
                      </div>
                      <div className={styles.cardTitle}>Cloud Kitchens & Dark Brands</div>
                      <div className={styles.cardDesc} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Centralized multi-brand kitchen hub & 0% commission direct dispatch
                      </div>
                    </Link>

                    {/* Card 5: Multi-Outlet & Franchise Chains (Spans across both columns) */}
                    <Link to="/solutions" onClick={closeDropdowns} className={styles.enterpriseCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <div className={`${styles.iconBox} ${styles.iconBoxIndigo}`} style={{ width: 34, height: 34, flexShrink: 0 }}>
                          <Building2 style={{ width: 18, height: 18 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Multi-Outlet & Franchise Chains</span>
                            <span className={`${styles.cardBadge} ${styles.cardBadgeEmerald}`}>Enterprise Scale</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35, whiteSpace: 'normal' }}>
                            Centralized menu governance, franchise royalties & unified executive BI across 10+ locations
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        <span>Explore Suite</span>
                        <ArrowRight style={{ width: 13, height: 13 }} />
                      </div>
                    </Link>
                  </div>

                  <div className={styles.dropdownFooter}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      Engineered for Indian Cafes, QSRs, Dine-In & Multi-Outlet Chains
                    </span>
                    <Link
                      to="/solutions"
                      onClick={closeDropdowns}
                      style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                    >
                      Compare All Outlets →
                    </Link>
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
            <Link
              to="/whatsapp"
              className={styles.whatsappPill}
              title="WhatsApp CRM & Ordering Integration"
            >
              <Phone style={{ width: 12, height: 12 }} />
              <span>WhatsApp</span>
            </Link>

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
              <a
                href={getBillingPortalUrl()}
                className={styles.loginBtn}
                title="Restaurant Login Portal"
              >
                <LogIn style={{ width: 12, height: 12 }} />
                <span>Restaurant Login</span>
              </a>
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
          <Link to="/products" onClick={closeDropdowns} className={styles.navBtn}>Products</Link>
          <Link to="/pricing" onClick={closeDropdowns} className={styles.navBtn}>Pricing</Link>
          <Link to="/whatsapp" onClick={closeDropdowns} className={styles.navBtn}>WhatsApp</Link>
          <Link to="/contact" onClick={closeDropdowns} className={styles.navBtn}>Contact</Link>
          <Link to="/solutions" onClick={closeDropdowns} className={styles.navBtn}>Solutions</Link>
          <Link to="/about" onClick={closeDropdowns} className={styles.navBtn}>About</Link>
          <Link to="/menu" onClick={closeDropdowns} className="badge-pill badge-emerald" style={{ alignSelf: 'flex-start' }}>
            <QrCode style={{ width: 14, height: 14 }} /> Live QR Menu Demo
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            {user ? (
              <Link
                to={user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard'}
                onClick={closeDropdowns}
                className={styles.loginBtn}
                style={{ justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}
              >
                <Store style={{ width: 14, height: 14 }} />
                <span>Restaurant Dashboard</span>
              </Link>
            ) : (
              <a
                href={getBillingPortalUrl()}
                onClick={closeDropdowns}
                className={styles.loginBtn}
                style={{ justifyContent: 'center', padding: '9px 14px', fontSize: 13 }}
              >
                <LogIn style={{ width: 14, height: 14 }} />
                <span>Restaurant Login</span>
              </a>
            )}
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

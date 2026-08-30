import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import PageLoader from './PageLoader';
import LandingChatbot from './LandingChatbot';
import { 
  UtensilsCrossed, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  Layers, 
  Bot, 
  Receipt, 
  ChefHat, 
  PackageCheck, 
  Users, 
  ArrowRight, 
  Check, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Sliders, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Store,
  DollarSign,
  Coffee,
  Globe,
  Star,
  Award,
  Laptop,
  Printer,
  QrCode,
  CreditCard,
  PhoneCall,
  Calendar,
  Building2,
  PieChart,
  Activity,
  CheckCircle,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();

  // Mobile Navigation Drawer
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ROI Calculator Sliders
  const [dailyOrders, setDailyOrders] = useState(240);
  const [avgTicket, setAvgTicket] = useState(480);

  // Billing Toggle
  const [annualBilling, setAnnualBilling] = useState(true);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Lead Generation Demo Form State
  const [demoForm, setDemoForm] = useState({
    name: '',
    phone: '',
    city: 'Bangalore',
    outletType: 'Cafe & Dining',
  });
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Interactive Live POS Simulation State inside Hero Terminal
  const [billItems, setBillItems] = useState([
    { name: 'Truffle Risotto', qty: 1, price: 540 },
    { name: 'Matcha Latte', qty: 2, price: 280 },
    { name: 'Avocado Toast', qty: 1, price: 390 },
  ]);

  const subtotal = billItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const totalBill = subtotal + gst;

  const handleSettleHeroBill = () => {
    toast.success(`Order settled for ₹${totalBill.toLocaleString()}! Receipt printed & sent via WhatsApp.`, {
      icon: '🎉',
      duration: 3500,
    });
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    setDemoSubmitted(true);
    toast.success('Demo booked! Our specialist will contact you shortly.', { icon: '🚀' });
  };

  // Calculated ROI Values
  const monthlyRevenue = dailyOrders * 30 * avgTicket;
  const monthlySavings = Math.round(monthlyRevenue * 0.036 + dailyOrders * 30 * 8);
  const annualSavings = monthlySavings * 12;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.landingContainer}>
      {/* 🚀 First-Time / Animated Page Loader */}
      <PageLoader duration={1000} />

      <Toaster position="top-center" />

      {/* Subtle Background Glow */}
      <div className={styles.heroGlow} />

      {/* ─── 1. NAVBAR (RESPONSIVE & LIGHT THEME) ─── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0 clamp(1rem, 4vw, 5%)',
        height: 'clamp(62px, 8vw, 74px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
      }}>
        {/* Left: Brand Logo (Light Theme) */}
        <BrandLogo theme="light" onClick={() => navigate('/')} showSubtitle={true} />

        {/* Center: Navigation Links (Desktop) */}
        <div className={styles.navLinks} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[
            { label: 'Suite', id: 'suite' },
            { label: 'Formats', id: 'formats' },
            { label: 'Hardware', id: 'hardware' },
            { label: 'Pricing', id: 'pricing' },
            { label: 'FAQ', id: 'faq' },
          ].map((link) => (
            <span
              key={link.label}
              onClick={() => scrollToSection(link.id)}
              style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-emerald)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {link.label}
            </span>
          ))}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className={styles.desktopActions}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                padding: '0.4rem 0.6rem',
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className={styles.btnPrimary}
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.84rem', borderRadius: '8px' }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className={styles.mobileMenuBtn}
          >
            {mobileNavOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Navigation Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className={styles.mobileDrawer}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'sticky',
              top: '62px',
              zIndex: 99,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-light)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            }}
          >
            {[
              { label: 'Product Suite', id: 'suite' },
              { label: 'Food Formats', id: 'formats' },
              { label: 'Hardware Matrix', id: 'hardware' },
              { label: 'Transparent Pricing', id: 'pricing' },
              { label: 'Frequently Asked Questions', id: 'faq' },
            ].map((link) => (
              <span
                key={link.label}
                onClick={() => { scrollToSection(link.id); setMobileNavOpen(false); }}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '0.35rem 0',
                }}
              >
                {link.label}
              </span>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={() => { navigate('/login'); setMobileNavOpen(false); }}
                className={styles.btnSecondary}
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem' }}
              >
                Login
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileNavOpen(false); }}
                className={styles.btnPrimary}
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem' }}
              >
                Start Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. HERO SECTION (LIGHT THEME) ─── */}
      <section className={styles.sectionWrapperCenter} style={{ paddingTop: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
        
        {/* Top Badge */}
        <div className={styles.sectionBadge}>
          ⚡ POWERING 500+ FOOD HUBS NATIONWIDE
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2rem, 5.5vw, 4.2rem)',
          fontWeight: '900',
          lineHeight: '1.14',
          letterSpacing: '-1.2px',
          color: 'var(--text-primary)',
          maxWidth: '850px',
          margin: '0 auto 1.25rem',
        }}>
          The Operating System<br />
          for<br />
          <span style={{ color: 'var(--primary-emerald)' }}>High-Growth Restaurants</span>
        </h1>

        {/* Subtitle */}
        <p className={styles.sectionSubtitle} style={{ marginBottom: '2rem', maxWidth: '680px' }}>
          An all-in-one platform for fast-paced dining. Supercharge table turnover, zero-latency kitchen queues, raw material control, and AI revenue optimization.
        </p>

        {/* Hero Action Buttons */}
        <div className={styles.heroActions} style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button onClick={() => navigate('/register')} className={styles.btnPrimary} style={{ padding: '0.8rem 1.75rem', fontSize: '0.94rem' }}>
            Launch Free Trial <ArrowRight size={16} />
          </button>
          <button onClick={() => scrollToSection('demo-form')} className={styles.btnSecondary} style={{ padding: '0.8rem 1.75rem', fontSize: '0.94rem' }}>
            Book a Live Demo
          </button>
        </div>

        {/* Hero Dashboard Preview Window (macOS Light/Slate Card) */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 30px rgba(5, 150, 105, 0.05)',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary-emerald)' }} />
              RASTRORATO Cloud POS • Outlet #01 (Live)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary-emerald)', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
              ONLINE
            </div>
          </div>

          {/* Grid Layout inside Dashboard Mockup */}
          <div className={styles.heroGrid}>
            
            {/* Left Column: Active Order Settle */}
            <div style={{ backgroundColor: 'var(--bg-card-muted)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>Active Table: T-04</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-emerald)', fontWeight: '700' }}>Dine-In</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {billItems.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>{item.qty}x {item.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  <span>Net Total</span>
                  <span style={{ color: 'var(--primary-emerald)' }}>₹{totalBill.toLocaleString()}.00</span>
                </div>
              </div>

              <button onClick={handleSettleHeroBill} className={styles.btnPrimary} style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', borderRadius: '8px' }}>
                Instant Settle & KOT
              </button>
            </div>

            {/* Right Column: Telemetry & Live Order Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* 3 Metric Cards */}
              <div className={styles.terminalMetricsGrid}>
                {[
                  { label: 'Daily Net Volume', val: '₹1,28,450', change: '+18% today' },
                  { label: 'Table Turnaround', val: '24 min', change: '-8 min avg' },
                  { label: 'Kitchen Prep Avg', val: '6m 12s', change: '0s delay' },
                ].map(m => (
                  <div key={m.label} style={{ backgroundColor: 'var(--bg-card-muted)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{m.label}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)' }}>{m.val}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--primary-emerald)', fontWeight: '700' }}>{m.change}</div>
                  </div>
                ))}
              </div>

              {/* Live Order Queue Rows */}
              <div style={{ backgroundColor: 'var(--bg-card-muted)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '1rem', flex: 1 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                  Live Kitchen Production Queue
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { id: 'Order #408', type: 'Dine-In • Table 02', status: 'Cooking', time: '4m ago', statusColor: 'var(--primary-emerald)' },
                    { id: 'Order #409', type: 'Takeaway • Counter 1', status: 'Ready for Pickup', time: '1m ago', statusColor: '#2563eb' },
                    { id: 'Order #410', type: 'Delivery • Zomato', status: 'Prepping', time: '8m ago', statusColor: '#d97706' },
                  ].map(ord => (
                    <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontWeight: '800', color: 'var(--text-primary)', marginRight: '0.4rem' }}>{ord.id}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>{ord.type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{ord.time}</span>
                        <span style={{ color: ord.statusColor, fontWeight: '700', fontSize: '0.74rem' }}>{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ─── 3. SECTION: COMPREHENSIVE PRODUCT SUITE (6 CARDS GRID) ─── */}
      <section id="suite" className={styles.sectionWrapperCenter}>
        <div className={styles.sectionBadge}>
          COMPREHENSIVE PRODUCT SUITE
        </div>
        <h2 className={styles.sectionTitle}>
          Everything You Need to Run Your Restaurant
        </h2>
        <p className={styles.sectionSubtitle} style={{ marginBottom: '2.75rem' }}>
          From the counter to the kitchen and back-office ledger, every module is natively integrated for zero miscommunication.
        </p>

        <div className={styles.grid6}>
          {[
            {
              icon: Receipt,
              title: 'Ultra-Fast Cloud POS',
              desc: 'Point of sale terminal built for high concurrency. Split bills, custom modifiers & 1-click settlements.',
            },
            {
              icon: ChefHat,
              title: 'Zero-Latency Kitchen (KDS)',
              desc: 'Instant digital KOT queues with preparation timers, color-coded delays, and station routing.',
            },
            {
              icon: PackageCheck,
              title: 'Raw Ingredient & PO Auto',
              desc: 'Real-time recipe-level stock depletion, low-stock threshold warnings, and 1-click automated PO dispatch.',
            },
            {
              icon: Smartphone,
              title: 'Digital QR Dining & Pay',
              desc: 'Frictionless table ordering with dynamic high-res menus, instant dietary filters, and direct UPI pay.',
            },
            {
              icon: Store,
              title: 'Aggregator Integrations',
              desc: 'Unified order bridge for Zomato, Swiggy, and direct delivery channels from a single screen.',
            },
            {
              icon: Bot,
              title: 'AI Restaurant Intelligence',
              desc: 'Predictive demand forecasting, weather impact analysis, dynamic dish combos, and auto menu digitizer.',
            },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <Icon size={20} color="var(--primary-emerald)" />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. SECTION: A MODULAR SUITE TAILORED FOR YOUR GROWTH (FEATURE SPLIT) ─── */}
      <section className={styles.sectionWrapper}>
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <div className={styles.sectionBadge}>
            LIVE KDS
          </div>
          <h2 className={styles.sectionTitle}>
            A Modular Suite Tailored For Your Growth
          </h2>
          <p className={styles.sectionSubtitle}>
            Select individual components or activate the full operating suite. RASTRORATO adapts to your existing floor workflow.
          </p>
        </div>

        <div className={styles.splitGrid}>
          <div>
            <div style={{ color: 'var(--primary-emerald)', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
              Operational Efficiency
            </div>
            <h3 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: '900', color: 'var(--text-primary)', lineHeight: '1.2', marginBottom: '1rem', letterSpacing: '-0.4px' }}>
              Control Your Kitchen Flow with Live KDS Pipelines
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              Eliminate paper tickets and lost modifications. Our kitchen display synchronizes instantly with waitstaff terminals and QR tables, giving head chefs full visibility over preparation times and bottle-necks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                'Zero-delay WebSocket ticket dispatch across multiple kitchen stations',
                'Color-coded urgency alerts for orders exceeding standard prep time',
                'One-tap fulfillment status updating servers and guests simultaneously',
              ].map(bullet => (
                <div key={bullet} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={18} color="var(--primary-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }}>
            <img 
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80" 
              alt="Kitchen KDS Display" 
              style={{ width: '100%', height: 'clamp(220px, 30vw, 340px)', objectFit: 'cover', display: 'block' }} 
            />
          </div>
        </div>
      </section>

      {/* ─── 5. KEY METRICS STRIP (4 STATS) ─── */}
      <section style={{ backgroundColor: '#ffffff', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: 'clamp(2.5rem, 5vw, 3.5rem) 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className={styles.metricsGrid}>
          {[
            { num: '2,500+', label: 'Active Food Outlets' },
            { num: '₹145Cr+', label: 'Annual GMV Processed' },
            { num: '99.99%', label: 'Cloud Uptime SLA' },
            { num: '24/7', label: 'Dedicated Support Engine' },
          ].map(m => (
            <div key={m.label} className={styles.metricItem}>
              <div className={styles.metricNumber}>{m.num}</div>
              <div className={styles.metricLabel}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. SECTION: DESIGNED FOR EVERY FOOD FORMAT (3 CARDS) ─── */}
      <section id="formats" className={styles.sectionWrapperCenter}>
        <div className={styles.sectionBadge}>
          TAILORED FOR YOUR INDUSTRY
        </div>
        <h2 className={styles.sectionTitle}>
          Designed for Every Food Format
        </h2>
        <p className={styles.sectionSubtitle} style={{ marginBottom: '2.75rem' }}>
          Built to fit the unique rhythm of quick-service kiosks, bustling cafes, and full-service dining establishments.
        </p>

        <div className={styles.grid3}>
          {[
            {
              icon: Store,
              title: 'QSR & Fast Food',
              bullets: [
                'High-volume counter POS billing',
                'Token calling screen synchronization',
                '45-second order-to-kitchen time',
                'High concurrency cash drawers',
              ],
            },
            {
              icon: Coffee,
              title: 'The Dining & Cafe',
              bullets: [
                'Visual floor plan & table mapper',
                'Multi-course course firing',
                'Barista station KOT display',
                'Guest loyalty ledger & perks',
              ],
            },
            {
              icon: Building2,
              title: 'Cloud Kitchens',
              bullets: [
                'Multi-brand virtual kitchen hub',
                'Consolidated delivery streams',
                'Shared commissary inventory',
                'Brand-level P&L and metrics',
              ],
            },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.title} className={styles.formatCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  <Icon size={22} color="var(--primary-emerald)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{c.title}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {c.bullets.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--primary-emerald)', fontWeight: '900' }}>•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 7. SECTION: WORKS SEAMLESSLY ON ANY HARDWARE ─── */}
      <section id="hardware" className={styles.sectionWrapperCenter} style={{ paddingTop: 0 }}>
        <div className={styles.sectionBadge}>
          HARDWARE AGNOSTIC
        </div>
        <h2 className={styles.sectionTitle}>
          Works Seamlessly on Any Hardware
        </h2>
        <p className={styles.sectionSubtitle} style={{ marginBottom: '2.5rem' }}>
          No expensive proprietary hardware lock-ins. RASTRORATO runs on the devices and printers your restaurant already owns.
        </p>

        <div className={styles.grid3}>
          {[
            {
              icon: Smartphone,
              title: 'iOS & Android Tablets',
              desc: 'Waiter & cashier mobile terminal',
              badge: 'Zero Setup Time',
            },
            {
              icon: Laptop,
              title: 'Windows & Mac Desktops',
              desc: 'Admin management & reporting',
              badge: 'Browser Native',
            },
            {
              icon: Printer,
              title: 'Thermal & Bluetooth Printers',
              desc: 'Thermal receipt & KOT printer sync',
              badge: 'Universal Drivers',
            },
          ].map(h => {
            const Icon = h.icon;
            return (
              <div key={h.title} className={styles.hardwareCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Icon size={22} color="var(--primary-emerald)" />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-primary)' }}>{h.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{h.desc}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-emerald)', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {h.badge}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 8. SECTION: SEE HOW MUCH YOU CAN RECOVER (ROI CALCULATOR) ─── */}
      <section className={styles.sectionWrapperCenter} style={{ paddingTop: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className={styles.sectionBadge}>
            PROFITABILITY CALCULATOR
          </div>
          <h2 className={styles.sectionTitle}>
            See How Much You Can Recover
          </h2>
          <p className={styles.sectionSubtitle}>
            Calculate your projected monthly savings in prevented food waste, recovered labor hours, and table turnover lift.
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: 'clamp(1.5rem, 4vw, 2.75rem)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          boxSizing: 'border-box',
        }}>
          <div className={styles.calcGrid}>
            
            {/* Left Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Daily Orders</span>
                  <span style={{ fontWeight: '800', color: 'var(--primary-emerald)' }}>{dailyOrders} orders/day</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="600"
                  step="10"
                  value={dailyOrders}
                  onChange={(e) => setDailyOrders(Number(e.target.value))}
                  className={styles.customSlider}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Average Ticket Value</span>
                  <span style={{ fontWeight: '800', color: 'var(--primary-emerald)' }}>₹{avgTicket}</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="2500"
                  step="50"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className={styles.customSlider}
                />
              </div>
            </div>

            {/* Right Value Box */}
            <div style={{
              backgroundColor: 'var(--bg-card-muted)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: 'clamp(1.25rem, 3vw, 2rem)',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '700' }}>
                Estimated Monthly Value Delivered:
              </div>
              <div style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: '900', color: 'var(--primary-emerald)', marginBottom: '1rem' }}>
                ₹{monthlySavings.toLocaleString()} / mo
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '700' }}>
                Estimated Extra Annual Revenue Lift:
              </div>
              <div style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: '900', color: 'var(--primary-emerald)', marginBottom: '1.25rem' }}>
                + ₹{annualSavings.toLocaleString()} / yr
              </div>

              <button onClick={() => navigate('/register')} className={styles.btnPrimary} style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem' }}>
                Claim This ROI — Start Free
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 9. SECTION: SCHEDULE YOUR FREE 1-ON-1 DEMO (LIGHT FORM) ─── */}
      <section id="demo-form" className={styles.sectionWrapper} style={{ paddingTop: 0 }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: 'clamp(1.5rem, 4vw, 3.5rem)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          boxSizing: 'border-box',
        }}>
          <div className={styles.splitGrid}>
            
            {/* Left Info */}
            <div style={{ textAlign: 'left' }}>
              <div className={styles.sectionBadge} style={{ marginBottom: '0.75rem' }}>
                GET A GUIDED TOUR
              </div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: '900', color: 'var(--text-primary)', lineHeight: '1.2', marginBottom: '0.85rem', letterSpacing: '-0.4px' }}>
                Schedule Your Free 1-on-1 Product Demo
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Our restaurant technology specialist will walk you through the entire platform and configure a custom setup for your venue.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  '30-minute personalized walkthrough',
                  'Free physical menu digitization & setup',
                  'Dedicated onboarding specialist support',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={17} color="var(--primary-emerald)" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Form */}
            <div style={{ backgroundColor: 'var(--bg-card-muted)', borderRadius: '16px', padding: 'clamp(1.25rem, 3vw, 2rem)', border: '1px solid var(--border-light)', textAlign: 'left', boxSizing: 'border-box' }}>
              {demoSubmitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Demo Booked!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>We will contact you on <strong>{demoForm.phone}</strong> shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>WhatsApp / Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '16px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>City</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore"
                        value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Outlet Type</label>
                      <select
                        value={demoForm.outletType}
                        onChange={(e) => setDemoForm({ ...demoForm, outletType: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '16px' }}
                      >
                        <option value="Cafe & Dining">Cafe & Dining</option>
                        <option value="QSR & Fast Food">QSR & Fast Food</option>
                        <option value="Pizzeria">Pizzeria</option>
                        <option value="Fine Dining">Fine Dining</option>
                        <option value="Cloud Kitchen">Cloud Kitchen</option>
                        <option value="Bakery">Bakery</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className={styles.btnPrimary} style={{ width: '100%', padding: '0.8rem', fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Book Free Demo
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ─── 10. SECTION: PREDICTABLE PLANS FOR EVERY STAGE (PRICING) ─── */}
      <section id="pricing" className={styles.sectionWrapperCenter} style={{ paddingTop: 0 }}>
        <div className={styles.sectionBadge}>
          SIMPLE & TRANSPARENT
        </div>
        <h2 className={styles.sectionTitle}>
          Predictable Plans for Every Stage
        </h2>

        {/* Billing Switch */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ffffff', padding: '0.35rem 0.5rem', borderRadius: '100px', border: '1px solid var(--border-light)', margin: '1rem auto 2.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setAnnualBilling(false)}
            style={{
              background: !annualBilling ? 'var(--primary-emerald)' : 'transparent',
              color: !annualBilling ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.35rem 0.9rem',
              borderRadius: '100px',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setAnnualBilling(true)}
            style={{
              background: annualBilling ? 'var(--primary-emerald)' : 'transparent',
              color: annualBilling ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.35rem 1rem',
              borderRadius: '100px',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            Annual (Save 25%)
          </button>
        </div>

        <div className={styles.grid3}>
          {[
            {
              name: 'Starter Kiosk',
              desc: 'Perfect for single-station cafes & quick-bite kiosks.',
              monthly: 1999,
              annual: 1499,
              featured: false,
              features: [
                'Unlimited Cloud POS & Receipts',
                'QR Dynamic Menu & Ordering',
                'Basic Kitchen KOT Display',
                'Daily Revenue Analytics',
                'Email Support (Standard SLA)',
              ],
            },
            {
              name: 'Growth Pro',
              desc: 'For high-volume restaurants & busy dining rooms.',
              monthly: 3999,
              annual: 2999,
              featured: true,
              badge: 'Most Popular',
              features: [
                'All Starter Features Included',
                'Full Kitchen KDS (Multi-Station)',
                'Recipe-Level Inventory & Auto-PO',
                'Customer Loyalty & CRM Rewards',
                'RASTRORATO AI Copilot & Insights',
                '24/7 Priority WhatsApp Support',
              ],
            },
            {
              name: 'Franchise Enterprise',
              desc: 'Multi-outlet chains, food courts, and commissaries.',
              monthly: 7499,
              annual: 5999,
              featured: false,
              features: [
                'Everything in Growth Pro',
                'Multi-Tenant Super Admin Console',
                'Central Commissary Recipe Sync',
                'Custom White-Label QR Branding',
                'Dedicated Account Strategist',
                '99.99% Guaranteed SLA Uptime',
              ],
            },
          ].map(p => (
            <div
              key={p.name}
              className={`${styles.pricingCard} ${p.featured ? styles.pricingCardFeatured : ''}`}
            >
              {p.badge && (
                <div className={styles.pricingBadge}>
                  {p.badge}
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{p.name}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{p.desc}</p>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                    ₹{annualBilling ? p.annual.toLocaleString() : p.monthly.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      <Check size={16} color="var(--primary-emerald)" style={{ flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/register')}
                className={p.featured ? styles.btnPrimary : styles.btnSecondary}
                style={{ width: '100%', marginTop: '2rem', padding: '0.75rem', fontSize: '0.88rem' }}
              >
                Start 14-Day Free Trial
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 11. SECTION: FREQUENTLY ASKED QUESTIONS (FAQ) ─── */}
      <section id="faq" className={styles.sectionWrapperCenter} style={{ maxWidth: '850px', paddingTop: 0 }}>
        <div className={styles.sectionBadge}>
          CLEAR ANSWERS
        </div>
        <h2 className={styles.sectionTitle}>
          Frequently Asked Questions
        </h2>
        <p className={styles.sectionSubtitle} style={{ marginBottom: '2.5rem' }}>
          Have questions before switching? Here is everything you need to know about migrating to RASTRORATO.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
          {[
            {
              q: 'How long does it take to set up and go live with RASTRORATO?',
              a: 'Most cafes and restaurants go live in under 10 minutes. Our automated AI menu scanner digitizes your existing physical paper menu in seconds, and our team is on standby to assist with table QR printing and staff training.',
            },
            {
              q: 'Do I need to buy expensive proprietary POS hardware?',
              a: 'No! RASTRORATO is 100% hardware-agnostic. It runs seamlessly on iPads, Android tablets, Windows PCs, and Mac laptops. It connects natively with standard USB, Bluetooth, and Wi-Fi thermal receipt printers.',
            },
            {
              q: 'Can RASTRORATO operate if my internet goes down?',
              a: 'Yes. RASTRORATO includes offline local resilience mode. Waiters can continue taking orders and printing KOTs locally, and all data automatically synchronizes with the cloud once your connection is restored.',
            },
            {
              q: 'How does 0% commission QR dine-in ordering work?',
              a: 'Guests scan a dynamic QR code placed on their table using their phone camera. They browse your digital menu, customize items, and pay directly via UPI (Google Pay, PhonePe, Paytm). The revenue lands 100% in your bank account with zero middleman commissions.',
            },
          ].map((faq, index) => (
            <div key={faq.q} className={styles.faqItem}>
              <button
                className={styles.faqBtn}
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <span>{faq.q}</span>
                {openFaq === index ? <ChevronUp size={18} color="var(--primary-emerald)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
              </button>
              {openFaq === index && (
                <div style={{ padding: '0 1.4rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 12. CONTRAST-RICH LUXURY FOOTER ─── */}
      <footer style={{
        backgroundColor: '#090d16',
        color: '#94a3b8',
        padding: 'clamp(3rem, 6vw, 4.5rem) 5% 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div className={styles.footerGrid} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '2.5rem' }}>
            
            {/* Col 1: Brand Info */}
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <BrandLogo theme="dark" onClick={() => navigate('/')} showSubtitle={true} />
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.65', color: '#cbd5e1', maxWidth: '300px', marginBottom: '1.25rem' }}>
                The next-generation operating system empowering high-growth restaurants with cloud POS, real-time KDS, and intelligent AI forecasting.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(5, 150, 105, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                  ● System Operational (99.99%)
                </span>
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div>
              <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Platform Suite</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/features/pos-billing')}>Cloud POS Billing</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/features/kitchen-ops')}>Kitchen KDS</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/features/inventory')}>Recipe Inventory & POs</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/features/crm-loyalty')}>QR Table Dining</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/features/ai-copilot')}>RASTRORATO AI</span>
              </div>
            </div>

            {/* Col 3: Company */}
            <div>
              <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/about')}>About RASTRORATO</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/careers')}>Careers & Team</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/press-kit')}>Press & Media Kit</span>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact Support</span>
              </div>
            </div>

            {/* Col 4: Fast CTA */}
            <div>
              <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Get Started</div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1rem' }}>
                Ready to transform your restaurant operations? Start your free 14-day trial today.
              </p>
              <button
                onClick={() => navigate('/register')}
                className={styles.btnPrimary}
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.84rem' }}
              >
                Launch Free Trial <ArrowRight size={14} />
              </button>
            </div>

          </div>

          {/* Bottom Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', fontSize: '0.78rem', flexWrap: 'wrap', gap: '1rem' }}>
            <span>© {new Date().getFullYear()} RASTRORATO Technologies Inc. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Terms of Service</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Security Overview</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ─── 13. FLOATING AI PRODUCT CONCIERGE CHATBOT ─── */}
      <LandingChatbot />

    </div>
  );
}

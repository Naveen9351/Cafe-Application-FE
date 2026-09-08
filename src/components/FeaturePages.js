import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Zap, BarChart3, Receipt, Sparkles, ArrowRight, ShieldCheck, Layers, Cpu, Store, QrCode } from 'lucide-react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

const SectionBadge = ({ children }) => (
  <div className="badge-pill badge-blue" style={{ marginBottom: 16 }}>
    {children}
  </div>
);

const FeatureCheck = ({ children }) => (
  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, listStyle: 'none' }}>
    <CheckCircle style={{ width: 16, height: 16, color: 'var(--color-emerald)', flexShrink: 0, marginTop: 2 }} />
    <span>{children}</span>
  </li>
);

const HeroBanner = ({ badge, title, desc, image }) => {
  const navigate = useNavigate();
  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 70, paddingLeft: 20, paddingRight: 20, textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-mesh-hero)' }}>
      {image && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
          <img src={image} alt="Feature Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <SectionBadge>{badge}</SectionBadge>
        <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: '0 auto', lineHeight: 1.6 }}>
          {desc}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 12 }}>
          <button
            onClick={() => navigate('/demo')}
            className="btn-electric"
            style={{ padding: '12px 24px', fontSize: 13 }}
          >
            <span>Schedule Live Demo</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-white"
            style={{ padding: '12px 24px', fontSize: 13 }}
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </section>
  );
};

/* ── 1. POS BILLING PAGE ── */
export function POSBillingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />
      <HeroBanner
        badge="Cloud POS Terminal"
        title="Lightning-Fast Restaurant Billing in Indian Rupees (₹)"
        desc="Designed for rapid counter queues and fine-dining table management with instant UPI, split bills, and thermal printer integration."
        image="https://images.unsplash.com/photo-1556742049-0a67e557b447?auto=format&fit=crop&w=1200&q=80"
      />
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card-luxury" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Key Capabilities</h3>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck>Table & Seat Splitting with 1-click recalculation</FeatureCheck>
              <FeatureCheck>Instant UPI QR code generation on bill chits</FeatureCheck>
              <FeatureCheck>Staff PIN login with role-based cashier permissions</FeatureCheck>
              <FeatureCheck>Offline billing protection for uninterrupted operations</FeatureCheck>
            </ul>
          </div>
          <div className="card-luxury" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'monospace' }}>0.4s</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>Checkout Velocity</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              Ring up orders, apply discount coupons, and issue GST compliant receipts in seconds.
            </p>
          </div>
        </div>
      </section>
      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 2. KITCHEN OPS PAGE ── */
export function KitchenOpsPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />
      <HeroBanner
        badge="Multi-Station KDS"
        title="100% Paperless Multi-Station Kitchen Coordination"
        desc="Eliminate lost tickets and organize prep lines across Grill, Bar, Fryer, and Bakery stations with dynamic SLA urgency timers."
        image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
      />
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card-luxury" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Kitchen Display Features</h3>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck>Color-coded 4-stage ticket lifecycle (New, Prep, Ready, Served)</FeatureCheck>
              <FeatureCheck>Audio chiming alerts for urgent delay thresholds</FeatureCheck>
              <FeatureCheck>Expo station verification before runner dispatch</FeatureCheck>
              <FeatureCheck>Live course firing & synchronized table plating</FeatureCheck>
            </ul>
          </div>
          <div className="card-luxury" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-indigo)', fontFamily: 'monospace' }}>&lt; 50ms</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>Ticket Latency</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              Orders from guest phone QR codes hit kitchen screens instantaneously without waiter delay.
            </p>
          </div>
        </div>
      </section>
      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 3. INVENTORY PAGE ── */
export function InventoryPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />
      <HeroBanner
        badge="Recipe Inventory Engine"
        title="Recipe-Level Raw Ingredient Stock Depletion"
        desc="Track every gram of cheese, coffee beans, and meat automatically with every bill punched. Zero manual end-of-day guesswork."
        image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
      />
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card-luxury" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Inventory Capabilities</h3>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck>Sub-ingredient Bill of Materials (BOM) linked to each dish</FeatureCheck>
              <FeatureCheck>Low-stock WhatsApp triggers sent to procurement</FeatureCheck>
              <FeatureCheck>Automated Purchase Order (PO) creation for vendors</FeatureCheck>
              <FeatureCheck>Batch expiry tracking and variance loss analytics</FeatureCheck>
            </ul>
          </div>
          <div className="card-luxury" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-emerald)', fontFamily: 'monospace' }}>0%</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>Unaccounted Variance</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              Stop pilferage and stock-outs with automated perpetual inventory accounting.
            </p>
          </div>
        </div>
      </section>
      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 4. CRM & LOYALTY PAGE ── */
export function CRMLoyaltyPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />
      <HeroBanner
        badge="WhatsApp CRM & Loyalty"
        title="Automated Guest Retention & Return Visit Engine"
        desc="Turn first-time diners into loyal regulars with WhatsApp bill delivery, personalized cashback rewards, and automated visit reminders."
        image="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"
      />
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card-luxury" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Marketing & Retention</h3>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck>Automatic contact capture during digital table check-out</FeatureCheck>
              <FeatureCheck>Personalized birthday perks sent via WhatsApp</FeatureCheck>
              <FeatureCheck>Win-back campaigns triggered when guests are inactive</FeatureCheck>
              <FeatureCheck>Custom digital stamp cards & points wallet in ₹</FeatureCheck>
            </ul>
          </div>
          <div className="card-luxury" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'monospace' }}>+38%</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>Repeat Visit Frequency</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              Engage customers where they already are — directly inside WhatsApp.
            </p>
          </div>
        </div>
      </section>
      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 5. AI COPILOT PAGE ── */
export function AICopilotPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />
      <HeroBanner
        badge="Autonomous Intelligence"
        title="Predictive AI Demand & Margin Optimization"
        desc="Harness historical sales data, weather forecasts, and local trends to predict prep volumes and maximize kitchen profitability."
        image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
      />
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="card-luxury" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>AI Intelligence Core</h3>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck>Daily prep sheet recommendations based on historical trends</FeatureCheck>
              <FeatureCheck>Dynamic digital menu upselling suggestions for higher check size</FeatureCheck>
              <FeatureCheck>Deadstock alerts before fresh ingredients reach expiry</FeatureCheck>
              <FeatureCheck>Real-time gross margin and food cost percentage monitor</FeatureCheck>
            </ul>
          </div>
          <div className="card-luxury" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'monospace' }}>+24%</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>Average Order Uplift</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              AI pairing engine suggests relevant beverage and dessert additions seamlessly.
            </p>
          </div>
        </div>
      </section>
      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

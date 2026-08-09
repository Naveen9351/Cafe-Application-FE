import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, UtensilsCrossed, ChevronRight, Zap, BarChart3, Receipt } from 'lucide-react';


const OLIVE = '#3a5a2a';
const OLIVE_LIGHT = '#e8f0e0';
const CREAM = '#f5f2eb';
const BORDER = '#e2ddd6';
const WHITE = '#ffffff';
const TEXT_DARK = '#111111';
const TEXT_MID = '#444444';
const TEXT_SOFT = '#888888';

const SectionBadge = ({ children }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: OLIVE_LIGHT, color: OLIVE, fontWeight: '700', fontSize: '0.7rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0.35rem 0.9rem', borderRadius: '100px', marginBottom: '1.25rem' }}>
    {children}
  </div>
);

const FeatureCheck = ({ children }) => (
  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.9rem', color: TEXT_MID, marginBottom: '0.85rem', lineHeight: '1.5', listStyle: 'none' }}>
    <CheckCircle size={16} style={{ color: OLIVE, flexShrink: 0, marginTop: '2px' }} />
    <span>{children}</span>
  </li>
);

const PageNav = () => {
  const navigate = useNavigate();
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6%', height: '64px', backgroundColor: WHITE, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem', color: TEXT_DARK }} onClick={() => navigate('/')}>
        <div style={{ width: '28px', height: '28px', backgroundColor: OLIVE, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UtensilsCrossed size={16} color={WHITE} />
        </div>
        FeastSpot
      </div>
      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.88rem', fontWeight: '600', color: TEXT_MID }}>
        {[['POS Billing', '/features/pos-billing'], ['Kitchen Ops', '/features/kitchen-ops'], ['Inventory', '/features/inventory'], ['CRM & Loyalty', '/features/crm-loyalty'], ['AI Copilot', '/features/ai-copilot']].map(([label, path]) => (
          <span key={label} onClick={() => navigate(path)} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = OLIVE} onMouseOut={e => e.target.style.color = TEXT_MID}>{label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK, cursor: 'pointer' }}>Login</button>
        <button onClick={() => navigate('/register')} style={{ backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.88rem', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer' }}>Start Free Trial</button>
      </div>
    </nav>
  );
};

const PageFooter = () => {
  const navigate = useNavigate();
  return (
    <footer style={{ backgroundColor: '#0d0d0d', color: '#94a3b8', padding: '3rem 6% 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', paddingBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1.05rem', color: WHITE, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: '26px', height: '26px', backgroundColor: OLIVE, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UtensilsCrossed size={14} color={WHITE} /></div>
          FeastSpot
        </div>
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
          {[['Features', '/features/pos-billing'], ['POS Billing', '/features/pos-billing'], ['Kitchen Ops', '/features/kitchen-ops'], ['Inventory', '/features/inventory'], ['AI Copilot', '/features/ai-copilot']].map(([l, p]) => (
            <span key={l} onClick={() => navigate(p)} style={{ color: '#94a3b8', fontSize: '0.83rem', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.target.style.color = WHITE} onMouseOut={e => e.target.style.color = '#94a3b8'}>{l}</span>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
        © {new Date().getFullYear()} FeastSpot. All rights reserved.
      </div>
    </footer>
  );
};

const HeroBanner = ({ badge, title, subtitle, desc }) => {
  const navigate = useNavigate();
  return (
    <section style={{ backgroundColor: CREAM, padding: '5rem 6%', textAlign: 'center' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <SectionBadge>{badge}</SectionBadge>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: TEXT_DARK, marginBottom: '0.75rem', lineHeight: '1.15', letterSpacing: '-1px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '1.2rem', fontWeight: '700', color: OLIVE, marginBottom: '1rem' }}>{subtitle}</p>}
        <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65', marginBottom: '2rem', maxWidth: '640px', margin: '0 auto 2rem' }}>{desc}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '8px', cursor: 'pointer' }}>
            Start Free Trial <ChevronRight size={16} />
          </button>
          <button onClick={() => navigate('/demo')} style={{ backgroundColor: 'transparent', color: TEXT_DARK, border: `2px solid ${BORDER}`, fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '8px', cursor: 'pointer' }}>
            Book a Demo
          </button>
        </div>
      </div>
    </section>
  );
};

/* ── POS BILLING PAGE ── */
export function POSBillingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <HeroBanner badge="Unified POS Terminal" title="A POS That Actually Gets Out of Your Way" desc="Speed up order entry, slash queue friction, and keep cash flows completely transparent. Our ultra-minimalist POS fits any hardware setup." />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          <div>
            <SectionBadge>Core POS Features</SectionBadge>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1.25rem' }}>Everything your cashier needs in one screen</h2>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Integrated POS Terminal</strong> — Choose dishes, apply instant discounts, manage walk-in or phone orders with zero lag.</FeatureCheck>
              <FeatureCheck><strong>Active Table Manager</strong> — Track table billing states and finalize splits or combined invoices cleanly.</FeatureCheck>
              <FeatureCheck><strong>Custom Discount Engine</strong> — Create percentage or flat discounts, apply coupon codes, and run special offer windows.</FeatureCheck>
              <FeatureCheck><strong>Multi-payment Options</strong> — Accept cash, UPI, card, and split payments with automatic receipt generation.</FeatureCheck>
              <FeatureCheck><strong>Category Management</strong> — Organize the menu by custom categories visible in order input panels.</FeatureCheck>
            </ul>
            <button onClick={() => navigate('/register')} style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '8px', cursor: 'pointer' }}>
              Try POS Free <ChevronRight size={16} />
            </button>
          </div>
          {/* POS Mockup */}
          <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: '800', fontSize: '0.95rem', color: TEXT_DARK }}>POS Terminal</span>
              <span style={{ backgroundColor: OLIVE_LIGHT, color: OLIVE, fontWeight: '700', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '100px' }}>3 items</span>
            </div>
            {[
              { img: 'https://images.unsplash.com/photo-1571934811356-5cc561b6821f?w=60&h=60&fit=crop', name: 'Cutting Masala Chai', price: '₹400' },
              { img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=60&h=60&fit=crop', name: 'Classic Espresso Brownie', price: '₹250' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: WHITE, borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <img src={item.img} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>Qty 1</div>
                </div>
                <div style={{ fontWeight: '800', color: TEXT_DARK }}>{item.price}</div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: TEXT_MID, marginBottom: '4px' }}><span>Subtotal</span><span>₹660</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: TEXT_MID, marginBottom: '8px' }}><span>GST (5%)</span><span>₹33.50</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1rem' }}><span>Total Bill</span><span>₹682.50</span></div>
              <button style={{ width: '100%', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.9rem', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}>Print & Settle Bill</button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { stat: '3x', desc: 'Faster order entry vs paper-based billing' },
            { stat: '99.9%', desc: 'System uptime with automatic cloud backup' },
            { stat: '₹0', desc: 'Extra hardware cost — works with any tablet or laptop' },
          ].map(s => (
            <div key={s.stat} style={{ textAlign: 'center', backgroundColor: CREAM, borderRadius: '14px', padding: '2rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: OLIVE, marginBottom: '0.5rem' }}>{s.stat}</div>
              <div style={{ fontSize: '0.9rem', color: TEXT_MID, lineHeight: '1.5' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── KITCHEN OPS PAGE ── */
export function KitchenOpsPage() {
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <HeroBanner badge="Kitchen Ops" title="From Order to Plate — In Real Time" desc="Bridge the communication gap between servers and chefs. Keep cooking times tight and guests happily informed with zero paper ticket dependency." />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          {/* KOT Mockup */}
          <div style={{ backgroundColor: WHITE, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: TEXT_DARK }}>KOT Monitor</div>
                <div style={{ fontSize: '0.72rem', color: TEXT_SOFT }}>Active Orders In Prep</div>
              </div>
              <span style={{ backgroundColor: '#ffeded', color: '#cc3333', fontWeight: '700', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '100px' }}>2 Delay Alerts</span>
            </div>
            {[
              { table: 'Table 12 (Order #302)', time: '9 mins elapsed', items: ['1x Avocado Garden Sandwich (No Mayo)', '2x Classic Cappuccino (Extra foam)'] },
              { table: 'Table 02 (Order #305)', time: '3 mins elapsed', items: ['1x Classic Espresso Brownie'] },
              { table: 'Table 07 (Order #307)', time: '1 min elapsed', items: ['2x Masala Chai', '1x Veg Wrap'] },
            ].map(o => (
              <div key={o.table} style={{ backgroundColor: CREAM, borderRadius: '10px', padding: '0.9rem', marginBottom: '0.75rem', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: TEXT_DARK }}>{o.table}</span>
                  <span style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>{o.time}</span>
                </div>
                {o.items.map(i => <div key={i} style={{ fontSize: '0.78rem', color: TEXT_MID, marginBottom: '2px' }}>• {i}</div>)}
              </div>
            ))}
          </div>
          <div>
            <SectionBadge>Kitchen Features</SectionBadge>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1.25rem' }}>Give your kitchen team a superpower</h2>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck><strong>KOT Monitor Dashboard</strong> — Real-time dashboard designed specifically for kitchen staff with touch-action fulfillment tags.</FeatureCheck>
              <FeatureCheck><strong>Preparation Timer Integration</strong> — Auto-calculate average prep times per dish and push delay warning notifications.</FeatureCheck>
              <FeatureCheck><strong>WebSocket Real-time Sync</strong> — Zero-latency synchronization of new orders between customer scans and kitchen.</FeatureCheck>
              <FeatureCheck><strong>Delay Alert System</strong> — Automatic alerts when orders exceed prep thresholds, notifying servers and managers.</FeatureCheck>
              <FeatureCheck><strong>Order Prioritization</strong> — Color-coded order cards based on urgency and time elapsed.</FeatureCheck>
            </ul>
          </div>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── INVENTORY PAGE ── */
export function InventoryPage() {
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <HeroBanner badge="Inventory Control" title="Never Run Out. Never Overstock." desc="Streamline restaurant margins with precision stock maps and automated purchasing triggered by real usage patterns." />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', marginBottom: '5rem' }}>
          {[
            { icon: '📋', title: 'Recipe Mapping', desc: 'Link every menu item to exact raw ingredient quantities. Inventory auto-deducts as plates leave the kitchen.', features: ['Multi-ingredient recipes', 'Portion-level tracking', 'Automatic cost calculation'] },
            { icon: '📦', title: 'Real-time Stock Tracking', desc: 'Eliminate manual stock-taking. Live dashboard shows current inventory levels at a glance.', features: ['Low-stock threshold alerts', 'Supplier-wise tracking', 'Daily consumption reports'] },
            { icon: '🛒', title: 'Automated Purchase Orders', desc: 'Set replenishment triggers and let FeastSpot auto-draft POs to your pre-configured suppliers.', features: ['Auto-triggered reorders', 'Supplier contact database', 'PO approval workflow'] },
          ].map(c => (
            <div key={c.title} style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '2rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{c.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.75rem' }}>{c.title}</h3>
              <p style={{ fontSize: '0.87rem', color: TEXT_MID, lineHeight: '1.55', marginBottom: '1.25rem' }}>{c.desc}</p>
              <ul style={{ padding: 0, margin: 0 }}>
                {c.features.map(f => <FeatureCheck key={f}>{f}</FeatureCheck>)}
              </ul>
            </div>
          ))}
        </div>
        {/* Stock Alert Mockup */}
        <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '2rem', border: `1px solid ${BORDER}`, maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem', color: TEXT_DARK, marginBottom: '1.25rem' }}>Live Stock Dashboard</div>
          {[
            { name: 'Full Cream Milk', level: 78, status: 'OK' },
            { name: 'Coffee Beans (Arabica)', level: 22, status: 'Low' },
            { name: 'Whole Wheat Bread', level: 5, status: 'Critical' },
            { name: 'Fresh Tomatoes', level: 60, status: 'OK' },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: WHITE, borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK }}>{s.name}</div>
                <div style={{ height: '6px', backgroundColor: '#e2ddd6', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.level}%`, backgroundColor: s.status === 'OK' ? OLIVE : s.status === 'Low' ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: s.status === 'OK' ? OLIVE : s.status === 'Low' ? '#d97706' : '#dc2626', backgroundColor: s.status === 'OK' ? OLIVE_LIGHT : s.status === 'Low' ? '#fef3c7' : '#fee2e2', padding: '3px 8px', borderRadius: '100px', flexShrink: 0 }}>{s.status}</span>
            </div>
          ))}
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── CRM & LOYALTY PAGE ── */
export function CRMLoyaltyPage() {
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <HeroBanner badge="CRM & Loyalty" title="Know Your Regulars. Reward Their Loyalty." desc="Build lasting visitor relationships with a built-in guest ledger, smart milestone metrics, and automated rewards that bring customers back." />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start', marginBottom: '5rem' }}>
          <div>
            <SectionBadge>Customer Intelligence</SectionBadge>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1.25rem' }}>Turn first-time visitors into lifelong fans</h2>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Centralized Customer Database</strong> — Store contact profiles, order histories, diet tags, and lifetime billing totals.</FeatureCheck>
              <FeatureCheck><strong>Loyalty Points & Rewards</strong> — Configure automated reward rules. Award custom points per spend redeemable at QR checkout.</FeatureCheck>
              <FeatureCheck><strong>Targeted Segmentation Campaigns</strong> — Filter inactive guests (no visits in 30 days) and send specific custom offers.</FeatureCheck>
              <FeatureCheck><strong>Visit Frequency Tracking</strong> — Identify your top 10% customers and build personalized offers just for them.</FeatureCheck>
              <FeatureCheck><strong>SMS & Email Promotions</strong> — Deploy structured marketing updates, seasonal offers, and happy hour schedules.</FeatureCheck>
            </ul>
          </div>
          {/* CRM Mockup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: TEXT_DARK, marginBottom: '1rem' }}>VIP Customer Segment</div>
              {[
                { initials: 'SJ', name: 'Sarah Jenkins', meta: '18 visits • Total spent: ₹7,400', pts: '1,480 pts' },
                { initials: 'DS', name: 'Deepak Sharma', meta: '14 visits • Total spent: ₹9,800', pts: '1,960 pts' },
                { initials: 'PM', name: 'Priya Mehta', meta: '11 visits • Total spent: ₹5,200', pts: '1,040 pts' },
              ].map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', backgroundColor: WHITE, borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: OLIVE, color: WHITE, fontWeight: '800', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: TEXT_SOFT }}>{c.meta}</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: OLIVE }}>{c.pts}</div>
                  <span style={{ backgroundColor: OLIVE, color: WHITE, fontSize: '0.62rem', fontWeight: '800', padding: '2px 7px', borderRadius: '5px' }}>VIP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── AI COPILOT PAGE ── */
export function AICopilotPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <HeroBanner badge="Feast AI" title="AI That Runs Your Restaurant While You Sleep" desc="Leverage smart algorithms to optimize pricing structures, auto-generate purchase schedules, and craft beautiful photo menus with zero manual effort." />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { icon: '🤖', title: "AI Copilot 'Ask Feast AI'", desc: 'An intelligent advisor integrated into your dashboard. Analyses historical trends, flags upcoming supply dips, detects quiet periods, and recommends re-engagement promotions.' },
              { icon: '📷', title: 'AI Menu Scanner & Extractor', desc: 'Transform physical menus to your digital board in seconds. Simply upload a photo; our vision model extracts items, prices, descriptions, and formats categories instantly.' },
              { icon: '🖼️', title: 'AI Photo Enrichment', desc: 'Transform simple text listings into gourmet sensory assets. Fetch, generate, or stylize food photography tailored to your exact dish listings automatically.' },
            ].map(f => (
              <div key={f.title} style={{ backgroundColor: CREAM, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: TEXT_DARK, margin: 0 }}>{f.title}</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.55', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          {/* AI Copilot Mockup */}
          <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}`, position: 'sticky', top: '80px' }}>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: TEXT_DARK, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 Feast AI Copilot
            </div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: TEXT_SOFT, fontWeight: '700', marginBottom: '1rem' }}>Daily Forecast</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { text: 'Chai sales predicted to spike 30% today — rainy weather incoming. Top up milk inventory.', type: 'forecast' },
                { text: 'Tuesday 6–8pm revenue is 18% below weekly average. Launch "Evening Treats" campaign.', type: 'insight' },
                { text: 'Arabica coffee beans will run out in ~2 days based on current consumption rate.', type: 'alert' },
              ].map((msg, i) => (
                <div key={i} style={{ backgroundColor: WHITE, borderRadius: '10px', padding: '0.85rem', border: `1px solid ${BORDER}`, fontSize: '0.82rem', color: TEXT_MID, lineHeight: '1.45' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: OLIVE, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{msg.type}</div>
                  {msg.text}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/register')} style={{ width: '100%', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.88rem', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}>
              Activate Feast AI Copilot
            </button>
          </div>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── BOOK A DEMO PAGE ── */
export function BookDemoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', cafe: '', size: '1-10' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
          {/* Left: Info */}
          <div>
            <SectionBadge>Live Product Demo</SectionBadge>
            <h1 style={{ fontSize: '2.6rem', fontWeight: '900', color: TEXT_DARK, marginBottom: '1rem', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
              See FeastSpot Live in Action
            </h1>
            <p style={{ color: TEXT_MID, fontSize: '1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
              Book a 30-minute personalised demo with our product team. We'll walk you through the full platform — POS, kitchen monitor, AI copilot, and more.
            </p>
            <ul style={{ padding: 0, margin: 0, marginBottom: '2rem' }}>
              <FeatureCheck>Personalized walkthrough of features relevant to your cafe type</FeatureCheck>
              <FeatureCheck>Live Q&A with our product experts</FeatureCheck>
              <FeatureCheck>Pricing and migration support discussion</FeatureCheck>
              <FeatureCheck>No commitment — cancel any time</FeatureCheck>
            </ul>
            <div style={{ backgroundColor: CREAM, borderRadius: '12px', padding: '1.25rem 1.5rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK, marginBottom: '0.5rem' }}>What you get after the demo:</div>
              <div style={{ fontSize: '0.83rem', color: TEXT_MID, lineHeight: '1.6' }}>✅ 14-day free trial access<br />✅ Free menu setup assistance<br />✅ Dedicated onboarding support</div>
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ backgroundColor: CREAM, borderRadius: '20px', padding: '2.5rem', border: `1px solid ${BORDER}` }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.75rem' }}>Demo Booked!</h2>
                <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>Our team will reach out within 24 hours to schedule your personalized walkthrough.</p>
                <button onClick={() => navigate('/')} style={{ backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Back to Home</button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1.75rem' }}>Schedule Your Free Demo</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Full Name', field: 'name', type: 'text', placeholder: 'e.g. Deepak Sharma' },
                    { label: 'Work Email', field: 'email', type: 'email', placeholder: 'you@restaurant.com' },
                    { label: 'Phone Number', field: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                    { label: 'Cafe / Restaurant Name', field: 'cafe', type: 'text', placeholder: 'e.g. Deepak\'s Bistro' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_DARK, marginBottom: '0.4rem' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={form[f.field]}
                        onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                        style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: WHITE, color: TEXT_DARK, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_DARK, marginBottom: '0.4rem' }}>Number of Tables</label>
                    <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}
                      style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: WHITE, color: TEXT_DARK }}>
                      <option value="1-10">1–10 Tables (Small Cafe)</option>
                      <option value="11-30">11–30 Tables (Medium Restaurant)</option>
                      <option value="31+">31+ Tables (Large / Multi-outlet)</option>
                    </select>
                  </div>
                  <button type="submit" style={{ backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '1rem', padding: '0.9rem', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 14px rgba(58,90,42,0.25)' }}>
                    Book My Free Demo →
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

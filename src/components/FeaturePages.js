import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, Zap, BarChart3, Receipt, Sparkles } from 'lucide-react';
import BrandLogo from './BrandLogo';

const OLIVE = '#059669';
const OLIVE_LIGHT = 'rgba(16, 185, 129, 0.15)';
const BG_DARK = '#0b0f19';
const CARD_DARK = 'rgba(17, 24, 39, 0.7)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const WHITE = '#ffffff';
const TEXT_DARK = '#f8fafc';
const TEXT_MID = '#94a3b8';
const TEXT_SOFT = '#64748b';

const SectionBadge = ({ children }) => (
  <span style={{ display: 'inline-block', backgroundColor: OLIVE_LIGHT, color: '#34d399', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.35rem 0.85rem', borderRadius: '100px', marginBottom: '1rem', border: '1px solid rgba(16,185,129,0.3)' }}>
    {children}
  </span>
);

const FeatureCheck = ({ children }) => (
  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.9rem', color: TEXT_MID, marginBottom: '0.85rem', lineHeight: '1.5', listStyle: 'none' }}>
    <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
    <span>{children}</span>
  </li>
);

const PageNav = () => {
  const navigate = useNavigate();
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6%', height: '70px', backgroundColor: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <BrandLogo size="md" showSubtitle={true} onClick={() => navigate('/')} />
      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.88rem', fontWeight: '600', color: TEXT_MID }}>
        {[['POS Billing', '/features/pos-billing'], ['Kitchen Ops', '/features/kitchen-ops'], ['Inventory', '/features/inventory'], ['CRM & Loyalty', '/features/crm-loyalty'], ['RASTRORATO AI', '/features/ai-copilot']].map(([label, path]) => (
          <span key={label} onClick={() => navigate(path)} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#34d399'} onMouseOut={e => e.target.style.color = TEXT_MID}>{label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', fontWeight: '700', fontSize: '0.88rem', color: WHITE, cursor: 'pointer' }}>Sign In</button>
        <button onClick={() => navigate('/register')} style={{ backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.88rem', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>Start Free Trial</button>
      </div>
    </nav>
  );
};

const PageFooter = () => {
  const navigate = useNavigate();
  return (
    <footer style={{ backgroundColor: '#06090f', color: '#94a3b8', padding: '4rem 6% 2rem', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', paddingBottom: '2.5rem', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '2rem' }}>
        <BrandLogo size="sm" showSubtitle={true} onClick={() => navigate('/')} />
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
          {[['Features', '/features/pos-billing'], ['POS Billing', '/features/pos-billing'], ['Kitchen Ops', '/features/kitchen-ops'], ['Inventory', '/features/inventory'], ['RASTRORATO AI', '/features/ai-copilot']].map(([l, p]) => (
            <span key={l} onClick={() => navigate(p)} style={{ color: '#94a3b8', fontSize: '0.86rem', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.target.style.color = WHITE} onMouseOut={e => e.target.style.color = '#94a3b8'}>{l}</span>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
        © {new Date().getFullYear()} RASTRORATO Technologies Inc. All rights reserved.
      </div>
    </footer>
  );
};

const HeroBanner = ({ badge, title, subtitle, desc, image }) => {
  const navigate = useNavigate();
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '5.5rem 6%', textAlign: 'center', backgroundColor: '#090d16', borderBottom: `1px solid ${BORDER}` }}>
      {image && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, zIndex: 0 }}>
          <img src={image} alt="Hero background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionBadge>{badge}</SectionBadge>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: WHITE, marginBottom: '0.75rem', lineHeight: '1.15', letterSpacing: '-1px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#34d399', marginBottom: '1rem' }}>{subtitle}</p>}
        <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65', marginBottom: '2rem', maxWidth: '640px', margin: '0 auto 2rem' }}>{desc}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}>
            Start Free Trial <ChevronRight size={16} />
          </button>
          <button onClick={() => navigate('/demo')} style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: WHITE, border: `1px solid ${BORDER}`, fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '10px', cursor: 'pointer' }}>
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
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <HeroBanner badge="Unified POS Terminal" title="A POS That Actually Gets Out of Your Way" desc="Speed up order entry, slash queue friction, and keep cash flows completely transparent. Our ultra-minimalist POS fits any hardware setup." image="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80" />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          <div>
            <SectionBadge>Core POS Features</SectionBadge>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: WHITE, marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>Everything your cashier needs in one screen</h2>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Integrated POS Terminal</strong> — Choose dishes, apply instant discounts, manage walk-in or phone orders with zero lag.</FeatureCheck>
              <FeatureCheck><strong>Active Table Manager</strong> — Track table billing states and finalize splits or combined invoices cleanly.</FeatureCheck>
              <FeatureCheck><strong>Custom Discount Engine</strong> — Create percentage or flat discounts, apply coupon codes, and run special offer windows.</FeatureCheck>
              <FeatureCheck><strong>Multi-payment Options</strong> — Accept cash, UPI, card, and split payments with automatic receipt generation.</FeatureCheck>
              <FeatureCheck><strong>Category Management</strong> — Organize the menu by custom categories visible in order input panels.</FeatureCheck>
            </ul>
            <button onClick={() => navigate('/register')} style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}>
              Try POS Free <ChevronRight size={16} />
            </button>
          </div>
          {/* POS Photography & Mockup */}
          <div style={{ backgroundColor: CARD_DARK, borderRadius: '20px', padding: '1.5rem', border: `1px solid rgba(16,185,129,0.25)`, boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
            <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80" alt="Cafe Counter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: WHITE }}>POS Terminal</span>
              <span style={{ backgroundColor: OLIVE_LIGHT, color: '#34d399', fontWeight: '700', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '100px' }}>Active Checkout</span>
            </div>
            {[
              { img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=60&h=60&fit=crop', name: 'Cutting Masala Chai', price: '₹400' },
              { img: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=60&h=60&fit=crop', name: 'Classic Espresso Brownie', price: '₹250' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <img src={item.img} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: WHITE }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>Qty 1</div>
                </div>
                <div style={{ fontWeight: '800', color: '#34d399' }}>{item.price}</div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: TEXT_MID, marginBottom: '4px' }}><span>Subtotal</span><span>₹650</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '900', color: WHITE, marginBottom: '1rem' }}><span>Total Bill</span><span style={{ color: '#34d399' }}>₹682.50</span></div>
              <button onClick={() => navigate('/register')} style={{ width: '100%', backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.9rem', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer' }}>Print & Settle Bill</button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { stat: '3x', desc: 'Faster order entry vs paper-based billing' },
            { stat: '99.99%', desc: 'System uptime with automatic cloud backup' },
            { stat: '₹0', desc: 'Extra hardware cost — works with any tablet or laptop' },
          ].map(s => (
            <div key={s.stat} style={{ textAlign: 'center', backgroundColor: CARD_DARK, borderRadius: '16px', padding: '2rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#34d399', marginBottom: '0.5rem' }}>{s.stat}</div>
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
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <HeroBanner badge="Kitchen Ops" title="From Order to Plate — In Real Time" desc="Bridge the communication gap between servers and chefs. Keep cooking times tight and guests happily informed with zero paper ticket dependency." image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80" />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          {/* KOT Mockup with photo */}
          <div style={{ backgroundColor: CARD_DARK, borderRadius: '20px', padding: '1.5rem', border: `1px solid rgba(16,185,129,0.25)`, boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
            <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80" alt="Chef plating" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: WHITE }}>KOT Monitor</div>
                <div style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>Active Orders In Prep</div>
              </div>
              <span style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', fontWeight: '700', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '100px' }}>2 Delay Alerts</span>
            </div>
            {[
              { table: 'Table 12 (Order #302)', time: '9 mins elapsed', items: ['1x Avocado Garden Sandwich', '2x Classic Cappuccino'] },
              { table: 'Table 02 (Order #305)', time: '3 mins elapsed', items: ['1x Classic Espresso Brownie'] },
            ].map(o => (
              <div key={o.table} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.9rem', marginBottom: '0.75rem', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: WHITE }}>{o.table}</span>
                  <span style={{ fontSize: '0.75rem', color: '#34d399' }}>{o.time}</span>
                </div>
                {o.items.map(i => <div key={i} style={{ fontSize: '0.8rem', color: TEXT_MID, marginBottom: '2px' }}>• {i}</div>)}
              </div>
            ))}
          </div>
          <div>
            <SectionBadge>Kitchen Features</SectionBadge>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: WHITE, marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>Give your kitchen team a superpower</h2>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck><strong>KOT Monitor Dashboard</strong> — Real-time dashboard designed specifically for kitchen staff with touch-action fulfillment tags.</FeatureCheck>
              <FeatureCheck><strong>Preparation Timer Integration</strong> — Auto-calculate average prep times per dish and push delay warning notifications.</FeatureCheck>
              <FeatureCheck><strong>WebSocket Real-time Sync</strong> — Zero-latency synchronization of new orders between customer scans and kitchen.</FeatureCheck>
              <FeatureCheck><strong>Delay Alert System</strong> — Automatic alerts when orders exceed prep thresholds, notifying servers and managers.</FeatureCheck>
            </ul>
            <button onClick={() => navigate('/register')} style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}>
              Equip Your Kitchen <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── INVENTORY PAGE ── */
export function InventoryPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <HeroBanner badge="Inventory Control" title="Never Run Out. Never Overstock." desc="Streamline restaurant margins with precision stock maps and automated purchasing triggered by real usage patterns." image="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80" />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', marginBottom: '5rem' }}>
          {[
            { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80', title: 'Recipe Mapping', desc: 'Link every menu item to exact raw ingredient quantities. Inventory auto-deducts as plates leave the kitchen.' },
            { img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80', title: 'Real-time Stock Tracking', desc: 'Eliminate manual stock-taking. Live dashboard shows current inventory levels at a glance with threshold alerts.' },
            { img: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=400&q=80', title: 'Automated Purchase Orders', desc: 'Set replenishment triggers and let RASTRORATO auto-draft POs to your pre-configured suppliers instantly.' },
          ].map(c => (
            <div key={c.title} style={{ backgroundColor: CARD_DARK, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '140px', width: '100%', overflow: 'hidden' }}>
                <img src={c.img} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.5rem', flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: WHITE, marginBottom: '0.75rem' }}>{c.title}</h3>
                <p style={{ fontSize: '0.87rem', color: TEXT_MID, lineHeight: '1.55', margin: 0 }}>{c.desc}</p>
              </div>
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
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <HeroBanner badge="CRM & Loyalty" title="Know Your Regulars. Reward Their Loyalty." desc="Build lasting visitor relationships with a built-in guest ledger, smart milestone metrics, and automated rewards that bring customers back." image="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80" />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          <div>
            <SectionBadge>Customer Intelligence</SectionBadge>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: WHITE, marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>Turn first-time visitors into lifelong fans</h2>
            <ul style={{ padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Centralized Customer Database</strong> — Store contact profiles, order histories, diet tags, and lifetime billing totals.</FeatureCheck>
              <FeatureCheck><strong>Loyalty Points & Rewards</strong> — Configure automated reward rules. Award custom points per spend redeemable at QR checkout.</FeatureCheck>
              <FeatureCheck><strong>Targeted Segmentation Campaigns</strong> — Filter inactive guests (no visits in 30 days) and send specific custom offers.</FeatureCheck>
            </ul>
          </div>
          <div style={{ backgroundColor: CARD_DARK, borderRadius: '20px', padding: '1.5rem', border: `1px solid rgba(16,185,129,0.25)`, boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
            <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80" alt="Cafe dining" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: WHITE, marginBottom: '0.75rem' }}>VIP Customer Segment</div>
            {[
              { name: 'Sarah Jenkins', meta: '18 visits • ₹7,400 spent', pts: '1,480 pts' },
              { name: 'Deepak Sharma', meta: '14 visits • ₹9,800 spent', pts: '1,960 pts' },
            ].map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.6rem' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: WHITE }}>{c.name}</div>
                  <div style={{ fontSize: '0.74rem', color: TEXT_SOFT }}>{c.meta}</div>
                </div>
                <span style={{ backgroundColor: OLIVE_LIGHT, color: '#34d399', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>{c.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── RASTRORATO AI PAGE ── */
export function AICopilotPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <HeroBanner badge="RASTRORATO AI" title="AI That Runs Your Restaurant While You Sleep" desc="Leverage smart algorithms to optimize pricing structures, auto-generate purchase schedules, and craft beautiful photo menus with zero manual effort." image="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80" />
      <section style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { icon: '🤖', title: "AI Copilot 'Ask RASTRORATO AI'", desc: 'An intelligent advisor integrated into your dashboard. Analyses historical trends, flags upcoming supply dips, detects quiet periods, and recommends promotions.' },
              { icon: '📷', title: 'AI Menu Scanner & Extractor', desc: 'Transform physical menus to your digital board in seconds. Simply upload a photo; our vision model extracts items, prices, and categories instantly.' },
            ].map(f => (
              <div key={f.title} style={{ backgroundColor: CARD_DARK, borderRadius: '14px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: WHITE, margin: 0 }}>{f.title}</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.55', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: CARD_DARK, borderRadius: '20px', padding: '1.5rem', border: `1px solid rgba(16,185,129,0.3)` }}>
            <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80" alt="Restaurant intelligence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: WHITE, marginBottom: '0.5rem' }}>🤖 RASTRORATO AI Live Suggestion</div>
            <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '1rem', fontSize: '0.86rem', color: '#d1fae5', lineHeight: '1.5', marginBottom: '1rem' }}>
              "Chai & Bakery sales predicted to surge 35% this Sunday. Ensure 50L milk inventory is reserved."
            </div>
            <button onClick={() => navigate('/register')} style={{ width: '100%', backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.9rem', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer' }}>
              Enable RASTRORATO AI Free
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
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <SectionBadge>Live Product Demo</SectionBadge>
            <h1 style={{ fontSize: '2.6rem', fontWeight: '900', color: WHITE, marginBottom: '1rem', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
              See RASTRORATO Live in Action
            </h1>
            <p style={{ color: TEXT_MID, fontSize: '1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
              Book a 30-minute personalised demo with our product team. We'll walk you through the full platform — POS, kitchen monitor, AI copilot, and more.
            </p>
            <div style={{ borderRadius: '14px', overflow: 'hidden', height: '180px', marginBottom: '1.5rem', border: `1px solid ${BORDER}` }}>
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80" alt="Demo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          <div style={{ backgroundColor: CARD_DARK, borderRadius: '20px', padding: '2.5rem', border: `1px solid ${BORDER}` }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: WHITE, marginBottom: '0.75rem' }}>Demo Booked!</h2>
                <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>Our team will reach out within 24 hours.</p>
                <button onClick={() => navigate('/')} style={{ backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Back to Home</button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: WHITE, marginBottom: '1.75rem' }}>Schedule Your Free Demo</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Full Name', field: 'name', type: 'text', placeholder: 'e.g. Deepak Sharma' },
                    { label: 'Work Email', field: 'email', type: 'email', placeholder: 'you@restaurant.com' },
                    { label: 'Phone Number', field: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                    { label: 'Cafe / Restaurant Name', field: 'cafe', type: 'text', placeholder: 'e.g. Deepak\'s Bistro' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_MID, marginBottom: '0.4rem' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={form[f.field]}
                        onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                        style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: 'rgba(0,0,0,0.3)', color: WHITE, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <button type="submit" style={{ backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '1rem', padding: '0.9rem', borderRadius: '10px', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
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

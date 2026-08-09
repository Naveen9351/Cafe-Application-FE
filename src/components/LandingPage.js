import { useNavigate } from 'react-router-dom';
import { CheckCircle, UtensilsCrossed, ChevronRight, Wifi } from 'lucide-react';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const OLIVE = '#3a5a2a';
const OLIVE_LIGHT = '#e8f0e0';
const CREAM = '#f5f2eb';
const CREAM_DARK = '#ede9e0';
const TEXT_DARK = '#111111';
const TEXT_MID = '#444444';
const TEXT_SOFT = '#888888';
const WHITE = '#ffffff';
const CARD_BG = '#ffffff';
const BORDER = '#e2ddd6';

const SectionBadge = ({ children }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: OLIVE_LIGHT,
    color: OLIVE,
    fontWeight: '700',
    fontSize: '0.7rem',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    padding: '0.35rem 0.9rem',
    borderRadius: '100px',
    marginBottom: '1.25rem',
  }}>
    {children}
  </div>
);

const FeatureCheck = ({ children }) => (
  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.88rem', color: TEXT_MID, marginBottom: '0.85rem', lineHeight: '1.4' }}>
    <CheckCircle size={16} style={{ color: OLIVE, flexShrink: 0, marginTop: '1px' }} />
    <span>{children}</span>
  </li>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Subscribed!');
    setEmail('');
  };

  return (
    <div style={{ backgroundColor: CREAM, color: TEXT_DARK, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", overflowX: 'hidden' }}>
      <Toaster position="top-center" />

      {/* ── NAVBAR ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 6%', height: '64px',
        backgroundColor: WHITE, borderBottom: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem' }} onClick={() => navigate('/')}>
          <div style={{ width: '28px', height: '28px', backgroundColor: OLIVE, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UtensilsCrossed size={16} color={WHITE} />
          </div>
          FeastSpot
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: '600' }}>
            <span onClick={() => navigate('/features/pos-billing')} style={{ cursor: 'pointer', color: TEXT_MID }} onMouseOver={e => e.target.style.color = OLIVE} onMouseOut={e => e.target.style.color = TEXT_MID}>POS Billing</span>
            <span onClick={() => navigate('/features/kitchen-ops')} style={{ cursor: 'pointer', color: TEXT_MID }} onMouseOver={e => e.target.style.color = OLIVE} onMouseOut={e => e.target.style.color = TEXT_MID}>Kitchen Ops</span>
            <span onClick={() => navigate('/features/inventory')} style={{ cursor: 'pointer', color: TEXT_MID }} onMouseOver={e => e.target.style.color = OLIVE} onMouseOut={e => e.target.style.color = TEXT_MID}>Inventory</span>
            <span onClick={() => navigate('/features/crm-loyalty')} style={{ cursor: 'pointer', color: TEXT_MID }} onMouseOver={e => e.target.style.color = OLIVE} onMouseOut={e => e.target.style.color = TEXT_MID}>CRM & Loyalty</span>
            <span onClick={() => navigate('/features/ai-copilot')} style={{ cursor: 'pointer', color: TEXT_MID }} onMouseOver={e => e.target.style.color = OLIVE} onMouseOut={e => e.target.style.color = TEXT_MID}>AI Copilot</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK, cursor: 'pointer' }}>
            Login
          </button>
          <button onClick={() => navigate('/register')}
            style={{ backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.88rem', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
            onMouseOver={e => e.target.style.opacity = '0.9'}
            onMouseOut={e => e.target.style.opacity = '1'}>
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 6% 4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center' }}>
        {/* Left */}
        <div>
          <SectionBadge>Ultimate Restaurant OS</SectionBadge>
          <h1 style={{ fontSize: '3.4rem', fontWeight: '900', lineHeight: '1.1', color: TEXT_DARK, marginBottom: '1.5rem', letterSpacing: '-1.5px' }}>
            Run your restaurant.<br />Not your spreadsheets.
          </h1>
          <p style={{ fontSize: '1.05rem', color: TEXT_MID, lineHeight: '1.65', marginBottom: '2.25rem', maxWidth: '520px' }}>
            FeastSpot is the all-in-one restaurant OS — POS, QR ordering, kitchen ops, inventory, CRM, loyalty, AI copilot, and aggregator integrations. All in one place.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
            <button onClick={() => navigate('/register')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', padding: '1.1rem 2.4rem', borderRadius: '100px', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 8px 30px rgba(58,90,42,0.25)', transition: '0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start 14-Day Trial
            </button>
            <button onClick={() => navigate('/demo')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', fontWeight: '700', fontSize: '0.95rem', color: TEXT_DARK, cursor: 'pointer', textDecoration: 'underline' }}>
              Book a Demo
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: TEXT_SOFT }}>No credit card required • 14-day trial</p>
        </div>

        {/* Right: Mock Dashboard */}
        <div style={{ backgroundColor: WHITE, borderRadius: '16px', border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#f8f7f4', borderBottom: `1px solid ${BORDER}`, padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'inline-block' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: TEXT_SOFT }}>FeastSpot Admin OS</span>
          </div>
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: CREAM, borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: TEXT_SOFT, fontWeight: '600', marginBottom: '4px' }}>Today's Revenue</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: TEXT_DARK }}>₹42,850</div>
            </div>
            <div style={{ backgroundColor: CREAM, borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: TEXT_SOFT, fontWeight: '600', marginBottom: '4px' }}>Active Orders</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: TEXT_DARK }}>18 Orders</div>
            </div>
          </div>
          <div style={{ margin: '0 1.25rem 1.25rem', borderRadius: '10px', overflow: 'hidden', height: '160px' }}>
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80" alt="Cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, backgroundColor: WHITE, padding: '1.25rem 6%', textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase', color: TEXT_SOFT, fontWeight: '700', marginBottom: '1rem' }}>
          500+ Restaurants Trust FeastSpot to Power Their Operations
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          {["Deepak's Bistro", "Urban Cafe", "Spice Symphony", "Taco Town", "Noodle Craft"].map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: '700', color: TEXT_MID }}>
              <UtensilsCrossed size={14} style={{ color: OLIVE }} /> {name}
            </div>
          ))}
        </div>
      </div>

      {/* ── CUSTOMER EXPERIENCE ── */}
      <section id="customer-experience" style={{ padding: '5rem 6%', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <SectionBadge>Customer Experience</SectionBadge>
        <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: TEXT_DARK, marginBottom: '1rem', letterSpacing: '-0.5px' }}>
          Delight Your Customers From the First Scan
        </h2>
        <p style={{ color: TEXT_MID, fontSize: '1rem', maxWidth: '560px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
          Create fluid, frictionless digital journeys that make visiting your restaurant absolute bliss.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { icon: '📱', title: 'Dynamic QR Menu & Ordering', desc: "Customers scan, browse, customize, and order instantly from their phone. Update prices or item availability in real-time." },
            { icon: '📅', title: 'Online Table Reservations', desc: 'Allow guests to book tables in advance directly from your website or social media profiles. Reduce wait-times and no-shows.' },
            { icon: '📧', title: 'Newsletter & Engagement', desc: 'Deploy structured marketing updates, seasonal offers, and happy hour schedules. Turn first-time drop-ins into passionate advocates.' },
          ].map((item) => (
            <div key={item.title} style={{ backgroundColor: CARD_BG, borderRadius: '14px', padding: '1.75rem', border: `1px solid ${BORDER}`, textAlign: 'left', transition: '0.2s' }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.85rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.55' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POS TERMINAL ── */}
      <section id="pos-billing" style={{ padding: '4rem 6%', backgroundColor: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <SectionBadge>Unified POS Terminal</SectionBadge>
            <h2 style={{ fontSize: '2.3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
              A POS That Actually Gets Out of Your Way
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              Speed up order entry, slash queue friction, and keep cash flows completely transparent. Our ultra-minimalist POS fits any hardware setup.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Integrated POS Terminal</strong> — Choose dishes, customize categories, apply instant discounts, and manage walk-in or phone orders with zero system lag.</FeatureCheck>
              <FeatureCheck><strong>Active Table Manager</strong> — Monitor your dining room's table layouts. Track active table billing states and finalize splits or combined invoices cleanly.</FeatureCheck>
            </ul>
          </div>
          {/* Right: POS Mockup */}
          <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>POS Terminal</span>
              <span style={{ backgroundColor: OLIVE_LIGHT, color: OLIVE, fontWeight: '700', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '100px' }}>3 items</span>
            </div>
            {[
              { img: 'https://images.unsplash.com/photo-1571934811356-5cc561b6821f?w=60&h=60&fit=crop', name: 'Cutting Masala Chai', sub: 'Qty 1', price: '₹400' },
              { img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=60&h=60&fit=crop', name: 'Classic Espresso Brownie', sub: 'Qty 1', price: '₹250' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: WHITE, borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <img src={item.img} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: TEXT_DARK }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>{item.sub}</div>
                </div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: TEXT_DARK }}>{item.price}</div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: TEXT_MID, marginBottom: '4px' }}><span>Subtotal</span><span>₹660</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: TEXT_MID, marginBottom: '4px' }}><span>GST (5%)</span><span>₹33.50</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1rem' }}><span>Total Bill</span><span>₹682.50</span></div>
              <button style={{ width: '100%', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.9rem', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}>
                Print & Settle Bill
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── KITCHEN OPS (KOT) ── */}
      <section id="kitchen-ops" style={{ padding: '4rem 6%', backgroundColor: CREAM }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left: KOT Mockup */}
          <div style={{ backgroundColor: WHITE, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>KOT Monitor</div>
                <div style={{ fontSize: '0.72rem', color: TEXT_SOFT }}>Active Orders In Prep</div>
              </div>
              <span style={{ backgroundColor: '#ffeded', color: '#cc3333', fontWeight: '700', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '100px' }}>2 Delay Alerts</span>
            </div>
            {[
              { table: 'Table 12 (Order #302)', time: '9 mins elapsed', items: ['1x Avocado Garden Sandwich (No Mayo)', '2x Classic Cappuccino (Extra foam)'] },
              { table: 'Table 02 (Order #305)', time: '3 mins elapsed', items: ['1x Classic Espresso Brownie'] },
            ].map((order) => (
              <div key={order.table} style={{ backgroundColor: CREAM, borderRadius: '10px', padding: '0.9rem', marginBottom: '0.75rem', border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: TEXT_DARK }}>{order.table}</span>
                  <span style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>{order.time}</span>
                </div>
                {order.items.map(i => <div key={i} style={{ fontSize: '0.78rem', color: TEXT_MID, marginBottom: '2px' }}>• {i}</div>)}
              </div>
            ))}
          </div>

          {/* Right */}
          <div>
            <SectionBadge>Kitchen Ops</SectionBadge>
            <h2 style={{ fontSize: '2.3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
              From Order to Plate — In Real Time
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              Bridge the communication gap between servers and chefs. Keep cooking times tight and guests happily informed with zero paper ticket dependency.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <FeatureCheck><strong>KOT Monitor Dashboard</strong> — Real-time, interactive dashboard designed specifically for kitchen staff with touch-action fulfillment tags.</FeatureCheck>
              <FeatureCheck><strong>Preparation Timer Integration</strong> — Auto-calculate average prep times per dish and push delay warning notifications directly to POS and wait staff.</FeatureCheck>
              <FeatureCheck><strong>WebSocket Real-time Sync</strong> — Zero-latency synchronization of new orders between online customer orders, floor POS terminals, and kitchen.</FeatureCheck>
            </ul>
          </div>
        </div>
      </section>

      {/* ── INVENTORY ── */}
      <section id="inventory" style={{ padding: '5rem 6%', backgroundColor: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <SectionBadge>Inventory Control</SectionBadge>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: TEXT_DARK, marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
            Never Run Out. Never Overstock.
          </h2>
          <p style={{ color: TEXT_MID, fontSize: '1rem', maxWidth: '560px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
            Streamline restaurant margins with precision stock maps and automated purchasing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { icon: '📋', title: 'Recipe Mapping', desc: 'Link every menu item to ingredients. Auto-deduct inventory values instantly as plates get ordered and settled.' },
              { icon: '📦', title: 'Real-time Stock Tracking', desc: 'Eliminate manual stock-taking. Receive alerts immediately as key supplies (milk, coffee beans) approach minimum limits.' },
              { icon: '🛒', title: 'Automated Purchase Orders', desc: 'Draft and dispatch formatted purchase orders directly to pre-configured suppliers as stock drops past replenishment thresholds.' },
            ].map(item => (
              <div key={item.title} style={{ backgroundColor: CREAM, borderRadius: '14px', padding: '1.75rem', border: `1px solid ${BORDER}`, textAlign: 'left', transition: '0.2s' }}
                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.85rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.55' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRM & LOYALTY ── */}
      <section id="crm-loyalty" style={{ padding: '4rem 6%', backgroundColor: CREAM }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <SectionBadge>CRM & Loyalty</SectionBadge>
            <h2 style={{ fontSize: '2.3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
              Know Your Regulars. Reward Their Loyalty.
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              Build lasting visitor relationships with a built-in guest ledger, smart milestone metrics, and automated rewards.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Centralized Customer Database</strong> — Store detailed contact profiles, order histories, diet custom tags, and lifetime billing totals under one unified guest log.</FeatureCheck>
              <FeatureCheck><strong>Loyalty Points & Rewards</strong> — Configure automated reward rules. Award custom points per spend that guests can redeem instantly at QR checkout.</FeatureCheck>
              <FeatureCheck><strong>Targeted Segmentation Campaigns</strong> — Filter inactive guests (no visits in 30 days) and send specific custom offers or discounts to draw them back.</FeatureCheck>
            </ul>
          </div>

          {/* Right: VIP Customer Segment Mockup */}
          <div style={{ backgroundColor: WHITE, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '1.25rem', color: TEXT_DARK }}>VIP Customer Segment</div>
            {[
              { initials: 'SJ', name: 'Sarah Jenkins', meta: '18 visits • Total spent: ₹7,400' },
              { initials: 'DS', name: 'Deepak Sharma', meta: '14 visits • Total spent: ₹9,800' },
            ].map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: CREAM, borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: OLIVE, color: WHITE, fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {c.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: TEXT_DARK }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_SOFT }}>{c.meta}</div>
                </div>
                <span style={{ backgroundColor: OLIVE, color: WHITE, fontSize: '0.65rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>VIP</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section id="ai-copilot" style={{ padding: '5rem 6%', backgroundColor: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <SectionBadge>Feast AI</SectionBadge>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: TEXT_DARK, marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
              AI That Runs Your Restaurant<br />While You Sleep
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '1rem', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
              Leverage smart algorithms to optimize pricing structures, auto-generate purchase schedules, and craft beautiful photo menus.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            {/* Left: AI feature cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { title: "AI Copilot 'Ask Feast AI'", desc: 'An intelligent advisor integrated into your dashboard. Analyses historical trends, flags upcoming supply dips, detects quiet periods, and recommends re-engagement promotions.' },
                { title: 'AI Menu Scanner & Extractor', desc: 'Transform physical menus to your digital board in seconds. Simply upload a photo; our vision model extracts items, prices, descriptions, and formats categories instantly.' },
                { title: 'AI Photo Enrichment', desc: 'Transform simple text listings into gourmet sensory assets. Fetch, generate, or stylize food photography tailored to your exact dish listings automatically.' },
              ].map(f => (
                <div key={f.title} style={{ backgroundColor: CREAM, borderRadius: '12px', padding: '1.25rem 1.5rem', border: `1px solid ${BORDER}` }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.4rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: TEXT_MID, lineHeight: '1.5', margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Right: AI Copilot Mockup */}
            <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🤖</span> Feast AI Copilot
              </div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: TEXT_SOFT, fontWeight: '700', marginBottom: '0.75rem' }}>Daily Forecast</div>
              <div style={{ backgroundColor: WHITE, borderRadius: '10px', padding: '1rem', marginBottom: '1rem', border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                  "Chai sales are predicted to spike by 30% today due to local rainy weather. Ensure milk inventory is topped up."
                </p>
              </div>
              <button onClick={() => toast.success('Milk PO of 50L triggered!')}
                style={{ width: '100%', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer' }}>
                Autofill Milk PO (50 Liters)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── AGGREGATORS ── */}
      <section id="aggregators" style={{ padding: '4rem 6%', backgroundColor: CREAM }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left: Delivery Integrations Mockup */}
          <div style={{ backgroundColor: WHITE, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '1.25rem', color: TEXT_DARK }}>Delivery Integrations</div>
            {[
              { name: 'Ubereats', status: 'Connected', ok: true },
              { name: 'Zomato', status: 'Connected', ok: true },
              { name: 'Swiggy', status: 'Enabled', ok: false },
            ].map(p => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CREAM, borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem', border: `1px solid ${BORDER}` }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: TEXT_DARK }}>{p.name}</span>
                <span style={{ backgroundColor: p.ok ? '#e8f5e9' : OLIVE_LIGHT, color: p.ok ? '#2e7d32' : OLIVE, fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>

          {/* Right */}
          <div>
            <SectionBadge>Aggregators & Tools</SectionBadge>
            <h2 style={{ fontSize: '2.3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
              Plug Into the Ecosystem
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              Import digital order streams seamlessly, and configure physical floor spaces without buying expensive custom developer bridges.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <FeatureCheck><strong>Aggregator Simulator Control</strong> — Test normal food dispatch streams (UberEats, Zomato, Swiggy) directly within your system mockups before going live.</FeatureCheck>
              <FeatureCheck><strong>QR Generator Tool Suite</strong> — Generate and instantly print beautiful, high-resolution QR layout cards for up to 30 tables in one automated step.</FeatureCheck>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SAAS SCALE ── */}
      <section style={{ padding: '4rem 6%', backgroundColor: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <SectionBadge>SaaS Architecture</SectionBadge>
            <h2 style={{ fontSize: '2.3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
              Built for Scale.<br />Built for You.
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Whether you are running a single neighbourhood coffee shop or managing a nationwide franchise, FeastSpot's multi-tenant SaaS infrastructure scales with you every step of the way.
            </p>
            <button onClick={() => navigate('/register')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.95rem', padding: '0.85rem 1.75rem', borderRadius: '8px', cursor: 'pointer' }}>
              Register Your Cafe <ChevronRight size={16} />
            </button>
          </div>

          {/* Right: Super Admin Console Mockup */}
          <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '1rem', color: TEXT_DARK }}>Super Admin Console</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: WHITE, borderRadius: '10px', padding: '0.85rem', border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: '0.7rem', color: TEXT_SOFT, fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>All Cafes</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: TEXT_DARK }}>₹2.4M MoM</div>
              </div>
              <div style={{ backgroundColor: WHITE, borderRadius: '10px', padding: '0.85rem', border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: '0.7rem', color: TEXT_SOFT, fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>Active Tenants</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: TEXT_DARK }}>12 Active</div>
              </div>
            </div>
            {[
              { name: 'Feast Bistro (Main)', status: 'Active' },
              { name: 'Feast Express (Airport)', status: 'Active' },
              { name: 'Feast Drive-Thru', status: 'Active' },
            ].map(t => (
              <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: `1px solid ${BORDER}`, fontSize: '0.85rem' }}>
                <span style={{ color: TEXT_DARK, fontWeight: '600' }}>{t.name}</span>
                <span style={{ color: '#2e7d32', fontWeight: '700', fontSize: '0.78rem' }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ backgroundColor: '#2d4a1e', padding: '5rem 6%', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.6rem', fontWeight: '900', color: WHITE, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
            Ready to Transform Your Restaurant?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            Join 500+ restaurants already using FeastSpot to tighten operations and unlock growth.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#a3d46a', color: '#1a2e05', border: 'none', fontWeight: '800', fontSize: '0.95rem', padding: '0.9rem 1.75rem', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Start Free Trial <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate('/register')}
              style={{ backgroundColor: 'transparent', color: WHITE, border: '2px solid rgba(255,255,255,0.35)', fontWeight: '700', fontSize: '0.95rem', padding: '0.9rem 1.75rem', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}>
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: '#0d0d0d', color: '#94a3b8', padding: '4rem 6% 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Footer top - 4 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: '2.5rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1.05rem', color: WHITE, marginBottom: '1rem' }}>
                <div style={{ width: '26px', height: '26px', backgroundColor: OLIVE, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UtensilsCrossed size={14} color={WHITE} />
                </div>
                FeastSpot
              </div>
              <p style={{ fontSize: '0.83rem', lineHeight: '1.65', color: '#94a3b8', maxWidth: '240px' }}>
                Our all-in-one operating system designed to elevate margins, power kitchen ops, and keep customers coming back.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 style={{ color: WHITE, fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</h4>
              {[['Features', '/features/pos-billing'], ['POS Terminal', '/features/pos-billing'], ['KOT Monitor', '/features/kitchen-ops'], ['Inventory', '/features/inventory'], ['AI Copilot', '/features/ai-copilot']].map(([l, p]) => (
                <div key={l} style={{ marginBottom: '0.6rem' }}>
                  <span onClick={() => navigate(p)} style={{ color: '#94a3b8', fontSize: '0.83rem', cursor: 'pointer', transition: '0.2s' }}
                    onMouseOver={e => e.target.style.color = WHITE} onMouseOut={e => e.target.style.color = '#94a3b8'}>{l}</span>
                </div>
              ))}
            </div>

            {/* SaaS OS */}
            <div>
              <h4 style={{ color: WHITE, fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SaaS OS</h4>
              {[['Franchise Hub', '/about'], ['Inventory PO', '/features/inventory'], ['CRM Loyalty', '/features/crm-loyalty'], ['AI Copilot', '/features/ai-copilot'], ['Aggregators', '/features/pos-billing']].map(([l, p]) => (
                <div key={l} style={{ marginBottom: '0.6rem' }}>
                  <span onClick={() => navigate(p)} style={{ color: '#94a3b8', fontSize: '0.83rem', cursor: 'pointer', transition: '0.2s' }}
                    onMouseOver={e => e.target.style.color = WHITE} onMouseOut={e => e.target.style.color = '#94a3b8'}>{l}</span>
                </div>
              ))}
            </div>

            {/* Company */}
            <div>
              <h4 style={{ color: WHITE, fontWeight: '700', fontSize: '0.85rem', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</h4>
              {[['About Us', '/about'], ['Careers', '/careers'], ['Press Kit', '/press-kit'], ['Contact', '/contact']].map(([l, p]) => (
                <div key={l} style={{ marginBottom: '0.6rem' }}>
                  <span onClick={() => navigate(p)} style={{ color: '#94a3b8', fontSize: '0.83rem', cursor: 'pointer', transition: '0.2s' }}
                    onMouseOver={e => e.target.style.color = WHITE} onMouseOut={e => e.target.style.color = '#94a3b8'}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer bottom */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
            <span>© {new Date().getFullYear()} FeastSpot. All rights reserved.</span>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { label: 'Twitter/X', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" /></svg> },
                { label: 'Instagram', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg> },
                { label: 'Facebook', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg> },
                { label: 'LinkedIn', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg> },
              ].map(s => (
                <button key={s.label} aria-label={s.label} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#94a3b8', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = OLIVE; e.currentTarget.style.color = WHITE; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8'; }}>
                  {s.svg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

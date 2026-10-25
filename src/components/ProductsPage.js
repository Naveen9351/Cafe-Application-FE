import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';
import { FLAGSHIP_PRODUCTS, ECOSYSTEM_PRODUCTS } from '../data/productsData';
import {
  Layers,
  QrCode,
  LayoutGrid,
  CreditCard,
  Boxes,
  HeartHandshake,
  Sparkles,
  Grid,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Zap,
  ShieldCheck,
  Building
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'foh', label: 'Front-of-House' },
  { id: 'boh', label: 'Kitchen & BOH' },
  { id: 'ops', label: 'Operations & Stock' },
  { id: 'ai', label: 'Autonomous AI' }
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedProductTitle, setSelectedProductTitle] = useState('Full Product Suite');

  const openDemoWith = (title) => {
    setSelectedProductTitle(title);
    setIsDemoModalOpen(true);
  };

  const filteredEcosystem = ECOSYSTEM_PRODUCTS.filter((prod) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'foh') return prod.category.includes('Front-of-House');
    if (activeCategory === 'boh') return prod.category.includes('Back-of-House');
    if (activeCategory === 'ops') return prod.category.includes('Front-of-House') || prod.category.includes('Back-of-House') || prod.category.includes('Enterprise');
    if (activeCategory === 'ai') return prod.category.includes('AI') || prod.category.includes('Growth');
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => openDemoWith('Full Platform Walkthrough')} />

      <main style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
        {/* Hero Section */}
        <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', background: 'var(--bg-mesh-hero)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="badge-pill badge-blue">
              <Layers style={{ width: 14, height: 14 }} />
              <span>DineviQ Autonomous Suite</span>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
              The Unified Operating System for <span className="gradient-text">Modern Food Outlets</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 700, margin: 0, lineHeight: 1.6 }}>
              From table-specific QR ordering and sub-50ms kitchen KDS queues to live BOM recipe inventory and autonomous demand forecasting — all unified in one cloud console.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              <button
                onClick={() => openDemoWith('Complete Platform Walkthrough')}
                className="btn-electric"
                style={{ padding: '12px 28px', fontSize: 13 }}
              >
                <span>Schedule a 1-on-1 Product Demo</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
              <Link
                to="/menu"
                className="btn-white"
                style={{ padding: '12px 22px', fontSize: 13 }}
              >
                <QrCode style={{ width: 15, height: 15, color: 'var(--color-emerald)' }} />
                <span>Test Live Customer QR Menu</span>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 1: FLAGSHIP CORE ENGINES */}
        <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                Flagship Hospitality Engines
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: '4px 0 0 0', color: 'var(--text-main)' }}>
                Contactless Dining & Kitchen Coordination
              </h2>
            </div>
            <span className="badge-pill badge-emerald">Core Architecture</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
            {FLAGSHIP_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="card-luxury"
                style={{
                  padding: '36px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 24,
                  borderTop: '4px solid var(--color-primary)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge-pill badge-blue">{prod.badge}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{prod.category}</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                    {prod.name}
                  </h3>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {prod.tagline}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {prod.description}
                  </p>

                  {/* Metrics Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {prod.metrics.map((m, idx) => (
                      <div key={idx} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                          {m.value}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.05em' }}>
                      Key Capabilities:
                    </div>
                    {prod.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-main)' }}>
                        <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--color-emerald)', flexShrink: 0, marginTop: 2 }} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
                  <button
                    onClick={() => openDemoWith(prod.name)}
                    className="btn-electric"
                    style={{ flex: 1, padding: '11px 16px', fontSize: 12 }}
                  >
                    <span>Request {prod.name} Walkthrough</span>
                    <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: OPERATIONAL ECOSYSTEM & INTELLIGENCE */}
        <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div className="badge-pill badge-blue">
              <Sparkles style={{ width: 14, height: 14 }} />
              <span>Full Operational Ecosystem</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
              Complete Control Across Every Station
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
              Activate integrated modules on-demand without managing separate software vendors or clunky hardware bridges.
            </p>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={activeCategory === cat.id ? 'btn-electric' : 'btn-white'}
                  style={{ padding: '8px 18px', fontSize: 12, borderRadius: 'var(--radius-full)' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {filteredEcosystem.map((item) => (
              <div
                key={item.id}
                className="card-luxury"
                style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>{item.badge}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      {item.metrics.value} {item.metrics.label}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>

                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.06em' }}>
                      Included Capabilities:
                    </span>
                    {item.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-main)', fontWeight: 600 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => openDemoWith(item.title)}
                    className="btn-white"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 12 }}
                  >
                    <span>Request Demo for {item.title}</span>
                    <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: ARCHITECTURAL COMPARISON */}
        <section style={{ padding: '80px 0', background: 'var(--bg-card-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div className="badge-pill badge-blue">
                <ShieldCheck style={{ width: 14, height: 14 }} />
                <span>Architecture Comparison</span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                Traditional Restaurant Tech vs <span className="gradient-text">DINEVIQ AI OS</span>
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Why modern Indian restaurateurs are leaving legacy station-bound systems behind.
              </p>
            </div>

            <div className="card-luxury" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border-subtle)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: 900, color: 'var(--text-main)' }}>Operational Dimension</th>
                      <th style={{ padding: '16px 20px', fontWeight: 900, color: 'var(--color-rose)' }}>Legacy Terminal POS & Paper</th>
                      <th style={{ padding: '16px 20px', fontWeight: 900, color: 'var(--color-primary)' }}>DINEVIQ Autonomous Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        dim: 'Seated Table Ordering',
                        legacy: 'Waiters write notes on paper; punch tickets into a central terminal 6-10 mins later.',
                        dineviq: 'Instant table QR scan; orders arrive directly on kitchen screens in < 50ms.'
                      },
                      {
                        dim: 'Kitchen SLA & Timers',
                        legacy: 'Paper slips pinned to kitchen rail with grease & heat damage; zero countdown visibility.',
                        dineviq: 'Color-coded SLA timers (Green ➔ Amber ➔ Red) with automatic multi-station balancing.'
                      },
                      {
                        dim: 'Recipe Stock Depletion',
                        legacy: 'Manual end-of-day stock count with undetected wastage and weekend ingredient run-outs.',
                        dineviq: 'Live recipe-level deduction every time a dish is ordered with automated vendor PO alerts.'
                      },
                      {
                        dim: 'Table Checkout & Payment',
                        legacy: 'Diners wait 12-15 mins for check folder, card machine handover, and printed slip.',
                        dineviq: 'Direct UPI table settlement (GPay, PhonePe, Paytm) anytime with instant WhatsApp receipts.'
                      },
                      {
                        dim: 'Hardware Lock-In',
                        legacy: 'Proprietary expensive terminals ($1,500+), wired cables, and annual maintenance contracts.',
                        dineviq: 'Zero hardware lock-in — runs seamlessly on any Android, iOS tablet, phone, or laptop.'
                      }
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--text-main)' }}>{row.dim}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--color-rose)' }}>{row.legacy}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--color-primary)', fontWeight: 700 }}>{row.dineviq}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: CTA */}
        <CTASection onOpenDemo={() => openDemoWith('Full Product Architecture Walkthrough')} />
      </main>

      <Footer onOpenDemo={() => openDemoWith('Complete Platform Walkthrough')} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title={`Schedule a ${selectedProductTitle} Demo`}
        subtitle="Experience live multi-station routing, table QR ordering, and real-time inventory in action."
      />
    </div>
  );
}

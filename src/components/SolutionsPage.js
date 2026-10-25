import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';
import { SOLUTIONS } from '../data/solutionsData';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Zap,
  Building,
  Coffee,
  Utensils,
  Flame,
  ShieldCheck
} from 'lucide-react';

const ICON_MAP = {
  cafe: Coffee,
  qsr: Zap,
  'dine-in': Utensils,
  'cloud-kitchen': Flame,
  'multi-outlet': Building
};

export default function SolutionsPage() {
  const solutions = SOLUTIONS || [];
  const [activeTab, setActiveTab] = useState(solutions[0]?.id || "cafe");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const selectedSolution = solutions.find((s) => s.id === activeTab) || solutions[0] || {};
  const VenueIcon = ICON_MAP[selectedSolution.id] || Utensils;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => setIsDemoModalOpen(true)} />

      <main style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
        {/* Hero Section */}
        <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', background: 'var(--bg-mesh-hero)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="badge-pill badge-blue">
              <Sparkles style={{ width: 14, height: 14 }} />
              <span>Tailored Hospitality Architectures</span>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
              Engineered for Every <span className="gradient-text">Restaurant Model</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 720, margin: 0, lineHeight: 1.6 }}>
              A high-volume coffee bar operates completely differently from a 200-seat fine dining room or a 10-brand cloud kitchen. Discover how DINEVIQ adapts directly to your floor and kitchen workflow.
            </p>

            {/* Venue Selector Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
              {solutions.map((sol) => {
                const TabIcon = ICON_MAP[sol.id] || Utensils;
                const isActive = activeTab === sol.id;
                return (
                  <button
                    key={sol.id}
                    onClick={() => setActiveTab(sol.id)}
                    className={isActive ? 'btn-electric' : 'btn-white'}
                    style={{
                      padding: '11px 20px',
                      fontSize: 13,
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: isActive ? '0 8px 24px rgba(37,99,235,0.25)' : 'none'
                    }}
                  >
                    <TabIcon style={{ width: 15, height: 15 }} />
                    <span>{sol.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Selected Venue Deep Dive Section */}
        <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {/* Main Hero Card for Selected Venue */}
          <div className="card-luxury" style={{ padding: '40px clamp(20px, 4vw, 44px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VenueIcon style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>{selectedSolution.badge}</span>
                  <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                    {selectedSolution.name}
                  </h2>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.5 }}>
                {selectedSolution.tagline}
              </div>

              <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                {selectedSolution.summary}
              </p>

              {/* Tangible Metrics Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '18px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                {selectedSolution.metrics?.map((metric, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      {metric.value}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-light)', fontWeight: 700 }}>
                <span>Best suited for:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{selectedSolution.bestFor}</span>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="btn-electric"
                  style={{ padding: '13px 28px', fontSize: 13 }}
                >
                  <span>Schedule {selectedSolution.name} Walkthrough</span>
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)', height: 380, background: '#f8fafc' }}>
              <img
                src={selectedSolution.heroImage}
                alt={selectedSolution.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Side-by-Side: Common Challenges vs DINEVIQ Solution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {/* The Operational Challenge */}
            <div className="card-luxury" style={{ padding: 32, borderColor: 'var(--color-rose-border)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--color-rose-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-rose-light)', color: 'var(--color-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle style={{ width: 18, height: 18 }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                    Common Floor & Kitchen Roadblocks
                  </h3>
                </div>
                <span className="badge-pill" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)', fontSize: 10 }}>Legacy Friction</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedSolution.challenges?.map((chal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-rose)', flexShrink: 0, marginTop: 6 }} />
                    <span>{chal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* The DINEVIQ Solution */}
            <div className="card-luxury" style={{ padding: 32, borderColor: 'var(--color-primary-border)', borderLeft: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--color-primary-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 style={{ width: 18, height: 18 }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                    The DINEVIQ Autonomous Solution
                  </h3>
                </div>
                <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>AI Velocity</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedSolution.solutions?.map((sol, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.5 }}>
                    <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--color-emerald)', flexShrink: 0, marginTop: 2 }} />
                    <span>{sol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Capabilities Pills for this venue */}
          <div className="card-luxury" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.06em' }}>
              Standard Architecture Modules Included for {selectedSolution.name}:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {selectedSolution.features?.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-main)'
                  }}
                >
                  <Sparkles style={{ width: 16, height: 16, color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global CTA */}
        <CTASection onOpenDemo={() => setIsDemoModalOpen(true)} />
      </main>

      <Footer onOpenDemo={() => setIsDemoModalOpen(true)} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title={`Request a ${selectedSolution.name} Architecture Demo`}
        subtitle="See how DINEVIQ eliminates queue lag, automates kitchen lines, and protects food margins."
      />
    </div>
  );
}

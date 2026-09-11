import React, { useState } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import { SOLUTIONS } from '../data/solutionsData';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import CTASection from './sections/CTASection';
import LeadCaptureModal from './interactive/LeadCaptureModal';

export default function SolutionsPage() {
  const solutions = SOLUTIONS || [];
  const [activeTab, setActiveTab] = useState(solutions[0]?.id || "cafe");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const selectedSolution = solutions.find(s => s.id === activeTab) || solutions[0] || {};
  const featureList = selectedSolution.features || selectedSolution.benefits || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => setIsDemoModalOpen(true)} />

      <main style={{ padding: '140px 20px 80px 20px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 60 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Tailored Industry Solutions</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            Engineered for Every Restaurant Model
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            Whether you run a fast-paced cafe, fine dining venue, high-traffic QSR, or cloud kitchen chain, SERVIQ adapts to your exact layout.
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {solutions.map((sol) => (
            <button
              key={sol.id}
              onClick={() => setActiveTab(sol.id)}
              className={activeTab === sol.id ? 'btn-electric' : 'btn-white'}
              style={{ padding: '10px 20px', fontSize: 13, borderRadius: 'var(--radius-lg)' }}
            >
              {sol.name}
            </button>
          ))}
        </div>

        {/* Selected Solution Detail Card */}
        <div className="card-luxury" style={{ padding: '40px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="badge-pill badge-blue" style={{ alignSelf: 'flex-start' }}>
              {selectedSolution.tagline}
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              {selectedSolution.name}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {selectedSolution.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Key Operational Capabilities:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {featureList.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--color-emerald)', flexShrink: 0, marginTop: 2 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: 12 }}>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="btn-electric"
                style={{ padding: '12px 24px', fontSize: 13 }}
              >
                <span>Request {selectedSolution.name} Demo</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)', height: 340, background: '#f8fafc' }}>
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
              alt={selectedSolution.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        <CTASection onOpenDemo={() => setIsDemoModalOpen(true)} />
      </main>

      <Footer onOpenDemo={() => setIsDemoModalOpen(true)} />

      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title={`Schedule ${selectedSolution.name} Walkthrough`}
        subtitle="Our specialists will demonstrate workflows tailored for your exact venue model."
      />
    </div>
  );
}

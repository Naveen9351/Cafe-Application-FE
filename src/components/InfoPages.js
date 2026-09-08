import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Mail, MapPin, Phone, Sparkles, ArrowRight, ShieldCheck, Zap, Globe, Users, Award } from 'lucide-react';
import SarviqLogo from './brand/SarviqLogo';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

/* ── 1. ABOUT US PAGE ── */
export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-mesh-hero)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Our Story & Vision</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            Built for Restaurant Operators. Powered by Autonomous AI.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 680, margin: 0 }}>
            SARVIQ was founded by seasoned food and technology veterans to eliminate paper tickets, waitstaff bottlenecks, and inventory chaos with a unified AI platform.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 60 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="badge-pill badge-blue" style={{ alignSelf: 'flex-start' }}>
              The Mission
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
              Democratizing High-Velocity Tech for Every Food Venue
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              We believe every cafe, QSR, and dining room in India deserves the same lightning-fast operational infrastructure as global enterprise chains.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              From a single artisan coffee bar to a 50-location franchise network — SARVIQ runs autonomously on any phone, tablet, or browser with zero hardware lock-in.
            </p>
          </div>
          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)', height: 320, background: '#f1f5f9' }}>
            <img
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
              alt="Restaurant Team"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, paddingTop: 40, borderTop: '1px solid var(--border-subtle)' }}>
          {[
            {
              title: "Zero Latency",
              desc: "From seated QR scans to kitchen KDS lines in under 50 milliseconds.",
              icon: Zap,
              color: "var(--color-primary)"
            },
            {
              title: "Autonomous Recipe Sync",
              desc: "Live raw material deduction ensures zero unexpected 86 items.",
              icon: Sparkles,
              color: "var(--color-indigo)"
            },
            {
              title: "India-First Architecture",
              desc: "Direct UPI payments, GST breakdown, WhatsApp CRM, and 24/7 priority support.",
              icon: Award,
              color: "var(--color-emerald)"
            }
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="card-luxury" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pillar.color }}>
                  <Icon style={{ width: 20, height: 20 }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{pillar.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 2. CAREERS PAGE ── */
export function CareersPage() {
  const navigate = useNavigate();
  const jobs = [
    { title: "Senior Fullstack Engineer (React / Node.js)", team: "Core Platform", loc: "Bangalore / Remote", type: "Full-Time" },
    { title: "Lead AI & Telemetry Specialist", team: "AI Labs", loc: "Remote (India)", type: "Full-Time" },
    { title: "Enterprise Account Executive (HORECA)", team: "Growth & Sales", loc: "Mumbai / Delhi NCR", type: "Full-Time" },
    { title: "Customer Success & Onboarding Lead", team: "Operations", loc: "Bangalore", type: "Full-Time" },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />

      <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-mesh-hero)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Users style={{ width: 14, height: 14 }} />
            <span>We Are Hiring</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            Build the Future of Dining at SARVIQ
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            Join our team of engineers, designers, and food enthusiasts creating the next generation of autonomous restaurant infrastructure.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 20px', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Open Opportunities</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map((job, idx) => (
            <div key={idx} className="card-luxury" style={{ padding: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{job.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  <span>{job.team}</span>
                  <span>•</span>
                  <span>{job.loc}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{job.type}</span>
                </div>
              </div>
              <a
                href="mailto:careers@sarviq.com"
                className="btn-electric"
                style={{ padding: '8px 18px', fontSize: 12 }}
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      </section>

      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 3. PRESS KIT PAGE ── */
export function PressKitPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />

      <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-mesh-hero)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Globe style={{ width: 14, height: 14 }} />
            <span>Media & Resources</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            SARVIQ Press Kit & Brand Assets
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            Download high-resolution official brand marks, executive bios, and company milestones.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 20px', maxWidth: 900, margin: '0 auto' }}>
        <div className="card-luxury" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Official Brand Assets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ padding: 24, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <SarviqLogo size="lg" theme="light" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>SVG Primary Mark</span>
            </div>
            <div style={{ padding: 24, borderRadius: 'var(--radius-lg)', background: '#0f172a', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <SarviqLogo size="lg" theme="dark" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>Dark Background Variant</span>
            </div>
          </div>
        </div>
      </section>

      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

/* ── 4. CONTACT PAGE ── */
export function ContactPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />

      <section style={{ paddingTop: 140, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-mesh-hero)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Phone style={{ width: 14, height: 14 }} />
            <span>24/7 Specialist Support</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            We Are Here to Help Your Food Business
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            Have questions about billing, POS integrations, or custom franchise deployments? Talk to our dedicated team.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 20px', maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        <div className="card-luxury" style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail style={{ width: 20, height: 20 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Email Support</h3>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>support@sarviq.com</p>
          <a href="mailto:support@sarviq.com" style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none', marginTop: 4 }}>
            Write to Us →
          </a>
        </div>

        <div className="card-luxury" style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-emerald-light)', color: 'var(--color-emerald)', border: '1px solid var(--color-emerald-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone style={{ width: 20, height: 20 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Direct WhatsApp</h3>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>+91 96801 32562</p>
          <a href="https://wa.me/919680132562" target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-emerald)', textDecoration: 'none', marginTop: 4 }}>
            Chat on WhatsApp →
          </a>
        </div>

        <div className="card-luxury" style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-indigo-light)', color: 'var(--color-indigo)', border: '1px solid rgba(79, 70, 229, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin style={{ width: 20, height: 20 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Offices</h3>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>Bangalore • Mumbai • Delhi NCR</p>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-indigo)', marginTop: 4 }}>Pan-India Support</span>
        </div>
      </section>

      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

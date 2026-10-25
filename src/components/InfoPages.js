import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Mail, MapPin, Phone, Sparkles, ArrowRight, ShieldCheck, Zap, Globe, Users, Award, Clock, MessageSquare, Send } from 'lucide-react';
import ServiqLogo from './brand/ServiqLogo';
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
            DINEVIQ was founded by seasoned food and technology veterans to eliminate paper tickets, waitstaff bottlenecks, and inventory chaos with a unified AI platform.
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
              From a single artisan coffee bar to a 50-location franchise network — DINEVIQ runs autonomously on any phone, tablet, or browser with zero hardware lock-in.
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
            Build the Future of Dining at DINEVIQ
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
                href="mailto:careers@dineviq.com"
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
            DINEVIQ Press Kit & Brand Assets
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
              <ServiqLogo size="lg" theme="light" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>SVG Primary Mark</span>
            </div>
            <div style={{ padding: 24, borderRadius: 'var(--radius-lg)', background: '#0f172a', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ServiqLogo size="lg" theme="dark" />
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
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    restaurantName: '',
    outletType: 'Cafe / Coffee Bar',
    tables: '10-25 Tables',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar onOpenDemoModal={() => navigate('/demo')} />

      {/* Hero Header */}
      <section style={{ paddingTop: 140, paddingBottom: 50, paddingLeft: 20, paddingRight: 20, textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-mesh-hero)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="badge-pill badge-blue">
            <Phone style={{ width: 14, height: 14 }} />
            <span>24/7 Specialist Support & Consultations</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
            Connect with Our <span className="gradient-text">Restaurant Tech Specialists</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 680, margin: 0, lineHeight: 1.6 }}>
            Whether you want to digitize paper menus, configure multi-station KDS, or schedule a customized franchise walkthrough, we are available round-the-clock across India.
          </p>
        </div>
      </section>

      {/* Main Grid: Form + Direct Contact Cards */}
      <section style={{ padding: '60px 20px 80px 20px', maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 36, alignItems: 'flex-start' }}>
        
        {/* Left: Consultation Form */}
        <div className="card-luxury" style={{ padding: 'clamp(24px, 4vw, 36px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                Request Consultation or Live Demo
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Fill out the details below and a specialist will connect in &lt; 15 minutes.
              </p>
            </div>
            <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>Sub-15m SLA</span>
          </div>

          {submitted ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-emerald-light)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ width: 28, height: 28 }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Thank You, {formData.name || 'Partner'}!</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: 0, lineHeight: 1.5 }}>
                Our restaurant technology specialist has received your request for <strong>{formData.restaurantName || 'your outlet'}</strong> and will call or message you on WhatsApp shortly.
              </p>
              <a
                href={`https://wa.me/919680132562?text=Hi%20DineviQ%2C%20I%20just%20submitted%20a%20consultation%20request%20for%20${encodeURIComponent(formData.restaurantName || 'my restaurant')}.`}
                target="_blank"
                rel="noreferrer"
                className="btn-electric"
                style={{ padding: '10px 20px', fontSize: 12, marginTop: 8 }}
              >
                <span>Fast-Track on WhatsApp Now</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    WhatsApp / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Restaurant / Cafe Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Chimney Cafe"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Venue Type
                  </label>
                  <select
                    value={formData.outletType}
                    onChange={(e) => setFormData({ ...formData, outletType: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="Cafe / Coffee Bar">Cafe / Coffee Bar</option>
                    <option value="QSR / Fast Food Counter">QSR / Fast Food Counter</option>
                    <option value="Casual & Fine Dining">Casual & Fine Dining</option>
                    <option value="Cloud Kitchen / Ghost Brand">Cloud Kitchen / Ghost Brand</option>
                    <option value="Multi-Outlet Franchise">Multi-Outlet Franchise</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Tell us about your requirements or current setup
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. We have 18 tables and want to switch from paper KOTs to kitchen display screens and accept direct UPI."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn-electric"
                style={{ padding: '13px 24px', fontSize: 13, width: '100%', justifyContent: 'center' }}
              >
                <span>Request Free Walkthrough & Consultation</span>
                <Send style={{ width: 14, height: 14 }} />
              </button>
            </form>
          )}
        </div>

        {/* Right: Direct Channels & SLA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Connect WhatsApp Card */}
          <div className="card-luxury" style={{ padding: 24, borderLeft: '4px solid var(--color-emerald)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-emerald-light)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare style={{ width: 18, height: 18 }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Instant WhatsApp Specialist</h3>
              </div>
              <span className="badge-pill badge-emerald" style={{ fontSize: 10 }}>Live Now</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Chat directly with our solutions engineering team for instantaneous answers regarding hardware compatibility, Petpooja migration, or custom pricing.
            </p>
            <a
              href="https://wa.me/919680132562?text=Hi%20DineviQ%2C%20I%20would%20like%20to%20know%20more%20about%20your%20autonomous%20restaurant%20OS."
              target="_blank"
              rel="noreferrer"
              className="btn-white"
              style={{ padding: '10px 16px', fontSize: 12, color: 'var(--color-emerald)', fontWeight: 800, justifyContent: 'center' }}
            >
              <span>+91 96801 32562 (Chat on WhatsApp)</span>
              <ArrowRight style={{ width: 13, height: 13 }} />
            </a>
          </div>

          {/* Email Support Card */}
          <div className="card-luxury" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Official Support Inquiries</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>support@dineviq.com</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Send menus, architectural queries, or vendor RFP specifications directly to our engineering desk.
            </p>
          </div>

          {/* SLA & Regional Offices */}
          <div className="card-luxury" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.06em' }}>
              Service Level Guarantees:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-main)', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                <span>Sub-15 minute average first response time</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck style={{ width: 15, height: 15, color: 'var(--color-emerald)' }} />
                <span>99.98% Cloud Uptime SLA for POS & KDS lines</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin style={{ width: 15, height: 15, color: 'var(--color-indigo)' }} />
                <span>Hubs: Bangalore • Mumbai • Delhi NCR</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      <Footer onOpenDemoModal={() => navigate('/demo')} />
    </div>
  );
}

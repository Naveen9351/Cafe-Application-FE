import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, UtensilsCrossed, ChevronRight, Mail, MapPin, Phone } from 'lucide-react';

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
          {[['About Us', '/about'], ['Careers', '/careers'], ['Contact', '/contact'], ['Features', '/features/pos-billing']].map(([l, p]) => (
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

/* ── ABOUT US PAGE ── */
export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      {/* Hero */}
      <section style={{ backgroundColor: CREAM, padding: '5rem 6%', textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <SectionBadge>Our Story</SectionBadge>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
            Built by restaurant operators. For restaurant operators.
          </h1>
          <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65' }}>
            FeastSpot was founded after our team spent years managing busy cafe operations and realising how fragmented and painful the software tools were. We built what we wished existed.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center', marginBottom: '5rem' }}>
          <div>
            <SectionBadge>Our Mission</SectionBadge>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1.25rem', lineHeight: '1.2' }}>
              Make world-class restaurant tech accessible to every cafe
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1rem' }}>
              We believe every neighbourhood cafe deserves the same operational power as a large franchise chain. Our SaaS platform democratizes intelligent restaurant management for businesses of all sizes.
            </p>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.65' }}>
              From a single coffee kiosk to a 50-table multi-branch operation — FeastSpot scales with you, grows with you, and works on any hardware you already own.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {[
              { stat: '1,200+', label: 'Active Restaurants' },
              { stat: '₹12.4Cr+', label: 'Processed Annually' },
              { stat: '99.99%', label: 'Uptime Reliability' },
              { stat: '4.9★', label: 'Average Rating' },
            ].map(s => (
              <div key={s.stat} style={{ backgroundColor: CREAM, borderRadius: '14px', padding: '1.5rem', border: `1px solid ${BORDER}`, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: OLIVE }}>{s.stat}</div>
                <div style={{ fontSize: '0.82rem', color: TEXT_MID, marginTop: '4px', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <SectionBadge>Our Values</SectionBadge>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.75rem' }}>What drives us every day</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
          {[
            { icon: '🎯', title: 'Simplicity First', desc: 'We obsess over making complex restaurant operations simple enough for any staff member to master in under an hour.' },
            { icon: '⚡', title: 'Speed Matters', desc: 'Every second at a billing counter counts. Our POS and KOT flows are engineered for absolute minimum friction.' },
            { icon: '🤝', title: 'Customer Success', desc: 'We measure our success by yours. Dedicated onboarding, live support, and proactive problem-solving are non-negotiables.' },
          ].map(v => (
            <div key={v.title} style={{ backgroundColor: CREAM, borderRadius: '14px', padding: '1.75rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.85rem' }}>{v.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.5rem' }}>{v.title}</h3>
              <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.55' }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', backgroundColor: '#2d4a1e', borderRadius: '20px', padding: '3.5rem 2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: WHITE, marginBottom: '1rem' }}>Ready to join 1,200+ restaurants?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', fontSize: '1rem' }}>Start your 14-day free trial today. No credit card required.</p>
          <button onClick={() => navigate('/register')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#a3d46a', color: '#1a2e05', border: 'none', fontWeight: '800', fontSize: '0.95rem', padding: '0.9rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
            Start Free Trial <ChevronRight size={16} />
          </button>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── CAREERS PAGE ── */
export function CareersPage() {
  const navigate = useNavigate();
  const openings = [
    { role: 'Senior Full Stack Engineer', dept: 'Engineering', type: 'Full-time', location: 'Bangalore / Remote' },
    { role: 'Product Designer (UI/UX)', dept: 'Design', type: 'Full-time', location: 'Bangalore' },
    { role: 'Customer Success Manager', dept: 'Operations', type: 'Full-time', location: 'Mumbai / Remote' },
    { role: 'Sales Development Representative', dept: 'Sales', type: 'Full-time', location: 'Delhi / Remote' },
    { role: 'AI/ML Engineer', dept: 'Engineering', type: 'Full-time', location: 'Bangalore / Remote' },
    { role: 'Marketing Content Strategist', dept: 'Marketing', type: 'Contract', location: 'Remote' },
  ];

  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <section style={{ backgroundColor: CREAM, padding: '5rem 6%', textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <SectionBadge>We're Hiring</SectionBadge>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>
            Build the future of restaurant tech
          </h1>
          <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65' }}>
            Join a passionate team building tools that directly help thousands of restaurants operate better, smarter, and faster. Remote-first culture, competitive pay.
          </p>
        </div>
      </section>

      <section style={{ padding: '5rem 6%', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '2rem' }}>Open Positions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {openings.map(job => (
            <div key={job.role} style={{ backgroundColor: CREAM, borderRadius: '12px', padding: '1.5rem 2rem', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s', cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = OLIVE; e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = 'translateX(0)'; }}
              onClick={() => navigate('/contact')}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: TEXT_DARK, marginBottom: '4px' }}>{job.role}</div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: TEXT_SOFT }}>
                  <span>{job.dept}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                </div>
              </div>
              <div style={{ backgroundColor: OLIVE_LIGHT, color: OLIVE, fontWeight: '700', fontSize: '0.78rem', padding: '0.4rem 0.9rem', borderRadius: '8px', flexShrink: 0 }}>
                Apply →
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '4rem', backgroundColor: '#2d4a1e', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: WHITE, marginBottom: '0.75rem' }}>Don't see your role?</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>We're always looking for exceptional people. Send us your resume.</p>
          <button onClick={() => navigate('/contact')} style={{ backgroundColor: '#a3d46a', color: '#1a2e05', border: 'none', fontWeight: '800', padding: '0.8rem 1.75rem', borderRadius: '8px', cursor: 'pointer' }}>
            Send Open Application
          </button>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── PRESS KIT PAGE ── */
export function PressKitPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <section style={{ backgroundColor: CREAM, padding: '5rem 6%', textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <SectionBadge>Media & Press</SectionBadge>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>Press Kit</h1>
          <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65' }}>
            Everything you need to write about FeastSpot. Download assets, read our boilerplate, or get in touch with our media team.
          </p>
        </div>
      </section>

      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
          {[
            { title: 'Company Overview', desc: 'One-page factsheet covering our story, product, and key metrics.', btn: 'Download PDF' },
            { title: 'Logo & Brand Assets', desc: 'Official FeastSpot logos in SVG, PNG, and dark/light variants.', btn: 'Download ZIP' },
            { title: 'Product Screenshots', desc: 'High-resolution screenshots of the POS, KOT, and Dashboard.', btn: 'Download ZIP' },
          ].map(a => (
            <div key={a.title} style={{ backgroundColor: CREAM, borderRadius: '14px', padding: '2rem', border: `1px solid ${BORDER}` }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.5rem' }}>{a.title}</h3>
              <p style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.55', marginBottom: '1.25rem' }}>{a.desc}</p>
              <button onClick={() => navigate('/contact')} style={{ backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '0.82rem', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer' }}>{a.btn}</button>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: CREAM, borderRadius: '16px', padding: '2.5rem', border: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1rem' }}>Boilerplate Description</h2>
          <div style={{ backgroundColor: WHITE, borderRadius: '10px', padding: '1.5rem', border: `1px solid ${BORDER}`, fontStyle: 'italic', color: TEXT_MID, fontSize: '0.92rem', lineHeight: '1.7' }}>
            FeastSpot is an all-in-one restaurant operating system that helps cafes and restaurants streamline operations with integrated POS billing, kitchen order ticket monitoring, dynamic QR ordering menus, automated inventory management, CRM & loyalty programs, and an AI-powered business copilot. Founded in 2024, FeastSpot powers over 1,200 restaurants across India.
          </div>
          <p style={{ fontSize: '0.82rem', color: TEXT_SOFT, marginTop: '1rem' }}>For media inquiries, contact: <strong style={{ color: TEXT_DARK }}>press@feastspot.in</strong></p>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}

/* ── CONTACT PAGE ── */
export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  return (
    <div style={{ backgroundColor: WHITE, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <PageNav />
      <section style={{ backgroundColor: CREAM, padding: '5rem 6%', textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <SectionBadge>Get in Touch</SectionBadge>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: TEXT_DARK, lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.5px' }}>We'd love to hear from you</h1>
          <p style={{ color: TEXT_MID, fontSize: '1rem', lineHeight: '1.65' }}>Whether you have a question, want a demo, or just want to say hello — our team is ready to respond within a few hours.</p>
        </div>
      </section>

      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
          {/* Left: Contact Info */}
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '2rem' }}>Contact Information</h2>
            {[
              { icon: <Mail size={20} style={{ color: OLIVE }} />, label: 'Email', val: 'hello@feastspot.in' },
              { icon: <Phone size={20} style={{ color: OLIVE }} />, label: 'Phone', val: '+91 98765 43210' },
              { icon: <MapPin size={20} style={{ color: OLIVE }} />, label: 'Headquarters', val: 'Koramangala, Bangalore, India 560034' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: OLIVE_LIGHT, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: TEXT_SOFT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{c.label}</div>
                  <div style={{ fontSize: '0.95rem', color: TEXT_DARK, fontWeight: '600' }}>{c.val}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '2rem', backgroundColor: CREAM, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: TEXT_DARK, marginBottom: '0.5rem' }}>Support Hours</div>
              <div style={{ fontSize: '0.85rem', color: TEXT_MID, lineHeight: '1.65' }}>
                Mon–Fri: 9:00 AM – 8:00 PM IST<br />
                Sat: 10:00 AM – 5:00 PM IST<br />
                Emergency support: 24/7 for Pro & Enterprise
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div style={{ backgroundColor: CREAM, borderRadius: '20px', padding: '2.5rem', border: `1px solid ${BORDER}` }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '0.75rem' }}>Message Sent!</h2>
                <p style={{ color: TEXT_MID, fontSize: '0.95rem' }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: TEXT_DARK, marginBottom: '1.75rem' }}>Send Us a Message</h2>
                <form onSubmit={e => { e.preventDefault(); if (form.name && form.email) setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {[
                    { label: 'Your Name', field: 'name', type: 'text', placeholder: 'Full Name' },
                    { label: 'Email Address', field: 'email', type: 'email', placeholder: 'you@company.com' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_DARK, marginBottom: '0.4rem' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={form[f.field]}
                        onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                        style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: WHITE, color: TEXT_DARK, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_DARK, marginBottom: '0.4rem' }}>Message</label>
                    <textarea placeholder="How can we help you?" value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: WHITE, color: TEXT_DARK, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <button type="submit" style={{ backgroundColor: OLIVE, color: WHITE, border: 'none', fontWeight: '700', fontSize: '1rem', padding: '0.9rem', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(58,90,42,0.25)' }}>
                    Send Message →
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

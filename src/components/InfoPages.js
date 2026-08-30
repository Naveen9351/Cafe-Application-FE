import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
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
  <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: OLIVE_LIGHT, color: '#34d399', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '0.35rem 0.9rem', borderRadius: '100px', marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.3)' }}>
    {children}
  </div>
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
          {[['About Us', '/about'], ['Careers', '/careers'], ['Contact', '/contact'], ['Features', '/features/pos-billing']].map(([l, p]) => (
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

/* ── ABOUT US PAGE ── */
export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      {/* Hero with Photo */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '6rem 6%', textAlign: 'center', backgroundColor: '#090d16', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, zIndex: 0 }}>
          <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1400&q=80" alt="Cafe Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ maxWidth: '740px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <SectionBadge>Our Story</SectionBadge>
          <h1 style={{ fontSize: '3.2rem', fontWeight: '900', color: WHITE, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-1px' }}>
            Built by restaurant operators. For restaurant operators.
          </h1>
          <p style={{ color: TEXT_MID, fontSize: '1.1rem', lineHeight: '1.65' }}>
            RASTRORATO was founded after our team spent years managing busy cafe operations and experiencing first-hand how painful fragmented legacy POS tools were. We built what we wished existed.
          </p>
        </div>
      </section>

      {/* Mission & Gallery */}
      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
          <div>
            <SectionBadge>Our Mission</SectionBadge>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: WHITE, marginBottom: '1.25rem', lineHeight: '1.2', letterSpacing: '-0.5px' }}>
              Make world-class restaurant tech accessible to every cafe
            </h2>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1rem' }}>
              We believe every neighbourhood cafe deserves the same operational power as a large franchise chain. Our SaaS platform democratizes intelligent restaurant management for businesses of all sizes.
            </p>
            <p style={{ color: TEXT_MID, fontSize: '0.95rem', lineHeight: '1.65' }}>
              From a single coffee kiosk to a 50-table multi-branch operation — RASTRORATO scales with you, grows with you, and works on any hardware you already own.
            </p>
          </div>
          <div style={{ borderRadius: '20px', overflow: 'hidden', height: '320px', border: `1px solid rgba(16,185,129,0.3)`, boxShadow: '0 15px 35px rgba(0,0,0,0.5)' }}>
            <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80" alt="Cafe Team" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
          {[
            { stat: '500+', label: 'Active Cafes' },
            { stat: '₹18.4M+', label: 'Monthly GMV' },
            { stat: '99.99%', label: 'Uptime SLA' },
            { stat: '4.9★', label: 'Average Rating' },
          ].map(s => (
            <div key={s.stat} style={{ backgroundColor: CARD_DARK, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#34d399' }}>{s.stat}</div>
              <div style={{ fontSize: '0.82rem', color: TEXT_MID, marginTop: '4px', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
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
  ];

  return (
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <section style={{ position: 'relative', overflow: 'hidden', padding: '6rem 6%', textAlign: 'center', backgroundColor: '#090d16', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, zIndex: 0 }}>
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80" alt="Team Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <SectionBadge>We're Hiring</SectionBadge>
          <h1 style={{ fontSize: '3.2rem', fontWeight: '900', color: WHITE, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-1px' }}>
            Build the future of restaurant tech
          </h1>
          <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65' }}>
            Join a passionate team building tools that directly help thousands of restaurants operate better, smarter, and faster.
          </p>
        </div>
      </section>

      <section style={{ padding: '5rem 6%', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: WHITE, marginBottom: '2rem' }}>Open Positions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {openings.map(job => (
            <div key={job.role} style={{ backgroundColor: CARD_DARK, borderRadius: '14px', padding: '1.5rem 2rem', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/contact')}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: WHITE, marginBottom: '4px' }}>{job.role}</div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: TEXT_SOFT }}>
                  <span>{job.dept}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                </div>
              </div>
              <div style={{ backgroundColor: OLIVE_LIGHT, color: '#34d399', fontWeight: '700', fontSize: '0.82rem', padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                Apply →
              </div>
            </div>
          ))}
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
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <section style={{ padding: '5.5rem 6%', textAlign: 'center', backgroundColor: '#090d16', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <SectionBadge>Media & Press</SectionBadge>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: WHITE, lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>Press Kit</h1>
          <p style={{ color: TEXT_MID, fontSize: '1.05rem', lineHeight: '1.65' }}>
            Everything you need to write about RASTRORATO. Download assets, read our boilerplate, or get in touch with our media team.
          </p>
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
    <div style={{ backgroundColor: BG_DARK, color: TEXT_DARK, fontFamily: "'Outfit','Inter',sans-serif", minHeight: '100vh' }}>
      <PageNav />
      <section style={{ padding: '5.5rem 6%', textAlign: 'center', backgroundColor: '#090d16', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <SectionBadge>Get in Touch</SectionBadge>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: WHITE, lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.5px' }}>We'd love to hear from you</h1>
          <p style={{ color: TEXT_MID, fontSize: '1rem', lineHeight: '1.65' }}>Whether you have a question, want a demo, or just want to say hello — our team is ready to respond.</p>
        </div>
      </section>

      <section style={{ padding: '5rem 6%', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: WHITE, marginBottom: '2rem' }}>Contact Information</h2>
            {[
              { icon: <Mail size={20} style={{ color: '#10b981' }} />, label: 'Email', val: 'support@rastrorato.com' },
              { icon: <Phone size={20} style={{ color: '#10b981' }} />, label: 'WhatsApp & Phone', val: '+91 98765 43210' },
              { icon: <MapPin size={20} style={{ color: '#10b981' }} />, label: 'Headquarters', val: 'Koramangala, Bangalore, India' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: OLIVE_LIGHT, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: TEXT_SOFT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{c.label}</div>
                  <div style={{ fontSize: '0.95rem', color: WHITE, fontWeight: '600' }}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: CARD_DARK, borderRadius: '20px', padding: '2.5rem', border: `1px solid ${BORDER}` }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: WHITE, marginBottom: '0.75rem' }}>Message Sent!</h2>
                <p style={{ color: TEXT_MID, fontSize: '0.95rem' }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: WHITE, marginBottom: '1.75rem' }}>Send Us a Message</h2>
                <form onSubmit={e => { e.preventDefault(); if (form.name && form.email) setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {[
                    { label: 'Your Name', field: 'name', type: 'text', placeholder: 'Full Name' },
                    { label: 'Email Address', field: 'email', type: 'email', placeholder: 'you@company.com' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_MID, marginBottom: '0.4rem' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={form[f.field]}
                        onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                        style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: 'rgba(0,0,0,0.3)', color: WHITE, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: TEXT_MID, marginBottom: '0.4rem' }}>Message</label>
                    <textarea placeholder="How can we help your restaurant?" value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', backgroundColor: 'rgba(0,0,0,0.3)', color: WHITE, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <button type="submit" style={{ backgroundColor: '#10b981', color: WHITE, border: 'none', fontWeight: '700', fontSize: '1rem', padding: '0.9rem', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
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

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FAQS } from '../../data/faqsData';

gsap.registerPlugin(ScrollTrigger);

export default function FAQSection({ onOpenDemo }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const filterRef = useRef(null);
  const faqListRef = useRef(null);
  const answerRefs = useRef({});

  const categories = ['All', ...new Set(FAQS.map(f => f.category))];

  const filteredFaqs = activeCategory === 'All'
    ? FAQS
    : FAQS.filter(f => f.category === activeCategory);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation — start 90% (fires sooner)
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Filter Buttons
      if (filterRef.current) {
        gsap.fromTo(
          filterRef.current.children,
          { opacity: 0, y: 15, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: filterRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // FAQ List Items
      if (faqListRef.current) {
        gsap.fromTo(
          faqListRef.current.children,
          { opacity: 0, y: 25, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: faqListRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate answer panel open/close with GSAP
  const handleToggle = (idx) => {
    const wasOpen = openIndex === idx;
    setOpenIndex(wasOpen ? null : idx);

    // Animate the new answer opening after React updates
    if (!wasOpen) {
      setTimeout(() => {
        const el = answerRefs.current[idx];
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: -8, height: 0 },
            { opacity: 1, y: 0, height: "auto", duration: 0.35, ease: "power2.out" }
          );
        }
      }, 0);
    }
  };

  // Reset openIndex when category changes
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setOpenIndex(0);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      style={{ padding: "100px 0", background: "var(--bg-card-subtle)", borderTop: "1px solid var(--border-subtle)", position: "relative", overflow: "hidden" }}
    >
      {/* Decorative background orbs */}
      <div style={{
        position: "absolute", top: "20%", right: "-80px",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
        animation: "orbitFloat 10s ease-in-out infinite"
      }} />

      <div className="container-narrow">
        
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: "center", marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="badge-pill badge-blue">
            <HelpCircle style={{ width: 14, height: 14 }} />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
            Got Questions? We Have Answers.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
            Everything you need to know about setting up SERVIQ, hardware compatibility, UPI payments, and Indian POS sync.
          </p>
        </div>

        {/* Category Filter */}
        <div ref={filterRef} style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: "8px 18px",
                fontSize: 12,
                fontWeight: 800,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                border: `1px solid ${activeCategory === cat ? "var(--color-primary)" : "var(--border-subtle)"}`,
                background: activeCategory === cat ? "var(--color-primary)" : "#ffffff",
                color: activeCategory === cat ? "#ffffff" : "var(--text-main)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: activeCategory === cat ? "scale(1.04)" : "scale(1)",
                boxShadow: activeCategory === cat ? "0 4px 14px rgba(37,99,235,0.3)" : "none"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div ref={faqListRef} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={`${activeCategory}-${idx}`}
                className="card-luxury"
                style={{
                  borderRadius: "var(--radius-lg)",
                  borderColor: isOpen ? "var(--color-primary)" : "var(--border-subtle)",
                  overflow: "hidden",
                  transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                  boxShadow: isOpen ? "0 8px 24px rgba(37,99,235,0.12)" : "var(--shadow-sm)"
                }}
              >
                <button
                  onClick={() => handleToggle(idx)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    fontWeight: 800,
                    fontSize: 15,
                    color: isOpen ? "var(--color-primary)" : "var(--text-main)",
                    background: isOpen ? "var(--color-primary-light)" : "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.25s ease, color 0.25s ease"
                  }}
                >
                  <span>{faq.question}</span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isOpen ? "var(--color-primary)" : "var(--bg-card-subtle)",
                      color: isOpen ? "#ffffff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, color 0.25s ease"
                    }}
                  >
                    <ChevronDown style={{ width: 16, height: 16 }} />
                  </div>
                </button>

                {isOpen && (
                  <div
                    ref={(el) => { answerRefs.current[idx] = el; }}
                    style={{
                      padding: "0 24px 20px 24px",
                      fontSize: 14,
                      color: "var(--text-muted)",
                      lineHeight: 1.65,
                      borderTop: "1px solid var(--color-primary-border)",
                      paddingTop: 16,
                      background: "var(--color-primary-light)"
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div
          className="card-luxury shimmer-on-hover"
          style={{
            padding: 24,
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            transition: "transform 0.3s ease, box-shadow 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(37,99,235,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text-main)" }}>Need a custom feature or hardware integration?</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Our Indian restaurant tech specialists are available 24/7.</div>
            </div>
          </div>
          <button
            onClick={onOpenDemo}
            className="btn-electric"
            style={{ padding: "10px 20px", fontSize: 12 }}
          >
            Speak to a Specialist
          </button>
        </div>

      </div>
    </section>
  );
}

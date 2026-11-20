import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FAQS } from '../../data/faqsData';
import styles from '../../styles/FAQSection.module.css';

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
      // Header Animation with blur-to-focus reveal
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 32, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Filter Buttons staggered spring entrance
      if (filterRef.current) {
        gsap.fromTo(
          filterRef.current.children,
          { opacity: 0, y: 18, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.07,
            ease: "back.out(1.6)",
            scrollTrigger: {
              trigger: filterRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // FAQ List Items staggered entrance
      if (faqListRef.current) {
        gsap.fromTo(
          faqListRef.current.children,
          { opacity: 0, y: 28, scale: 0.98, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: faqListRef.current,
              start: "top 88%",
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
      className={styles.faqSection}
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
        <div ref={headerRef} className={styles.faqHeader}>
          <div className="badge-pill badge-blue">
            <HelpCircle style={{ width: 14, height: 14 }} />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className={styles.faqTitle}>
            Got Questions? We Have Answers.
          </h2>
          <p className={styles.faqSubtitle}>
            Everything you need to know about setting up DINEVIQ, hardware compatibility, UPI payments, and Indian POS sync.
          </p>
        </div>

        {/* Category Filter */}
        <div ref={filterRef} className={styles.categoryFilter}>
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
                boxShadow: activeCategory === cat ? "0 4px 14px rgba(5,150,105,0.25)" : "none"
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
                  boxShadow: isOpen ? "0 8px 24px rgba(5,150,105,0.12)" : "var(--shadow-sm)"
                }}
              >
                <button
                  onClick={() => handleToggle(idx)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "clamp(14px, 2.5vw, 18px) clamp(16px, 3.5vw, 24px)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    fontWeight: 800,
                    fontSize: "clamp(13px, 2vw, 15px)",
                    color: isOpen ? "var(--color-primary)" : "var(--text-main)",
                    background: isOpen ? "var(--color-primary-light)" : "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.25s ease, color 0.25s ease"
                  }}
                >
                  <span style={{ lineHeight: 1.4 }}>{faq.question}</span>
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
                      padding: "14px clamp(16px, 3.5vw, 24px) 18px clamp(16px, 3.5vw, 24px)",
                      fontSize: 14,
                      color: "var(--text-muted)",
                      lineHeight: 1.65,
                      borderTop: "1px solid var(--color-primary-border)",
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
        <div className={styles.specialistCard}>
          <div className={styles.specialistLeft}>
            <div className={styles.specialistIcon}>
              <MessageSquare style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className={styles.specialistTitle}>Need a custom feature or hardware integration?</div>
              <div className={styles.specialistDesc}>Our Indian restaurant tech specialists are available 24/7.</div>
            </div>
          </div>
          <button
            onClick={onOpenDemo}
            className={styles.specialistBtn}
          >
            Speak to a Specialist
          </button>
        </div>

      </div>
    </section>
  );
}

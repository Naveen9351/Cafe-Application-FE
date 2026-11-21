import React, { useEffect, useRef } from 'react';
import { Star, CheckCircle2, MapPin, TrendingUp, Zap, Clock, Store, Quote, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/ClientsTrustSection.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function ClientsTrustSection({ onOpenDemo }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const featuredRef = useRef(null);
  const starGroupRef = useRef(null);
  const metricsRef = useRef(null);
  const secondaryRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Header blur-to-focus reveal
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 30, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // 2. Featured Card 3D scale-up entrance
      if (featuredRef.current) {
        gsap.fromTo(
          featuredRef.current,
          { opacity: 0, y: 40, scale: 0.95, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuredRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // 3. Sequential 5-star rating pop-in
      if (starGroupRef.current?.children) {
        gsap.fromTo(
          starGroupRef.current.children,
          { opacity: 0, scale: 0.3, rotate: -25 },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "back.out(2.2)",
            scrollTrigger: {
              trigger: featuredRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // 4. Metric items cascade
      if (metricsRef.current?.children) {
        gsap.fromTo(
          metricsRef.current.children,
          { opacity: 0, y: 18, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: {
              trigger: metricsRef.current,
              start: "top 88%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // 5. Secondary Client Testimonial Cards
      if (secondaryRef.current?.children) {
        gsap.fromTo(
          secondaryRef.current.children,
          { opacity: 0, y: 30, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: secondaryRef.current,
              start: "top 88%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="clients" className={styles.clientsSection}>
      <div className="container">

        {/* Section Header */}
        <div ref={headerRef} className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Store style={{ width: 14, height: 14 }} />
            <span>Trusted On Real Cafe Floors</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Trusted by Our Clients. Loved by Cafe Crews.
          </h2>
          <p className={styles.sectionSubtitle}>
            From busy counter rush hours to multi-table dining rooms, see how leading food spots rely on DineviQ every day.
          </p>
        </div>

        {/* Featured Client Spotlight: The Land Mark Cafe Jaipur */}
        <div ref={featuredRef} className={styles.featuredCard}>
          <div className={styles.featuredTopBar}>
            <div className={styles.clientIdentity}>
              <div className={styles.clientLogoBadge}>
                LM
              </div>
              <div className={styles.clientMeta}>
                <h3 className={styles.clientName}>
                  The Land Mark Cafe
                  <span className={styles.verifiedPill}>
                    <CheckCircle2 style={{ width: 12, height: 12 }} />
                    Verified Client Partner
                  </span>
                </h3>
                <div className={styles.clientLocation}>
                  <MapPin style={{ width: 13, height: 13, color: "var(--color-primary)" }} />
                  <span>Jaipur, Rajasthan • High-Volume Cafe & Dine-In</span>
                </div>
              </div>
            </div>

            {/* 5-Star Rating Pill */}
            <div className={styles.ratingWrapper}>
              <div ref={starGroupRef} className={styles.starGroup}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: 16, height: 16, fill: "#f59e0b", color: "#f59e0b" }} />
                ))}
              </div>
              <span className={styles.ratingNumber}>5.0 / 5.0</span>
            </div>
          </div>

          {/* Primary Review Quote */}
          <div className={styles.quoteContainer}>
            <p className={styles.quoteText}>
              “Switching to DineviQ has completely transformed floor operations at The Land Mark Cafe Jaipur.
              During our busiest evening and weekend hours, orders flow directly from the customer's phone to our kitchen
              display in real time. We’ve cut table wait times significantly, eliminated paper ticket confusion, and our
              guests love how modern and effortless the QR ordering feels. The POS billing is rock solid!”
            </p>

            <div className={styles.quoteSignoff}>
              <div className={styles.signoffAvatar}>
                LM
              </div>
              <div className={styles.signoffText}>
                <span className={styles.signoffName}>Operations & Management</span>
                <span className={styles.signoffRole}>The Land Mark Cafe, Jaipur</span>
              </div>
            </div>
          </div>

          {/* Impact Metrics */}
          <div ref={metricsRef} className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricValue}>&lt; 15 Sec</span>
              <span className={styles.metricLabel}>Table-to-Kitchen KOT Dispatch</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricValue}>+35%</span>
              <span className={styles.metricLabel}>Faster Weekend Table Turnover</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricValue}>0</span>
              <span className={styles.metricLabel}>Paper Ticket Mix-ups or Lost Orders</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricValue}>100%</span>
              <span className={styles.metricLabel}>App-Free Instant UPI Payments</span>
            </div>
          </div>
        </div>

        {/* Secondary Supporting Real-World Reviews */}
        <div ref={secondaryRef} className={styles.secondaryGrid}>
          <div className={styles.secondaryCard}>
            <div>
              <div className={styles.starGroup} style={{ marginBottom: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: 14, height: 14, fill: "#f59e0b", color: "#f59e0b" }} />
                ))}
              </div>
              <p className={styles.secondaryQuote}>
                “The kitchen display system (KDS) ended kitchen shouting matches. Line cooks see every custom note and modifier clearly color-coded on the screen.”
              </p>
            </div>
            <div className={styles.secondaryFooter}>
              <span className={styles.secondaryAuthor}>Kitchen Ops Team</span>
              <span className={styles.secondaryContext}>The Land Mark Cafe • Jaipur</span>
            </div>
          </div>

          <div className={styles.secondaryCard}>
            <div>
              <div className={styles.starGroup} style={{ marginBottom: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: 14, height: 14, fill: "#f59e0b", color: "#f59e0b" }} />
                ))}
              </div>
              <p className={styles.secondaryQuote}>
                “Our cashiers learned DineviQ in 10 minutes. Generating GST invoices and closing nightly drawer totals is effortlessly fast.”
              </p>
            </div>
            <div className={styles.secondaryFooter}>
              <span className={styles.secondaryAuthor}>Billing & Floor Staff</span>
              <span className={styles.secondaryContext}>The Land Mark Cafe • Jaipur</span>
            </div>
          </div>

          <div className={styles.secondaryCard}>
            <div>
              <div className={styles.starGroup} style={{ marginBottom: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} style={{ width: 14, height: 14, fill: "#f59e0b", color: "#f59e0b" }} />
                ))}
              </div>
              <p className={styles.secondaryQuote}>
                “Customers often compliment the sleek QR menu interface. It feels like an upscale digital experience without forcing anyone to install an app.”
              </p>
            </div>
            <div className={styles.secondaryFooter}>
              <span className={styles.secondaryAuthor}>Guest Experience Team</span>
              <span className={styles.secondaryContext}>Jaipur Cafe Hub</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

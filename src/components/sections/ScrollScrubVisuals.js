import React, { useEffect, useRef } from 'react';
import {
  QrCode,
  ChefHat,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  posFloorplanImg,
  kdsQueueImg
} from '../../assets/screweenshots';
import styles from '../../styles/ScrollScrubVisuals.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollScrubVisuals() {
  const containerRef = useRef(null);
  const stage1Ref = useRef(null);
  const stage1ImgRef = useRef(null);
  const stage2Ref = useRef(null);
  const stage2ImgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop Viewport (>= 769px): Full 3D Tilt Scrub
      mm.add("(min-width: 769px)", () => {
        if (stage1ImgRef.current && stage1Ref.current) {
          gsap.fromTo(
            stage1ImgRef.current,
            { rotateY: -18, rotateX: 10, scale: 0.9, opacity: 0.5 },
            {
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: stage1Ref.current,
                start: 'top 85%',
                end: 'top 25%',
                scrub: 1.2
              }
            }
          );
        }

        if (stage2ImgRef.current && stage2Ref.current) {
          gsap.fromTo(
            stage2ImgRef.current,
            { rotateY: 18, rotateX: 10, scale: 0.9, opacity: 0.5 },
            {
              rotateY: 0,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: stage2Ref.current,
                start: 'top 85%',
                end: 'top 25%',
                scrub: 1.2
              }
            }
          );
        }
      });

      // Mobile Viewport (<= 768px): Trigger directly on the image cards so scrub happens in viewport
      mm.add("(max-width: 768px)", () => {
        if (stage1ImgRef.current) {
          gsap.fromTo(
            stage1ImgRef.current,
            { y: 35, scale: 0.93, opacity: 0.35 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: stage1ImgRef.current,
                start: 'top 92%',
                end: 'top 52%',
                scrub: 0.8
              }
            }
          );
        }

        if (stage2ImgRef.current) {
          gsap.fromTo(
            stage2ImgRef.current,
            { y: 35, scale: 0.93, opacity: 0.35 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: stage2ImgRef.current,
                start: 'top 92%',
                end: 'top 52%',
                scrub: 0.8
              }
            }
          );
        }
      });
    }, containerRef);

    // Refresh ScrollTrigger to ensure exact trigger coordinates
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className={styles.scrubSection}>
      <div className="container">

        {/* Small & Crisp Section Header */}
        <div className={styles.mainHeader}>
          <div className="badge-pill badge-blue" style={{ padding: '3px 10px', fontSize: 10.5 }}>
            <Zap style={{ width: 12, height: 12 }} />
            <span>Autonomous Connected Flywheel</span>
          </div>

          <h2 className={styles.mainTitle}>
            How DINEVIQ Flows Through Every Second of Peak Rush
          </h2>

          <p className={styles.mainSubtitle}>
            Watch your table turnover accelerate as every step is synchronized with sub-50ms WebSocket telemetry.
          </p>
        </div>

        {/* ── STAGE 1: Guest Scan & POS Floorplan ── */}
        <div ref={stage1Ref} className={styles.stageBlock}>
          <div className={styles.stageInfo}>
            <div className={styles.stepBadge}>
              <span>01 • FRONT OF HOUSE</span>
            </div>
            <h3 className={styles.stageTitle}>
              Table QR Dining &amp; Instant Floorplan Sync
            </h3>
            <p className={styles.stageDesc}>
              Diners scan custom table standees to access visual menus in ₹. No waiter delays, no app downloads, and instant order placement.
            </p>

            <div className={styles.statPillsList}>
              <div className={styles.statPill}>
                <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />
                <span>Zero Server Wait Time</span>
              </div>
              <div className={styles.statPill}>
                <TrendingUp style={{ width: 14, height: 14, color: '#38bdf8' }} />
                <span>+24% Average Bill Size via Visual Modifiers</span>
              </div>
              <div className={styles.statPill}>
                <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
                <span>Instant Direct UPI Settlements</span>
              </div>
            </div>
          </div>

          <div className={styles.perspectiveWrap}>
            <div ref={stage1ImgRef} className={styles.stageCard3D}>
              <img
                src={posFloorplanImg}
                alt="DINEVIQ POS Floorplan and Table Seating"
                className={styles.stageImg}
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* ── STAGE 2: Real-Time Kitchen KDS Queue ── */}
        <div ref={stage2Ref} className={`${styles.stageBlock} ${styles.stageBlockReverse}`}>
          <div className={styles.stageInfo}>
            <div className={styles.stepBadge}>
              <span>02 • BACK OF HOUSE</span>
            </div>
            <h3 className={styles.stageTitle}>
              Paperless Kitchen Display (KDS) &amp; SLA Timers
            </h3>
            <p className={styles.stageDesc}>
              Orders route directly to Grill, Bar, Fryer, and Pass queues in sub-50ms. Color-coded timers ensure chefs never drop ticket cadence.
            </p>

            <div className={styles.statPillsList}>
              <div className={styles.statPill}>
                <Clock style={{ width: 14, height: 14, color: '#f59e0b' }} />
                <span>Sub-50ms Instant KOT Dispatch</span>
              </div>
              <div className={styles.statPill}>
                <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />
                <span>100% Elimination of Lost Paper KOTs</span>
              </div>
              <div className={styles.statPill}>
                <ChefHat style={{ width: 14, height: 14, color: '#a855f7' }} />
                <span>Multi-Station Prep Balancing</span>
              </div>
            </div>
          </div>

          <div className={styles.perspectiveWrap}>
            <div ref={stage2ImgRef} className={styles.stageCard3D}>
              <img
                src={kdsQueueImg}
                alt="DINEVIQ Real-Time Kitchen Display Queue"
                className={styles.stageImg}
                loading="lazy"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Coffee, Clock, Zap, CheckCircle2, ChevronDown } from 'lucide-react';
import styles from '../../styles/CoffeeCraftExperience.module.css';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 20;

const getFramePath = (index) => {
  const pad = String(index).padStart(3, '0');
  return `/hero-frames/ezgif-frame-${pad}.jpg`;
};

const STAGES = [
  {
    range: [0, 0.35],
    tag: "STAGE 01",
    title: "Instant KOT to Barista Station",
    description: "Orders placed via Customer QR or Cloud POS land on the barista KDS in under 50ms with custom milk, roast, and modifier preferences.",
    icon: Zap,
    accent: "#38bdf8"
  },
  {
    range: [0.35, 0.70],
    tag: "STAGE 02",
    title: "Precision Craft & Steaming",
    description: "Barista crafts each beverage with zero ticket clutter. Multi-station balancing ensures drinks and food finish in perfect synchrony.",
    icon: Coffee,
    accent: "#f59e0b"
  },
  {
    range: [0.70, 1.0],
    tag: "STAGE 03",
    title: "Perfection in Every Cup",
    description: "Finished beverage served to the guest while raw milk and coffee bean stock deplete at the recipe level in real-time.",
    icon: Sparkles,
    accent: "#10b981"
  }
];

export default function CoffeeCraftExperience({ onOpenDemo }) {
  const sectionRef = useRef(null);
  const pinWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);

  // High-performance DOM Refs (Zero React re-render during scroll!)
  const percentTextRef = useRef(null);
  const segmentFillRefs = useRef([]);
  const stageCardRef = useRef(null);
  const stageTagRef = useRef(null);
  const stageTitleRef = useRef(null);
  const stageDescRef = useRef(null);
  const stageIconWrapRef = useRef(null);

  const activeStageRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef(null);

  // Cached canvas dimensions and offscreen scaling
  const dimsRef = useRef({ width: 1920, height: 1080, scale: 1, ox: 0, oy: 0 });
  const lastDrawnFrameRef = useRef(-1);

  // Measure and resize canvas once on resize
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const imgW = 1920;
    const imgH = 1080;
    const scale = Math.max(w / imgW, h / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    dimsRef.current = {
      width: w,
      height: h,
      scale,
      drawW,
      drawH,
      ox: (w - drawW) / 2,
      oy: (h - drawH) / 2
    };

    lastDrawnFrameRef.current = -1; // force redraw
  }, []);

  // Preload and decode all 20 frames into memory
  useEffect(() => {
    let loadedCount = 0;
    const images = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) {
          updateCanvasDimensions();
          renderCanvasFrame(0);
        }
      };
      images.push(img);
    }

    imagesRef.current = images;

    window.addEventListener('resize', updateCanvasDimensions, { passive: true });

    return () => {
      imagesRef.current = [];
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [updateCanvasDimensions]);

  // Fast canvas frame rendering with zero-reallocation & sub-frame crossfade
  const renderCanvasFrame = (progressFloat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const images = imagesRef.current;
    if (!images || images.length === 0) return;

    const maxIdx = TOTAL_FRAMES - 1;
    const clampedProgress = Math.max(0, Math.min(1, progressFloat));
    const exact = clampedProgress * maxIdx;
    const floorIdx = Math.floor(exact);
    const ceilIdx = Math.min(maxIdx, floorIdx + 1);
    const blend = exact - floorIdx;

    const baseImg = images[floorIdx];
    if (!baseImg || !baseImg.complete) return;

    const { ox, oy, drawW, drawH } = dimsRef.current;

    // Draw main frame
    ctx.globalAlpha = 1.0;
    ctx.drawImage(baseImg, ox, oy, drawW, drawH);

    // Smooth sub-frame blend for continuous motion
    if (blend > 0.02 && floorIdx !== ceilIdx) {
      const nextImg = images[ceilIdx];
      if (nextImg && nextImg.complete) {
        ctx.globalAlpha = blend;
        ctx.drawImage(nextImg, ox, oy, drawW, drawH);
      }
    }
  };

  // Dedicated 60fps rAF Loop (Decouples scroll from render!)
  useEffect(() => {
    const loop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0002) {
        currentProgressRef.current += diff * 0.14; // smooth inertia
        renderCanvasFrame(currentProgressRef.current);
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // GSAP ScrollTrigger PIN Setup (Zero React setState in onUpdate!)
  useEffect(() => {
    updateCanvasDimensions();

    const ctx = gsap.context(() => {
      const pinTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=2400",
        pin: pinWrapperRef.current,
        pinSpacing: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          targetProgressRef.current = p;

          // Direct DOM updates (Instant 0ms, Zero React re-render!)
          const pct = Math.round(p * 100);
          if (percentTextRef.current) {
            percentTextRef.current.innerText = pct < 98 ? `Scroll down to pour latte (${pct}%)` : `Sequence complete ✓ Continue exploring`;
          }

          // Update timeline segment widths
          STAGES.forEach((s, idx) => {
            const fillEl = segmentFillRefs.current[idx];
            if (fillEl) {
              const segPct = Math.max(0, Math.min(100, ((p - s.range[0]) / (s.range[1] - s.range[0])) * 100));
              fillEl.style.width = `${segPct}%`;
            }
          });

          // Update stage text only when stage boundary crosses
          let newStage = 0;
          if (p >= 0.70) newStage = 2;
          else if (p >= 0.35) newStage = 1;

          if (newStage !== activeStageRef.current) {
            activeStageRef.current = newStage;
            const sInfo = STAGES[newStage];
            if (stageTagRef.current) {
              stageTagRef.current.innerText = sInfo.tag;
              stageTagRef.current.style.color = sInfo.accent;
            }
            if (stageTitleRef.current) {
              stageTitleRef.current.innerText = sInfo.title;
            }
            if (stageDescRef.current) {
              stageDescRef.current.innerText = sInfo.description;
            }
            if (stageIconWrapRef.current) {
              stageIconWrapRef.current.style.background = `${sInfo.accent}25`;
            }
          }
        }
      });

      return () => pinTrigger.kill();
    }, sectionRef);

    return () => ctx.revert();
  }, [updateCanvasDimensions]);

  const defaultStage = STAGES[0];
  const StageIcon = defaultStage.icon;

  return (
    <section ref={sectionRef} className={styles.experienceSection} id="craft-experience">
      <div ref={pinWrapperRef} className={styles.pinWrapper}>
        {/* Background Canvas */}
        <canvas ref={canvasRef} className={styles.frameCanvas} />

        {/* Ambient Overlay Gradients */}
        <div className={styles.overlayVeil} />
        <div className={styles.vignetteTop} />
        <div className={styles.vignetteBottom} />

        {/* Floating Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.sectionBadge}>
            <span className={styles.badgeDot} />
            <span>INTERACTIVE RESTAURANT FLOW • SCROLL TO EXPLORE</span>
          </div>
          <h2 className={styles.mainHeading}>
            Artisan Craftsmanship. <span className={styles.gradientHeading}>Autonomous Speed.</span>
          </h2>
        </header>

        {/* Storytelling Narrative Card (Left-Aligned Floating Glass Card) */}
        <aside ref={stageCardRef} className={styles.narrativeCard} aria-live="polite">
          <div className={styles.stageTag} style={{ color: defaultStage.accent }}>
            <span ref={stageIconWrapRef} className={styles.stageIconWrap} style={{ background: `${defaultStage.accent}20` }}>
              <StageIcon size={16} color={defaultStage.accent} />
            </span>
            <span ref={stageTagRef}>{defaultStage.tag}</span>
          </div>

          <h3 ref={stageTitleRef} className={styles.stageTitle}>{defaultStage.title}</h3>
          <p ref={stageDescRef} className={styles.stageDescription}>{defaultStage.description}</p>

          <div className={styles.stageMiniMetrics}>
            <div className={styles.miniMetric}>
              <span className={styles.miniMetricVal}>&lt; 50ms</span>
              <span className={styles.miniMetricLabel}>KOT Dispatch</span>
            </div>
            <div className={styles.miniMetric}>
              <span className={styles.miniMetricVal}>100%</span>
              <span className={styles.miniMetricLabel}>Recipe Depletion</span>
            </div>
            <div className={styles.miniMetric}>
              <span className={styles.miniMetricVal}>0</span>
              <span className={styles.miniMetricLabel}>Paper Waste</span>
            </div>
          </div>
        </aside>

        {/* Bottom Progress Controls & Scroll Cue */}
        <footer className={styles.bottomControls}>
          {/* Segmented Timeline */}
          <div className={styles.timelineSegments}>
            {STAGES.map((s, idx) => (
              <div key={idx} className={styles.segment}>
                <div
                  ref={(el) => (segmentFillRefs.current[idx] = el)}
                  className={styles.segmentFill}
                  style={{ width: idx === 0 ? '0%' : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Interactive Scroll Status */}
          <div className={styles.scrollStatusRow}>
            <div className={styles.scrollPill}>
              <span className={styles.mouseWheelIcon}>
                <span className={styles.mouseWheelWheel} />
              </span>
              <span ref={percentTextRef}>
                Scroll down to pour latte (0%)
              </span>
            </div>

            {onOpenDemo && (
              <button
                type="button"
                onClick={onOpenDemo}
                className={styles.quickDemoBtn}
              >
                <span>Book Live Demo</span>
                <Sparkles size={14} />
              </button>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}

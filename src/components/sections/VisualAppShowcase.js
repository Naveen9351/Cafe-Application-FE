import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  ChefHat,
  BarChart3,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Store,
  Layers,
  UtensilsCrossed
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  dashboardImg,
  posFloorplanImg,
  kdsQueueImg,
  menuCatalogImg,
  tableQrCodesImg,
  customerCrmImg,
  khataLedgerImg,
  reportsSuiteImg
} from '../../assets/screweenshots';
import styles from '../../styles/VisualAppShowcase.module.css';

gsap.registerPlugin(ScrollTrigger);

// 8 Workflow screens (Step 9 removed as requested)
const APP_SCREENS = [
  {
    id: 'dashboard',
    name: 'Telemetry Dashboard',
    image: dashboardImg,
    url: 'dineviq.com/app/dashboard'
  },
  {
    id: 'pos',
    name: 'POS Terminal & Floorplan',
    image: posFloorplanImg,
    url: 'dineviq.com/app/pos-terminal'
  },
  {
    id: 'kds',
    name: 'Kitchen Display (KDS)',
    image: kdsQueueImg,
    url: 'dineviq.com/app/kitchen-kds'
  },
  {
    id: 'menu',
    name: 'Digital Menu Catalog',
    image: menuCatalogImg,
    url: 'dineviq.com/app/menu-catalog'
  },
  {
    id: 'qr',
    name: 'Table QR Ordering',
    image: tableQrCodesImg,
    url: 'dineviq.com/app/table-qr'
  },
  {
    id: 'crm',
    name: 'Customer CRM',
    image: customerCrmImg,
    url: 'dineviq.com/app/customer-crm'
  },
  {
    id: 'khata',
    name: 'Customer Khata Ledger',
    image: khataLedgerImg,
    url: 'dineviq.com/app/khata-ledger'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    image: reportsSuiteImg,
    url: 'dineviq.com/app/reports'
  }
];

export default function VisualAppShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const containerRef = useRef(null);
  const imageFrameRef = useRef(null);

  const currentScreen = APP_SCREENS[activeTab];

  // Auto-cycle through screens every 7 seconds unless user manually selects
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % APP_SCREENS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // High-Impact GSAP Scroll Scrub & 3D Perspective
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imageFrameRef.current && containerRef.current) {
        gsap.fromTo(
          imageFrameRef.current,
          { rotateX: 10, scale: 0.94, y: 40, opacity: 0.4 },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 85%",
              end: "top 35%",
              scrub: 1.2
            }
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // GSAP animation when activeTab changes
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imageFrameRef.current) {
        gsap.fromTo(
          imageFrameRef.current,
          { opacity: 0.4, scale: 0.99 },
          { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab]);

  const handleSelectTab = (idx) => {
    setIsAutoPlaying(false);
    setActiveTab(idx);
  };

  // Interactive 3D Holographic Mouse Move Tilt
  const handleMouseMove = (e) => {
    if (!imageFrameRef.current) return;
    const rect = imageFrameRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    gsap.to(imageFrameRef.current, {
      rotateY: x * 3.5,
      rotateX: -y * 3.5,
      duration: 0.4,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    if (!imageFrameRef.current) return;
    gsap.to(imageFrameRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: 'power2.out'
    });
  };

  return (
    <section ref={containerRef} className={styles.sectionWrapper}>
      <div className={styles.fullWidthContainer}>
        
        {/* Numbered Stepper (Steps 1 to 8) */}
        <div className={styles.stepperWrap}>
          <div className={styles.stepperTrack}>
            {APP_SCREENS.map((screen, idx) => {
              const stepNumber = idx + 1;
              const isActive = idx === activeTab;
              return (
                <button
                  key={screen.id}
                  type="button"
                  onClick={() => handleSelectTab(idx)}
                  className={`${styles.stepBtn} ${isActive ? styles.stepBtnActive : ''}`}
                  title={`${stepNumber}. ${screen.name}`}
                  aria-label={`Step ${stepNumber}: ${screen.name}`}
                >
                  <span className={styles.stepNum}>{stepNumber}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full-Screen Showcase Stage: Mac Glass Frame */}
        <div
          className={styles.stageContainer}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Ambient Lighting Behind Screen */}
          <div className={styles.stageGlow} />

          <div ref={imageFrameRef} className={styles.browserFrame}>
            {/* Window Topbar (Upper border kept clean) */}
            <div className={styles.browserHeader}>
              <div className={styles.windowDots}>
                <span className={`${styles.dot} ${styles.dotRed}`} />
                <span className={`${styles.dot} ${styles.dotYellow}`} />
                <span className={`${styles.dot} ${styles.dotGreen}`} />
              </div>

              <div className={styles.urlBar}>
                <span style={{ color: '#10b981' }}>https://</span>
                <span>{currentScreen.url}</span>
              </div>
            </div>

            {/* Screen Image — Clean & Full-Screen (Tags removed as requested) */}
            <div className={styles.imageViewport}>
              <img
                src={currentScreen.image}
                alt={currentScreen.name}
                className={styles.screenImage}
                loading="eager"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

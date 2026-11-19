import React, { useState, useEffect } from 'react';
import { Smartphone, Globe, Check, X, Sparkles, ExternalLink } from 'lucide-react';
import styles from './PWAOpenChooserModal.module.css';

export default function PWAOpenChooserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const evaluatePWAStatus = async () => {
      if (typeof window === 'undefined') return;

      // 1. If ALREADY running inside standalone PWA, never show this modal
      const isAlreadyStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');

      if (isAlreadyStandalone) {
        // Mark as installed for future browser sessions
        try {
          localStorage.setItem('dineviq_pwa_installed', 'true');
        } catch (e) {}
        return;
      }

      // 2. Check if dismissed for this tab/session or user saved "browser" preference
      try {
        const sessionDismissed = sessionStorage.getItem('dineviq_dismiss_pwa_chooser');
        if (sessionDismissed === 'true') return;

        const savedPreference = localStorage.getItem('dineviq_open_preference');
        if (savedPreference === 'browser') return;
      } catch (e) {}

      // 3. Strict Check: ONLY show if user has the PWA installed on this device
      let isInstalled = false;
      try {
        isInstalled = localStorage.getItem('dineviq_pwa_installed') === 'true';
      } catch (e) {}

      // If not marked in localStorage, query browser's getInstalledRelatedApps API (Chrome on Android / Tablet)
      if (!isInstalled && 'getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            isInstalled = true;
            try {
              localStorage.setItem('dineviq_pwa_installed', 'true');
            } catch (e) {}
          }
        } catch (err) {
          // getInstalledRelatedApps not supported or failed
        }
      }

      // STRICT REQUIREMENT: If the user does NOT have the PWA installed, DO NOT SHOW
      if (!isInstalled) {
        return;
      }

      if (isMounted) {
        // Delay slightly for smooth page entrance
        setTimeout(() => {
          if (isMounted) setIsOpen(true);
        }, 600);
      }
    };

    evaluatePWAStatus();

    // Also listen for appinstalled event
    const handleAppInstalled = () => {
      try {
        localStorage.setItem('dineviq_pwa_installed', 'true');
      } catch (e) {}
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      isMounted = false;
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleOpenInApp = () => {
    try {
      if (rememberChoice) {
        localStorage.setItem('dineviq_open_preference', 'app');
      }
      sessionStorage.setItem('dineviq_dismiss_pwa_chooser', 'true');
    } catch (e) {}

    setIsOpen(false);
    // Direct into the PWA / Admin Dashboard
    window.location.href = '/admin/dashboard';
  };

  const handleContinueInBrowser = () => {
    try {
      if (rememberChoice) {
        localStorage.setItem('dineviq_open_preference', 'browser');
      }
      sessionStorage.setItem('dineviq_dismiss_pwa_chooser', 'true');
    } catch (e) {}

    setIsOpen(false);
  };

  const handleClose = () => {
    try {
      sessionStorage.setItem('dineviq_dismiss_pwa_chooser', 'true');
    } catch (e) {}
    setIsOpen(false);
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className={styles.closeBtn}
          title="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header Icon + Title */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <img src="/icon-192.png" alt="DINEVIQ App Icon" className={styles.logoImg} />
            <span className={styles.onlineBadge}>
              <span className={styles.onlinePulse} />
            </span>
          </div>

          <div className={styles.badgeRow}>
            <span className={styles.installedBadge}>
              <Sparkles size={12} /> App Installed on this Device
            </span>
          </div>

          <h3 className={styles.title}>Where would you like to open DINEVIQ?</h3>
          <p className={styles.subtitle}>
            You have the DINEVIQ app installed on this tablet/device. Choose how you want to continue.
          </p>
        </div>

        {/* Choice Tiles */}
        <div className={styles.optionsGrid}>
          {/* Option 1: Open in App (Recommended) */}
          <button
            type="button"
            className={`${styles.optionTile} ${styles.optionTilePrimary}`}
            onClick={handleOpenInApp}
          >
            <div className={styles.tileIconWrapApp}>
              <Smartphone size={22} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>Open in DINEVIQ App</span>
                <span className={styles.recommendedBadge}>Recommended</span>
              </div>
              <p className={styles.tileDesc}>
                Full-screen kiosk mode, silent thermal printing & fastest POS performance.
              </p>
            </div>
            <div className={styles.tileArrow}>→</div>
          </button>

          {/* Option 2: Continue in Browser */}
          <button
            type="button"
            className={styles.optionTile}
            onClick={handleContinueInBrowser}
          >
            <div className={styles.tileIconWrapBrowser}>
              <Globe size={22} />
            </div>
            <div className={styles.tileContent}>
              <span className={styles.tileTitle}>Continue in Web Browser</span>
              <p className={styles.tileDesc}>
                Stay in this Chrome tab and browse standard web pages.
              </p>
            </div>
            <div className={styles.tileArrow}>→</div>
          </button>
        </div>

        {/* Footer with Remember Choice Checkbox */}
        <div className={styles.footer}>
          <label className={styles.rememberLabel}>
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className={styles.rememberCheckbox}
            />
            <span>Remember my choice on this tablet</span>
          </label>
        </div>
      </div>
    </div>
  );
}

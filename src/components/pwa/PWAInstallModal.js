import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Apple,
  CheckCircle2,
  Share,
  PlusSquare,
  Zap,
  WifiOff,
  Printer,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import styles from './PWAInstallModal.module.css';

export default function PWAInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  isInstalled,
  isIOS,
  isAndroid
}) {
  const [activeTab, setActiveTab] = useState(
    isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  );
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        setIsInstalling(true);
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          onClose();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.appIconWrap}>
              <img src="/icon-192.png" alt="SERVIQ App Icon" className={styles.appIconImg} />
            </div>
            <div className={styles.titleArea}>
              <h3>Download SERVIQ Admin</h3>
              <div className={styles.badgeRow}>
                <span className={styles.badgePWA}>Desktop PWA</span>
                <span className={styles.versionTag}>v2.4 Pro</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          
          {/* OS Guide Tabs */}
          <div className={styles.tabsNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'desktop' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('desktop')}
            >
              <Monitor size={13} /> Windows / Desktop
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'android' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('android')}
            >
              <Smartphone size={13} /> Android / Chrome
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'ios' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('ios')}
            >
              <Apple size={13} /> iPhone / iPad
            </button>
          </div>

          {/* Instructions Box */}
          <div className={styles.instructionsBox}>
            {activeTab === 'desktop' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    Click the <strong>"Open in app"</strong> icon in your browser URL bar (top right).
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    In the app window, click <strong>⋮ (3 dots) → "App info"</strong> or <strong>"Create shortcut..."</strong>.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <p className={styles.stepDesc}>
                    Check <strong>"Desktop"</strong> to place the SERVIQ Admin icon directly on your Windows desktop.
                  </p>
                </div>
                <div className={styles.chromeTip}>
                  💡 <em>Quick tip:</em> You can also visit <code>chrome://apps</code>, right-click <strong>SERVIQ</strong>, and select <strong>"Create shortcuts..."</strong>.
                </div>
              </div>
            )}

            {activeTab === 'android' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    Tap <span className={styles.highlightTag}>⋮ (Menu)</span> at the top right of Chrome.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    In Safari, tap <Share size={12} style={{ display: 'inline', verticalAlign: 'middle', color: '#38bdf8' }} /> <strong>Share</strong> → <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          {deferredPrompt ? (
            <button
              type="button"
              className={styles.primaryInstallBtn}
              onClick={handleNativeInstall}
              disabled={isInstalling}
            >
              <Download size={14} />
              <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryInstallBtn}
              onClick={onClose}
            >
              <CheckCircle2 size={14} />
              <span>Got It</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}


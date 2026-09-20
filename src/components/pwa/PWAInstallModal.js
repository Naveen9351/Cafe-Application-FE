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
                <span className={styles.badgePWA}>Progressive Web App (PWA)</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>v2.4 Pro</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          
          {/* Key Advantages Grid */}
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <Zap size={16} className={styles.featureIcon} />
              <div className={styles.featureText}>
                <h4>Ultra Fast Standalone</h4>
                <p>Launches instantly from your desktop or home screen without browser bars.</p>
              </div>
            </div>
            <div className={styles.featureCard}>
              <WifiOff size={16} className={styles.featureIcon} />
              <div className={styles.featureText}>
                <h4>Offline POS Cache</h4>
                <p>Keep taking orders and managing tables even during Wi-Fi drops.</p>
              </div>
            </div>
            <div className={styles.featureCard}>
              <Printer size={16} className={styles.featureIcon} />
              <div className={styles.featureText}>
                <h4>Direct Hardware Access</h4>
                <p>Native thermal receipt printing & fast USB/Bluetooth barcode scanning.</p>
              </div>
            </div>
            <div className={styles.featureCard}>
              <ShieldCheck size={16} className={styles.featureIcon} />
              <div className={styles.featureText}>
                <h4>Auto Updates</h4>
                <p>Always running the latest secure version with zero manual updates.</p>
              </div>
            </div>
          </div>

          {/* OS Guide Tabs */}
          <div className={styles.tabsNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'desktop' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('desktop')}
            >
              <Monitor size={14} /> Desktop / PC / Mac
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'android' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('android')}
            >
              <Smartphone size={14} /> Android / Chrome
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'ios' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('ios')}
            >
              <Apple size={14} /> iPhone / iPad
            </button>
          </div>

          {/* Instructions Box */}
          <div className={styles.instructionsBox}>
            {activeTab === 'desktop' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    Click the <strong>"Install Application"</strong> button below or look for the <span className={styles.highlightTag}>Install icon</span> on the right side of your Chrome/Edge address bar.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    Confirm by clicking <strong>"Install"</strong> in the browser prompt.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <p className={styles.stepDesc}>
                    SERVIQ Admin will launch in a dedicated high-performance desktop window and create a desktop shortcut.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'android' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    Tap the <strong>"Install Application"</strong> button below, or tap the <span className={styles.highlightTag}>⋮ (Three Dots)</span> menu at the top right of Chrome.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <p className={styles.stepDesc}>
                    The SERVIQ POS & Kitchen app icon will be added to your device app drawer and home screen.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    In Safari, tap the <strong>Share</strong> button <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#38bdf8' }} /> in the bottom bar.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#38bdf8' }} />.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <p className={styles.stepDesc}>
                    Tap <strong>"Add"</strong> in the top-right corner to install SERVIQ as a full-screen iOS app.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          {isInstalled ? (
            <div className={styles.installedBanner}>
              <CheckCircle2 size={18} />
              <span>SERVIQ Admin is already running as an Installed App</span>
            </div>
          ) : deferredPrompt ? (
            <>
              <button
                type="button"
                className={styles.primaryInstallBtn}
                onClick={handleNativeInstall}
                disabled={isInstalling}
              >
                <Download size={16} />
                <span>{isInstalling ? 'Installing...' : 'Install Application Now'}</span>
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onClose}
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.primaryInstallBtn}
                onClick={onClose}
              >
                <CheckCircle2 size={16} />
                <span>Got It</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Apple,
  CheckCircle2,
  Share,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
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

  const downloadShortcutFile = () => {
    try {
      const origin = window.location.origin || 'http://localhost:3000';
      const shortcutContent = `[InternetShortcut]\r\nURL=${origin}/admin/dashboard\r\nIconIndex=0\r\nIconFile=${origin}/favicon.ico\r\n`;
      const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'SERVIQ Admin.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      toast.success('Shortcut file downloaded! Drag it onto your desktop.');
    } catch (err) {
      console.log('Download error:', err);
    }
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        setIsInstalling(true);
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          onClose();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      downloadShortcutFile();
      onClose();
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
                    Click the <strong>Desktop App icon</strong> in your browser address bar (top right).
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    In the app window, click <strong>⋮ (3 dots) → "Create shortcut..."</strong> or pin to taskbar.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <p className={styles.stepDesc}>
                    Or click below to download the shortcut file directly to your desktop.
                  </p>
                </div>

                <div style={{ marginTop: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={downloadShortcutFile}
                    style={{
                      width: '100%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <FileDown size={14} />
                    <span>Download Desktop Shortcut File (.url)</span>
                  </button>
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

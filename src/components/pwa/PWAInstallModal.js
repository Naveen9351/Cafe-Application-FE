import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Apple,
  CheckCircle2,
  Share,
  Sparkles,
  ExternalLink,
  Laptop,
  AlertCircle
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
    isIOS ? 'ios' : isAndroid ? 'android' : 'windows'
  );
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleDownloadWindowsExe = (type = 'setup') => {
    const fileName = type === 'portable'
      ? 'ServiQ-Staff-Terminal-Portable.exe'
      : 'ServiQ-Staff-Terminal-Setup.exe';
    const downloadUrl = `/downloads/${fileName}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${type === 'portable' ? 'Portable' : 'Installer'} (.exe)...`);
  };

  const handleDownloadMacDmg = () => {
    const macUrl = 'https://github.com/Naveen9351/Cafe-Desktop/releases';
    window.open(macUrl, '_blank');
    toast.success('Opening macOS download page on GitHub Releases...');
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
              <h3>Staff Terminal Downloads</h3>
              <div className={styles.badgeRow}>
                <span className={styles.badgePWA}>Desktop & POS</span>
                <span className={styles.versionTag}>v1.0 Pro</span>
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
          
          {/* OS Switcher Tabs */}
          <div className={styles.tabsNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'windows' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('windows')}
            >
              <Monitor size={14} /> Windows
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'mac' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('mac')}
            >
              <Apple size={14} /> macOS
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'android' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('android')}
            >
              <Smartphone size={14} /> Android
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'ios' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('ios')}
            >
              <Share size={14} /> iOS
            </button>
          </div>

          {/* Instructions / Actions Box */}
          <div className={styles.instructionsBox}>
            {/* WINDOWS TAB */}
            {activeTab === 'windows' && (
              <div>
                <div className={styles.cardSection}>
                  <div className={styles.cardTitle}>
                    <Sparkles size={16} style={{ color: '#60a5fa' }} />
                    <span>Windows Staff & POS Desktop Terminal</span>
                  </div>
                  <div className={styles.cardSubtitle}>
                    Silent thermal printing, F11 kiosk mode & instant cloud sync.
                  </div>

                  <div className={styles.actionButtonGroup}>
                    <button
                      type="button"
                      onClick={() => handleDownloadWindowsExe('setup')}
                      className={styles.btnPrimaryDownload}
                    >
                      <Download size={16} />
                      <span>Download Windows Installer (.exe)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadWindowsExe('portable')}
                      className={styles.btnSecondaryDownload}
                    >
                      <Laptop size={14} />
                      <span>Download Portable Single-File (.exe)</span>
                    </button>
                  </div>
                </div>

                <div className={styles.defenderAlert}>
                  <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                  <div className={styles.defenderAlertText}>
                    <strong>First-time Windows launch:</strong> If Windows SmartScreen appears, simply click <u>More info</u> → <u>Run anyway</u>.
                  </div>
                </div>
              </div>
            )}

            {/* MAC TAB */}
            {activeTab === 'mac' && (
              <div>
                <div className={styles.cardSection}>
                  <div className={styles.cardTitle}>
                    <Apple size={16} />
                    <span>macOS Staff Terminal (.dmg)</span>
                  </div>
                  <div className={styles.cardSubtitle}>
                    Supports Apple Silicon (M1/M2/M3/M4) & Intel Macs.
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadMacDmg}
                    className={styles.btnPrimaryDownload}
                    style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' }}
                  >
                    <Download size={16} />
                    <span>Download macOS Installer (.dmg)</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ANDROID TAB */}
            {activeTab === 'android' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    Tap <span className={styles.highlightTag}>⋮ (Menu)</span> in Chrome browser.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* IOS TAB */}
            {activeTab === 'ios' && (
              <div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <p className={styles.stepDesc}>
                    In Safari, tap <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#60a5fa' }} /> <strong>Share</strong> icon.
                  </p>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <p className={styles.stepDesc}>
                    Scroll and tap <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          {deferredPrompt && (
            <button
              type="button"
              className={styles.btnSecondaryDownload}
              onClick={handleNativeInstall}
              disabled={isInstalling}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              <Download size={14} />
              <span>{isInstalling ? 'Installing PWA...' : 'Quick Install PWA'}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.doneBtn}
            onClick={onClose}
          >
            <CheckCircle2 size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
}

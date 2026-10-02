import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Apple,
  CheckCircle2,
  Share,
  FileDown,
  Sparkles,
  ExternalLink,
  Laptop
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
    
    toast.success(`Downloading Windows ${type === 'portable' ? 'Portable' : 'Installer'} (.exe)... Check browser downloads.`);
  };

  const handleDownloadMacDmg = () => {
    const macUrl = 'https://github.com/Naveen9351/Cafe-Desktop/releases';
    window.open(macUrl, '_blank');
    toast.success('Opening macOS releases download page...');
  };

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
              <h3>Download Staff & POS Terminal</h3>
              <div className={styles.badgeRow}>
                <span className={styles.badgePWA}>Desktop & Mobile</span>
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
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          
          {/* OS Guide Tabs */}
          <div className={styles.tabsNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'windows' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('windows')}
            >
              <Monitor size={13} /> Windows (.exe)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'mac' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('mac')}
            >
              <Apple size={13} /> macOS (.dmg)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'android' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('android')}
            >
              <Smartphone size={13} /> Android / PWA
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'ios' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('ios')}
            >
              <Share size={13} /> iOS / Safari
            </button>
          </div>

          {/* Instructions Box */}
          <div className={styles.instructionsBox}>
            {/* WINDOWS TAB */}
            {activeTab === 'windows' && (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.03) 100%)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 10,
                  padding: '12px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e3a8a', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Sparkles size={15} color="#2563eb" /> Dedicated Windows Desktop App
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 10 }}>
                    Silent receipt printing, F11 kiosk mode, and direct live server sync.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadWindowsExe('setup')}
                      style={{
                        width: '100%',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                      }}
                    >
                      <Download size={15} />
                      <span>Download Windows Installer (.exe)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadWindowsExe('portable')}
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '7px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Laptop size={13} />
                      <span>Download Portable Single-File (.exe)</span>
                    </button>
                  </div>
                </div>

                <div className={styles.chromeTip}>
                  💡 <em>Installation:</em> Double click the downloaded <strong>.exe</strong> file to install or launch immediately.
                </div>
              </div>
            )}

            {/* MAC TAB */}
            {activeTab === 'mac' && (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.05) 0%, rgba(30,41,59,0.02) 100%)',
                  border: '1px solid rgba(148,163,184,0.25)',
                  borderRadius: 10,
                  padding: '12px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Apple size={15} /> macOS Staff Terminal (.dmg)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 10 }}>
                    Compatible with Apple Silicon (M1/M2/M3/M4) & Intel Macs.
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadMacDmg}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(15,23,42,0.2)'
                    }}
                  >
                    <Download size={15} />
                    <span>Download macOS Installer (.dmg)</span>
                    <ExternalLink size={13} />
                  </button>
                </div>

                <div className={styles.chromeTip}>
                  💡 <em>Mac Tip:</em> Open the <code>.dmg</code> file and drag <strong>ServiQ</strong> to your Applications folder.
                </div>
              </div>
            )}

            {/* ANDROID TAB */}
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

            {/* IOS TAB */}
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
          {deferredPrompt && (
            <button
              type="button"
              className={styles.primaryInstallBtn}
              onClick={handleNativeInstall}
              disabled={isInstalling}
            >
              <Download size={14} />
              <span>{isInstalling ? 'Installing PWA...' : 'Quick Install PWA'}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.primaryInstallBtn}
            onClick={onClose}
            style={deferredPrompt ? { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' } : {}}
          >
            <CheckCircle2 size={14} />
            <span>Done</span>
          </button>
        </div>

      </div>
    </div>
  );
}

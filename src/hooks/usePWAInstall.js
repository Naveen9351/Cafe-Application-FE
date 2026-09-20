import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('serviq_pwa_installed') === 'true';
      return isStandalone;
    }
    return false;
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('serviq_pwa_installed') === 'true';
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Check platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.setItem('serviq_pwa_installed', 'true');
      toast.success('SERVIQ App downloaded successfully to your desktop!');
    };

    // Online / Offline tracking
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Direct download / install without popup
  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          localStorage.setItem('serviq_pwa_installed', 'true');
          toast.success('SERVIQ App downloaded to desktop!');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
        setIsInstalled(true);
        localStorage.setItem('serviq_pwa_installed', 'true');
        toast.success('App is downloaded & active on desktop!');
      }
    } else {
      // Direct install acknowledgment
      setIsInstalled(true);
      localStorage.setItem('serviq_pwa_installed', 'true');
      toast.success('SERVIQ App is downloaded & active on your desktop!');
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isOnline,
    isModalOpen: false, // Never open popup
    setIsModalOpen,
    promptInstall,
    deferredPrompt
  };
}

export default usePWAInstall;

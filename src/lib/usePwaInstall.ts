import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const DISMISS_KEY = 'fsrs_pwa_install_dismissed';

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isAndroid = /android/i.test(window.navigator.userAgent);
  const isSecureOrigin = window.isSecureContext;

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setIsDismissed(localStorage.getItem(DISMISS_KEY) === '1');

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsDismissed(false);
      setShowIosGuide(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isInstallable = !isInstalled && deferredPrompt !== null;
  const canShowManualGuide = !isInstalled && isIos;
  const needsAndroidSecureOriginHelp = !isInstalled && isAndroid && !isSecureOrigin;
  const shouldShowInstallBanner =
    !isInstalled &&
    !isDismissed &&
    (isInstallable || canShowManualGuide || needsAndroidSecureOriginHelp);

  const dismissBanner = () => {
    setIsDismissed(true);
    setShowIosGuide(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
      return choice.outcome;
    }

    if (canShowManualGuide) {
      setShowIosGuide(true);
    }

    return null;
  };

  return {
    isInstallable,
    canShowManualGuide,
    needsAndroidSecureOriginHelp,
    shouldShowInstallBanner,
    showIosGuide,
    setShowIosGuide,
    dismissBanner,
    promptInstall,
  };
}

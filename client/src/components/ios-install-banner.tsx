import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IOSInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    const checkShouldShow = () => {
      // Check if user has dismissed the banner before
      const dismissed = localStorage.getItem('ios-install-banner-dismissed');
      if (dismissed === 'true') {
        return false;
      }

      // Check if we're on iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (!isIOS || !isSafari) {
        return false;
      }

      // Check if already in standalone mode (installed as PWA)
      const isStandalone = (window.navigator as any).standalone === true;
      if (isStandalone) {
        return false;
      }

      // Check if matchMedia indicates display-mode is standalone
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        return false;
      }

      return true;
    };

    setShouldShow(checkShouldShow());
  }, []);

  useEffect(() => {
    if (shouldShow) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('ios-install-banner-dismissed', 'true');
  };

  if (!shouldShow || !isVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">📱</span>
            <div className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              <span className="block sm:inline">Install this app: </span>
              <span className="block sm:inline">
                Tap the Share icon <span className="inline-block text-lg">⬆️</span> and choose "Add to Home Screen"
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-3 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-100"
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Spacer to push content below the banner */}
      <div className="h-16" />
    </>
  );
}
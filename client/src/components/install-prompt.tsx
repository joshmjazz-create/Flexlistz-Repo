import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://');
    
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    setIsStandalone(isStandaloneMode);
    setIsIOS(isIOSDevice);
    
    // Only show on iOS devices
    if (!isIOSDevice) {
      return;
    }
    
    // Don't show prompt if already in standalone mode
    if (isStandaloneMode) {
      return;
    }
    
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      return;
    }
    
    // Show prompt after a short delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);
    
    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Edge install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show if already in standalone mode
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Download className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-sm">
              Install FlexList App
            </div>
            <div className="text-xs text-blue-100">
              {isIOS ? (
                <>Tap <Share className="w-3 h-3 inline mx-1" /> then "Add to Home Screen"</>
              ) : (
                "Get the full app experience - works offline!"
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50 text-xs px-3 py-1 h-auto"
            >
              Install
            </Button>
          )}
          
          {isIOS && (
            <Button
              onClick={() => {
                // Show detailed iOS instructions
                alert(
                  "To install FlexList:\n\n" +
                  "1. Tap the Share button (⬆️) in Safari\n" +
                  "2. Scroll down and tap 'Add to Home Screen'\n" +
                  "3. Tap 'Add' to install the app\n\n" +
                  "The app will then work offline and feel like a native app!"
                );
              }}
              size="sm"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50 text-xs px-3 py-1 h-auto"
            >
              How to Install
            </Button>
          )}
          
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-blue-500 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
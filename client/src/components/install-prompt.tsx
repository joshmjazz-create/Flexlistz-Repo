import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, ArrowUp } from 'lucide-react';
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
              Tap <ArrowUp className="w-3 h-3 inline mx-1" /> Share, then scroll down and tap "Add to Home Screen"
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              // Show detailed iOS instructions
              alert(
                "📱 How to Install FlexList to Your Home Screen:\n\n" +
                "1. Tap the Share button (⬆️) at the bottom of Safari\n" +
                "2. Scroll down in the share menu\n" +
                "3. Tap 'Add to Home Screen' 🏠\n" +
                "4. Tap 'Add' in the top right corner\n\n" +
                "✨ FlexList will then appear on your home screen like a native app!\n" +
                "It will work offline and load instantly."
              );
            }}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50 text-xs px-3 py-1 h-auto"
          >
            Show Steps
          </Button>
          
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
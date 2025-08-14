import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

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
    
    // Don't show prompt if already in standalone mode
    if (isStandaloneMode) {
      return;
    }
    
    // Check if user has previously dismissed the prompt (temporarily disabled for testing)
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    console.log('Install prompt dismissed status:', dismissed);
    console.log('Is standalone mode:', isStandaloneMode);
    console.log('Is iOS device:', isIOSDevice);
    
    // Temporarily disable this check to ensure prompt shows
    // if (dismissed) {
    //   return;
    // }
    
    // Show prompt after a short delay
    const timer = setTimeout(() => {
      console.log('Setting showPrompt to true after 2 second delay');
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

  // Debug logging
  console.log('Install prompt render check:', { isStandalone, showPrompt, isIOS });
  
  // Don't show if already in standalone mode
  if (isStandalone || !showPrompt) {
    console.log('Install prompt not showing because:', { isStandalone, showPrompt });
    return null;
  }
  
  console.log('Install prompt should be visible now');

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
                <>Tap <ArrowUp className="w-3 h-3 inline mx-1" /> Share, then scroll down and tap "Add to Home Screen"</>
              ) : (
                "Click the install button in your browser's address bar, or use this button"
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
              Install Now
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 text-xs px-3 py-1 h-auto"
              >
                Show Steps
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  How to Install FlexList
                </DialogTitle>
                <DialogDescription>
                  Follow these steps to install FlexList as an app on your device
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {isIOS ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">📱 iOS Safari Instructions:</div>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="font-medium text-primary">1.</span>
                        <span>Tap the Share button (⬆️) at the bottom of Safari</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-primary">2.</span>
                        <span>Scroll down in the share menu</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-primary">3.</span>
                        <span>Tap "Add to Home Screen" 🏠</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-primary">4.</span>
                        <span>Tap "Add" in the top right corner</span>
                      </li>
                    </ol>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">✨ Result:</div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        FlexList will appear on your home screen like a native app and work offline!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">💻 Desktop Instructions:</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-primary mb-1">Chrome/Edge:</div>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-3">
                          <li>• Look for the install icon (⬇️) in your address bar</li>
                          <li>• Or click the "Install Now" button above</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary mb-1">Firefox:</div>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-3">
                          <li>• Look for the install prompt that may appear</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary mb-1">Safari (macOS):</div>
                        <ul className="space-y-1 text-sm text-muted-foreground ml-3">
                          <li>• Go to File menu → "Add to Dock"</li>
                          <li>• Or use File menu → "Add to Home Screen" (if available)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">✨ Result:</div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        Once installed, FlexList will work offline and load instantly!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
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
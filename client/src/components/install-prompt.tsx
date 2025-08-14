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
  const [browserType, setBrowserType] = useState<'chrome' | 'firefox' | 'safari' | 'edge' | 'other'>('other');
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'mac' | 'windows' | 'linux' | 'other'>('other');

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://');
    
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Detect browser and device type
    const userAgent = navigator.userAgent.toLowerCase();
    let browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' = 'other';
    let device: 'ios' | 'android' | 'mac' | 'windows' | 'linux' | 'other' = 'other';
    
    // Detect browser
    if (userAgent.includes('edg/')) {
      browser = 'edge';
    } else if (userAgent.includes('chrome') && !userAgent.includes('edg/')) {
      browser = 'chrome';
    } else if (userAgent.includes('firefox')) {
      browser = 'firefox';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browser = 'safari';
    }
    
    // Detect device/OS
    if (isIOSDevice) {
      device = 'ios';
    } else if (userAgent.includes('android')) {
      device = 'android';
    } else if (userAgent.includes('mac')) {
      device = 'mac';
    } else if (userAgent.includes('windows')) {
      device = 'windows';
    } else if (userAgent.includes('linux')) {
      device = 'linux';
    }
    
    setIsStandalone(isStandaloneMode);
    setIsIOS(isIOSDevice);
    setBrowserType(browser);
    setDeviceType(device);
    
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
                    <div className="text-sm font-medium">
                      {browserType === 'chrome' && `💻 Chrome${deviceType === 'mac' ? ' (macOS)' : deviceType === 'windows' ? ' (Windows)' : deviceType === 'linux' ? ' (Linux)' : ''} Instructions:`}
                      {browserType === 'edge' && `💻 Edge${deviceType === 'mac' ? ' (macOS)' : deviceType === 'windows' ? ' (Windows)' : deviceType === 'linux' ? ' (Linux)' : ''} Instructions:`}
                      {browserType === 'firefox' && `🦊 Firefox${deviceType === 'mac' ? ' (macOS)' : deviceType === 'windows' ? ' (Windows)' : deviceType === 'linux' ? ' (Linux)' : ''} Instructions:`}
                      {browserType === 'safari' && deviceType === 'mac' && '🍎 Safari (macOS) Instructions:'}
                      {browserType === 'safari' && deviceType !== 'mac' && '🌐 Safari Instructions:'}
                      {browserType === 'other' && '💻 Browser Instructions:'}
                    </div>
                    <div>
                      {(browserType === 'chrome' || browserType === 'edge') && (
                        <ol className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">1.</span>
                            <span>Look for the install icon (⬇️) in your address bar</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">2.</span>
                            <span>Click the install icon or use the "Install Now" button above</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">3.</span>
                            <span>Click "Install" in the popup that appears</span>
                          </li>
                        </ol>
                      )}
                      
                      {browserType === 'firefox' && (
                        <ol className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">1.</span>
                            <span>Look for an install prompt that may appear at the top</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">2.</span>
                            <span>If no prompt appears, Firefox may not support PWA installation for this site</span>
                          </li>
                        </ol>
                      )}
                      
                      {browserType === 'safari' && deviceType === 'mac' && (
                        <ol className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">1.</span>
                            <span>Go to the File menu at the top of your screen</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">2.</span>
                            <span>Click "Add to Dock" to install FlexList</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-medium text-primary">3.</span>
                            <span>The app will appear in your Dock for quick access</span>
                          </li>
                        </ol>
                      )}
                      
                      {browserType === 'safari' && deviceType !== 'mac' && (
                        <div className="text-sm text-muted-foreground">
                          <p>Safari on this platform may have limited PWA installation support. Try using Chrome or Edge for the best installation experience.</p>
                        </div>
                      )}
                      
                      {browserType === 'other' && (
                        <div className="text-sm text-muted-foreground">
                          <p>Look for install options in your browser's menu or address bar. Different browsers may have varying levels of PWA support.</p>
                        </div>
                      )}
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
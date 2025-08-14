import React, { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { setupBrowserAPI } from "@/lib/browser-api";
import InstallPrompt from "@/components/install-prompt";
import { ErrorBoundary } from "@/components/error-boundary";
import Collections from "@/pages/collections";
import NotFound from "@/pages/not-found";

// Initialize browser-based API on startup
try {
  setupBrowserAPI();
  console.log('Browser API setup completed');
} catch (error) {
  console.error('Browser API setup failed:', error);
}

// Handle GitHub Pages SPA routing
if (typeof window !== 'undefined' && sessionStorage.redirect) {
  const redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== location.href) {
    history.replaceState(null, '', redirect);
  }
}

function Router() {
  // Use hash-based routing for GitHub Pages compatibility
  const [currentCollection, setCurrentCollection] = useState<string | null>(null);

  useEffect(() => {
    // Parse hash-based route on load and changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      const collectionMatch = hash.match(/#\/collections\/([^/?]+)/);
      setCurrentCollection(collectionMatch ? collectionMatch[1] : null);
    };

    // Set initial state
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return <Collections collectionId={currentCollection} />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <InstallPrompt />
              <Router />
              <Toaster />
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { setupBrowserAPI } from "@/lib/browser-api";
import { IOSInstallBanner } from "@/components/ios-install-banner";
import Collections from "@/pages/collections";
import NotFound from "@/pages/not-found";

// Initialize browser-based API on startup
setupBrowserAPI();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Collections} />
      <Route path="/collections/:collectionId?" component={Collections} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <IOSInstallBanner />
            <Router />
            <Toaster />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

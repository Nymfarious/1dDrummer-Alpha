import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DevSettingsProvider, useDevSettings } from '@/contexts/DevSettingsContext';
import { DevTools } from '@/components/DevTools';
import { ButterflyToggle } from '@/components/ButterflyToggle';
import Index from "../pages/Index";
import Auth from "../pages/Auth";
import NotFound from "../pages/NotFound";

const AppContent = () => {
  const { loading } = useAuth();
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const { settings } = useDevSettings();

  // Update body data attribute based on masterVisibility
  useEffect(() => {
    if (settings.masterVisibility) {
      document.body.removeAttribute('data-dev-hidden');
    } else {
      document.body.setAttribute('data-dev-hidden', 'true');
    }
  }, [settings.masterVisibility]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-full mx-auto animate-pulse"></div>
          <p className="text-muted-foreground">Loading dDrummer...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Hidden Butterfly Toggle - Bottom Right */}
      <ButterflyToggle 
        onToggle={() => setDevToolsOpen(!devToolsOpen)} 
        isVisible={!devToolsOpen}
      />
      
      {/* DevTools Panel */}
      <DevTools isOpen={devToolsOpen} onClose={() => setDevToolsOpen(false)} />
    </>
  );
};

const AuthenticatedApp = () => {
  return (
    <DevSettingsProvider>
      <AppContent />
    </DevSettingsProvider>
  );
};

export default AuthenticatedApp;
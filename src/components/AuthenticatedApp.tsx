import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DevSettingsProvider, useDevSettings } from '@/contexts/DevSettingsContext';
import { useAIAvatar } from '@/contexts/AIAvatarContext';
import { DevTools } from '@/components/DevTools';
import { ButterflyToggle } from '@/components/ButterflyToggle';
import { AIAvatarGenerator } from '@/components/profile/AIAvatarGenerator';
import Index from "../pages/Index";
import Auth from "../pages/Auth";
import NotFound from "../pages/NotFound";

const GlobalAIAvatar = () => {
  const { isOpen, isDocked, setIsOpen, setIsDocked } = useAIAvatar();

  if (!isOpen || isDocked) return null;

  return (
    <AIAvatarGenerator
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onSave={() => {
        // The actual save to profile happens in UserProfile component
      }}
      docked={false}
      onDockToggle={() => setIsDocked(!isDocked)}
    />
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
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
      <GlobalAIAvatar />
      <BrowserRouter basename="/1dDrummer-Alpha">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Index /> : <Navigate to="/auth" replace />} 
          />
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
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "../pages/Index";
import Auth from "../pages/Auth";
import NotFound from "../pages/NotFound";

const AuthenticatedApp = () => {
  const { loading } = useAuth();

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
    </>
  );
};

export default AuthenticatedApp;
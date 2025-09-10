import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DrummerStudio from './DrummerStudio';

const Index = () => {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <DrummerStudio />;
};

export default Index;

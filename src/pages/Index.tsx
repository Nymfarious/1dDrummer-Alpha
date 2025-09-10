import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DrummerStudio from './DrummerStudio';

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <DrummerStudio />;
};

export default Index;

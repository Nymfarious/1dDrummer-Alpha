import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { AIAvatarProvider } from "@/contexts/AIAvatarContext";
import { DevSettingsProvider } from "@/contexts/DevSettingsContext";
import AuthenticatedApp from "@/components/AuthenticatedApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AIAvatarProvider>
          <DevSettingsProvider>
            <AuthenticatedApp />
          </DevSettingsProvider>
        </AIAvatarProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

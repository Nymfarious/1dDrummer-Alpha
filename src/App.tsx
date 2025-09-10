import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import AuthenticatedApp from "@/components/AuthenticatedApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

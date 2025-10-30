import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RealTimeSyncProvider } from "@/components/shared/RealTimeSyncProvider";
import { AppRouter } from "@/components/routing/AppRouter";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { NetworkStatusProvider } from "@/components/shared/NetworkStatusProvider";
import { AppStateProvider } from "@/components/shared/AppStateProvider";
import { NetworkStatusBanner, FloatingNetworkStatus } from "@/components/shared/NetworkStatusBanner";
import { createQueryClient } from "@/lib/queryClient";
import "@/utils/supabaseCheck"; // Make health check available in console
import "@/utils/healthCheck"; // Make VII Bookings health check available
import "@/lib/errorHandling"; // Initialize global error handling

const queryClient = createQueryClient();

const App = () => (
  <ErrorBoundary level="global" showDetails={process.env.NODE_ENV === 'development'}>
    <QueryClientProvider client={queryClient}>
      <NetworkStatusProvider>
        <AppStateProvider>
          <AuthProvider>
            <RealTimeSyncProvider enableToasts={true} enableAdminNotifications={true}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRouter />
                  <FloatingNetworkStatus position="bottom-right" />
                </BrowserRouter>
              </TooltipProvider>
            </RealTimeSyncProvider>
          </AuthProvider>
        </AppStateProvider>
      </NetworkStatusProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

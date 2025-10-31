import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Marketplace from "@/pages/marketplace";
import BotDetail from "@/pages/bot-detail";
import DashboardLayout from "@/pages/dashboard-layout";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import RiskDisclaimer from "@/pages/risk-disclaimer";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Legal pages - accessible to everyone */}
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/risk-disclaimer" component={RiskDisclaimer} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/bot/:id" component={BotDetail} />
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/" component={DashboardLayout} />
          <Route path="/dashboard/:rest*" component={DashboardLayout} />
          <Route path="/dashboard" component={DashboardLayout} />
          <Route path="/bot/:id" component={DashboardLayout} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

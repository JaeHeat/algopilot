import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Route, Switch } from "wouter";
import DashboardOverview from "./dashboard-overview";
import DashboardMyBots from "./dashboard-my-bots";
import DashboardMyTrades from "./dashboard-my-trades";
import DashboardMarketplace from "./dashboard-marketplace";
import DashboardSettings from "./dashboard-settings";
import DashboardAdmin from "./dashboard-admin";
import DashboardCreator from "./dashboard-creator";
import BotDetail from "./bot-detail";
import NotFound from "./not-found";

export default function DashboardLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-6 h-16 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <ThemeToggle />
              <Button variant="ghost" size="icon" data-testid="button-profile">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-screen-2xl mx-auto">
              <Switch>
                <Route path="/" component={DashboardOverview} />
                <Route path="/dashboard" component={DashboardOverview} />
                <Route path="/dashboard/my-bots" component={DashboardMyBots} />
                <Route path="/dashboard/my-trades" component={DashboardMyTrades} />
                <Route path="/dashboard/marketplace" component={DashboardMarketplace} />
                <Route path="/dashboard/settings" component={DashboardSettings} />
                <Route path="/dashboard/creator" component={DashboardCreator} />
                <Route path="/dashboard/admin" component={DashboardAdmin} />
                <Route path="/bot/:id" component={BotDetail} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import {
  LayoutDashboard,
  Bot,
  Store,
  Settings,
  ShieldCheck,
  TrendingUp,
  Webhook,
  LineChart,
  DollarSign,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard", exact: true },
  { title: "My Bots", icon: Bot, url: "/dashboard/my-bots" },
  { title: "My Trades", icon: LineChart, url: "/dashboard/my-trades" },
  { title: "Marketplace", icon: Store, url: "/dashboard/marketplace" },
  { title: "Settings", icon: Settings, url: "/dashboard/settings" },
];

const adminItems = [
  { title: "Admin Panel", icon: ShieldCheck, url: "/dashboard/admin" },
];

const creatorItems = [
  { title: "Manage Bots", icon: Webhook, url: "/dashboard/creator" },
  { title: "Earnings", icon: DollarSign, url: "/dashboard/earnings" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: subscriptions = [] } = useQuery<any[]>({
    queryKey: ["/api/subscriptions"],
  });
  
  const { data: creatorBots = [] } = useQuery<any[]>({
    queryKey: ["/api/creator/bots"],
    enabled: user?.role === 'creator' || user?.role === 'admin',
  });
  
  const pausedCount = subscriptions.filter((sub) => sub.isPaused).length;
  const isCreator = user?.role === 'creator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const isActive = (url: string, exact = false) => {
    if (exact) return location === url;
    return location === url || location.startsWith(url + '/') || location.startsWith(url.replace('/dashboard/', '/dashboard/'));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <Link href="/dashboard">
            <SidebarGroupLabel className="flex items-center gap-2 px-4 py-3 hover-elevate rounded-md cursor-pointer" data-testid="link-dashboard-home">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-bold text-base">AlgoPilot</span>
            </SidebarGroupLabel>
          </Link>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.url, item.exact);
                const showBadge = item.title === "My Bots" && pausedCount > 0;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={active ? "bg-sidebar-accent" : ""}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {showBadge && (
                          <Badge 
                            className="ml-auto bg-success text-success-foreground h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold"
                            data-testid="badge-my-bots-count"
                          >
                            {pausedCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isCreator && (
          <SidebarGroup>
            <SidebarGroupLabel>Creator Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {creatorItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={active ? "bg-sidebar-accent" : ""}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {creatorBots.length > 0 && item.title === "Manage Bots" && (
                            <Badge 
                              className="ml-auto bg-primary text-primary-foreground h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold"
                            >
                              {creatorBots.length}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={active ? "bg-sidebar-accent" : ""}
                        data-testid="link-admin"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function NotificationsDropdown() {
  const [, setLocation] = useLocation();
  
  const { data: subscriptions = [] } = useQuery<any[]>({
    queryKey: ["/api/subscriptions"],
  });
  
  const pausedSubscriptions = subscriptions.filter((sub) => sub.isPaused);
  const notificationCount = pausedSubscriptions.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold border-2 border-background"
              data-testid="badge-notification-count"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notificationCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notificationCount} new
            </Badge>
          )}
        </div>
        {pausedSubscriptions.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {pausedSubscriptions.map((sub: any) => (
              <DropdownMenuItem
                key={sub.id}
                className="flex flex-col items-start gap-1 px-3 py-3 cursor-pointer"
                onClick={() => setLocation(`/dashboard/my-bots?openSettings=${sub.id}`)}
                data-testid={`notification-setup-${sub.id}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      Setup Required: {sub.botName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.pauseReason || "Configure your bot settings to start trading"}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

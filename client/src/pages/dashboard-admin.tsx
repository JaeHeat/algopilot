import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { Users, Bot, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  activeBots: number;
  platformRevenue: string;
  pendingApprovals: number;
}

interface RecentUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date | null;
  subscriptionCount: number;
}

interface PendingApplication {
  id: string;
  userId: string;
  status: string;
  tradingExperience: string;
  strategyDescription: string;
  createdAt: Date;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function DashboardAdmin() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery<RecentUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: pendingApplications = [], isLoading: applicationsLoading } = useQuery<PendingApplication[]>({
    queryKey: ['/api/admin/pending-applications'],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ userId, status, rejectionReason }: { userId: string; status: string; rejectionReason?: string }) => {
      const response = await fetch(`/api/creator-applications/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    updateApplicationMutation.mutate({ userId, status: 'approved' });
  };

  const handleReject = (userId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      updateApplicationMutation.mutate({ userId, status: 'rejected', rejectionReason: reason });
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Platform management and oversight</p>
      </div>
      
      {statsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers.toLocaleString() || "0"}
            icon={Users}
            data-testid="metric-total-users"
          />
          <MetricCard
            title="Active Bots"
            value={stats?.activeBots.toString() || "0"}
            change={stats && stats.pendingApprovals > 0 ? `${stats.pendingApprovals} pending approval` : undefined}
            icon={Bot}
            data-testid="metric-active-bots"
          />
          <MetricCard
            title="Platform Revenue"
            value={`$${parseFloat(stats?.platformRevenue || "0").toLocaleString()}`}
            icon={DollarSign}
            data-testid="metric-platform-revenue"
          />
          <MetricCard
            title="Pending Reviews"
            value={stats?.pendingApprovals.toString() || "0"}
            icon={AlertCircle}
            data-testid="metric-pending-reviews"
          />
        </div>
      )}
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Pending Creator Applications</h2>
          <Badge variant="secondary">{pendingApplications.length} pending</Badge>
        </div>
        {applicationsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingApplications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending applications
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApplications.map((app) => (
                <TableRow key={app.id} data-testid={`row-pending-app-${app.userId}`}>
                  <TableCell className="font-medium">{app.user.email || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.user.firstName && app.user.lastName 
                      ? `${app.user.firstName} ${app.user.lastName}`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    {app.tradingExperience.substring(0, 50)}...
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => handleApprove(app.userId)}
                      disabled={updateApplicationMutation.isPending}
                      data-testid={`button-approve-${app.userId}`}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleReject(app.userId)}
                      disabled={updateApplicationMutation.isPending}
                      data-testid={`button-reject-${app.userId}`}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Users</h2>
        {usersLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recentUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Subscriptions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell className="font-medium">{user.email || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.lastName || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.createdAt 
                      ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{user.subscriptionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

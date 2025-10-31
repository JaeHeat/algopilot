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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const rejectionSchema = z.object({
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

type RejectionFormData = z.infer<typeof rejectionSchema>;

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

interface PendingPayout {
  id: string;
  userId: string;
  amount: string;
  status: string;
  requestedAt: Date;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function DashboardAdmin() {
  const { toast } = useToast();
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<{ type: 'application' | 'payout'; id: string } | null>(null);
  
  const rejectionForm = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery<RecentUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: pendingApplications = [], isLoading: applicationsLoading } = useQuery<PendingApplication[]>({
    queryKey: ['/api/admin/pending-applications'],
  });

  const { data: pendingPayouts = [], isLoading: payoutsLoading } = useQuery<PendingPayout[]>({
    queryKey: ['/api/admin/payouts/pending'],
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

  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/admin/payouts/${payoutId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve payout');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts/pending'] });
      toast({
        title: "Success",
        description: "Payout approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payout",
        variant: "destructive",
      });
    },
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async ({ payoutId, reason }: { payoutId: string; reason: string }) => {
      const response = await fetch(`/api/admin/payouts/${payoutId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject payout');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts/pending'] });
      toast({
        title: "Success",
        description: "Payout rejected successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject payout",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    updateApplicationMutation.mutate({ userId, status: 'approved' });
  };

  const handleReject = (userId: string) => {
    setRejectionTarget({ type: 'application', id: userId });
    setRejectionDialogOpen(true);
    rejectionForm.reset();
  };

  const handleApprovePayout = (payoutId: string) => {
    approvePayoutMutation.mutate(payoutId);
  };

  const handleRejectPayout = (payoutId: string) => {
    setRejectionTarget({ type: 'payout', id: payoutId });
    setRejectionDialogOpen(true);
    rejectionForm.reset();
  };

  const handleRejectionSubmit = (data: RejectionFormData) => {
    if (!rejectionTarget) return;
    
    if (rejectionTarget.type === 'application') {
      updateApplicationMutation.mutate(
        { userId: rejectionTarget.id, status: 'rejected', rejectionReason: data.reason },
        {
          onSuccess: () => {
            setRejectionDialogOpen(false);
            setRejectionTarget(null);
            rejectionForm.reset();
          },
        }
      );
    } else {
      rejectPayoutMutation.mutate(
        { payoutId: rejectionTarget.id, reason: data.reason },
        {
          onSuccess: () => {
            setRejectionDialogOpen(false);
            setRejectionTarget(null);
            rejectionForm.reset();
          },
        }
      );
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
      
      <Card className="p-6" data-testid="card-pending-payouts">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" data-testid="heading-pending-payouts">Pending Payout Requests</h2>
          <Badge variant="secondary" data-testid="badge-pending-payouts-count">{pendingPayouts.length} pending</Badge>
        </div>
        {payoutsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingPayouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-pending-payouts">
            No pending payout requests
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayouts.map((payout) => (
                <TableRow key={payout.id} data-testid={`row-pending-payout-${payout.id}`}>
                  <TableCell className="font-medium" data-testid={`text-payout-creator-${payout.id}`}>
                    {payout.user.firstName && payout.user.lastName 
                      ? `${payout.user.firstName} ${payout.user.lastName}`
                      : payout.user.firstName || payout.user.lastName || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-payout-email-${payout.id}`}>
                    {payout.user.email || "N/A"}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums" data-testid={`text-payout-amount-${payout.id}`}>
                    ${parseFloat(payout.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" data-testid={`text-payout-requested-${payout.id}`}>
                    {formatDistanceToNow(new Date(payout.requestedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell data-testid={`badge-payout-status-${payout.id}`}>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => handleApprovePayout(payout.id)}
                      disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                      data-testid={`button-approve-payout-${payout.id}`}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRejectPayout(payout.id)}
                      disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                      data-testid={`button-reject-payout-${payout.id}`}
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
      
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent data-testid="dialog-rejection">
          <DialogHeader>
            <DialogTitle>
              {rejectionTarget?.type === 'application' ? 'Reject Creator Application' : 'Reject Payout Request'}
            </DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejection. This will be shared with the {rejectionTarget?.type === 'application' ? 'applicant' : 'creator'}.
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectionForm}>
            <form onSubmit={rejectionForm.handleSubmit(handleRejectionSubmit)} className="space-y-4">
              <FormField
                control={rejectionForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Explain why this request is being rejected..."
                        rows={4}
                        data-testid="textarea-rejection-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRejectionDialogOpen(false);
                    setRejectionTarget(null);
                    rejectionForm.reset();
                  }}
                  data-testid="button-cancel-rejection"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={updateApplicationMutation.isPending || rejectPayoutMutation.isPending}
                  data-testid="button-confirm-rejection"
                >
                  {updateApplicationMutation.isPending || rejectPayoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

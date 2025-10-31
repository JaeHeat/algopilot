import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

interface Earnings {
  totalEarnings: string;
  totalPayouts: string;
  pendingBalance: string;
}

interface Payout {
  id: string;
  amount: string;
  status: string;
  paymentMethod: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  rejectionReason: string | null;
}

export default function DashboardCreatorEarnings() {
  const { toast } = useToast();
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");

  const { data: earnings, isLoading: earningsLoading } = useQuery<Earnings>({
    queryKey: ["/api/creator/earnings"],
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<Payout[]>({
    queryKey: ["/api/creator/payouts"],
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/creator/payouts", {
        amount,
        paymentMethod: "bank_transfer",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/payouts"] });
      setPayoutDialogOpen(false);
      setRequestAmount("");
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for review",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request payout",
        variant: "destructive",
      });
    },
  });

  const handleRequestPayout = () => {
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amount < 50) {
      toast({
        title: "Minimum Payout",
        description: "Minimum payout amount is $50",
        variant: "destructive",
      });
      return;
    }

    const pendingBalance = parseFloat(earnings?.pendingBalance || "0");
    if (amount > pendingBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have $${pendingBalance.toFixed(2)} available`,
        variant: "destructive",
      });
      return;
    }

    requestPayoutMutation.mutate(requestAmount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "processing":
        return <Badge variant="default" className="gap-1"><TrendingUp className="w-3 h-3" />Processing</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1"><CheckCircle2 className="w-3 h-3" />Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (earningsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="heading-earnings">Creator Earnings</h1>
        <p className="text-muted-foreground">
          Manage your earnings and payout requests
        </p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-earnings">
              ${parseFloat(earnings?.totalEarnings || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              75% of active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-pending-balance">
              ${parseFloat(earnings?.pendingBalance || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to withdraw
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payouts">
              ${parseFloat(earnings?.totalPayouts || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Payout Button */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>
            Minimum payout amount is $50. Payouts are typically processed within 3-5 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setPayoutDialogOpen(true)}
            disabled={parseFloat(earnings?.pendingBalance || "0") < 50}
            data-testid="button-request-payout"
          >
            Request Payout
          </Button>
          {parseFloat(earnings?.pendingBalance || "0") < 50 && (
            <p className="text-sm text-muted-foreground mt-2">
              You need at least $50 to request a payout
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>View all your payout requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : payouts.length === 0 ? (
            <p className="text-muted-foreground">No payout requests yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                    <TableCell className="font-medium">
                      ${parseFloat(payout.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(payout.requestedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.completedAt 
                        ? formatDistanceToNow(new Date(payout.completedAt), { addSuffix: true })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.rejectionReason || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent data-testid="dialog-request-payout">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Enter the amount you'd like to withdraw from your pending balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="50"
                max={earnings?.pendingBalance || "0"}
                placeholder="50.00"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                data-testid="input-payout-amount"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Available: ${parseFloat(earnings?.pendingBalance || "0").toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
              data-testid="button-cancel-payout"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={requestPayoutMutation.isPending}
              data-testid="button-submit-payout"
            >
              {requestPayoutMutation.isPending ? "Requesting..." : "Request Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

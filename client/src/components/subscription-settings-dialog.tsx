import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Subscription, Bot } from "@shared/schema";
import { Settings, Pause, Play, AlertTriangle, Bell, Wallet } from "lucide-react";

interface SubscriptionSettingsDialogProps {
  subscription: Subscription & { bot: Bot };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionSettingsDialog({ subscription, open, onOpenChange }: SubscriptionSettingsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settings");
  
  const [capitalAllocated, setCapitalAllocated] = useState(
    subscription.capitalAllocated ? parseFloat(subscription.capitalAllocated) : 1000
  );
  const [capitalType, setCapitalType] = useState<"amount" | "percent">(
    subscription.capitalAllocatedType as "amount" | "percent" || "amount"
  );
  const [riskPercentage, setRiskPercentage] = useState(subscription.riskPercentage || 1);
  const [maxDrawdown, setMaxDrawdown] = useState(
    subscription.maxDrawdown ? parseFloat(subscription.maxDrawdown) : 10
  );
  const [maxPositionsPerSymbol, setMaxPositionsPerSymbol] = useState(subscription.maxPositionsPerSymbol || 1);
  
  const notificationPrefs = subscription.notificationPrefs as any || {
    newTrade: true,
    drawdownBreach: true,
    weeklySummary: true,
    monthlySummary: true,
  };
  
  const [notifications, setNotifications] = useState(notificationPrefs);
  
  const [pauseReason, setPauseReason] = useState("");
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);

  const { data: balanceData } = useQuery<{ totalBalance: number }>({
    queryKey: ["/api/user/available-balance"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const res = await apiRequest("PATCH", `/api/subscriptions/${subscription.id}`, settings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Settings Updated",
        description: "Your subscription settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("POST", `/api/subscriptions/${subscription.id}/pause`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription Paused",
        description: "Your subscription has been paused successfully.",
      });
      setShowPauseDialog(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to pause subscription.",
        variant: "destructive",
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscriptions/${subscription.id}/resume`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription Resumed",
        description: "Your subscription is now active again.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to resume subscription.",
        variant: "destructive",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/subscriptions/${subscription.id}`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      const endDate = data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : 'the end of the month';
      toast({
        title: "Subscription Cancelled",
        description: `Your subscription will end on ${endDate}. You will still have full access until then.`,
      });
      setShowUnsubscribeDialog(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to unsubscribe.",
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscriptions/${subscription.id}/reactivate`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been turned back on successfully!",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reactivate subscription.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const availableBalance = balanceData?.totalBalance || 0;
    
    if (capitalType === "amount" && capitalAllocated > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have $${availableBalance.toLocaleString()} available. Please connect more exchanges or reduce your allocation.`,
        variant: "destructive",
      });
      return;
    }
    
    if (capitalType === "percent" && capitalAllocated > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Capital allocation percentage cannot exceed 100%.",
        variant: "destructive",
      });
      return;
    }
    
    updateSettingsMutation.mutate({
      capitalAllocated,
      capitalAllocatedType: capitalType,
      riskPercentage,
      maxDrawdown,
      maxPositionsPerSymbol,
      notificationPrefs: notifications,
    });
  };

  const handlePause = () => {
    pauseMutation.mutate(pauseReason || "User paused");
  };

  const handleResume = () => {
    resumeMutation.mutate();
  };

  const handleUnsubscribe = () => {
    unsubscribeMutation.mutate();
  };

  const handleReactivate = () => {
    reactivateMutation.mutate();
  };

  const getRiskLabel = (risk: number) => {
    const labels = ["", "Safest", "Safe", "Aggressive", "High Risk", "DANGER"];
    return labels[risk] || "";
  };

  const isCancelled = subscription.subscriptionEndsAt && new Date(subscription.subscriptionEndsAt) > new Date();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">Subscription Settings</DialogTitle>
                <DialogDescription>
                  Manage settings for {subscription.bot.name}
                </DialogDescription>
              </div>
              {subscription.isPaused && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  Paused
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="manage" data-testid="tab-manage">
                Manage
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6 mt-6">
              {balanceData && capitalType === "amount" && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Available Balance:{" "}
                    <span className="font-semibold text-foreground" data-testid="text-available-balance">
                      ${balanceData.totalBalance.toLocaleString()}
                    </span>
                  </span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="capital" className="mb-2 block">
                    Capital Allocation
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="capital"
                      type="number"
                      value={capitalAllocated}
                      onChange={(e) => setCapitalAllocated(parseFloat(e.target.value))}
                      min="0"
                      step={capitalType === "percent" ? "1" : "100"}
                      data-testid="input-capital-allocated"
                      className={capitalType === "amount" && balanceData && capitalAllocated > balanceData.totalBalance ? "border-destructive" : ""}
                    />
                    <Select value={capitalType} onValueChange={(v: "amount" | "percent") => setCapitalType(v)}>
                      <SelectTrigger className="w-32" data-testid="select-capital-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">USD</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {capitalType === "amount" && balanceData && capitalAllocated > balanceData.totalBalance && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Exceeds available balance by ${(capitalAllocated - balanceData.totalBalance).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {capitalType === "amount" 
                      ? "Amount of capital to allocate to this bot"
                      : "Percentage of your portfolio to allocate"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="risk" className="mb-2 block">
                    Risk Percentage: {riskPercentage}% - {getRiskLabel(riskPercentage)}
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="risk"
                      type="range"
                      min="1"
                      max="5"
                      value={riskPercentage}
                      onChange={(e) => setRiskPercentage(parseInt(e.target.value))}
                      className="flex-1"
                      data-testid="slider-risk-percentage"
                    />
                    <span className="text-sm font-medium w-12 text-right">{riskPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Safest</span>
                    <span>DANGER</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="drawdown" className="mb-2 block">
                    Max Drawdown Limit (%)
                  </Label>
                  <Input
                    id="drawdown"
                    type="number"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))}
                    min="1"
                    max="100"
                    step="0.5"
                    data-testid="input-max-drawdown"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Trading will pause if drawdown exceeds this limit
                  </p>
                </div>

                <div>
                  <Label htmlFor="max-positions" className="mb-2 block">
                    Max Positions Per Symbol
                  </Label>
                  <Input
                    id="max-positions"
                    type="number"
                    value={maxPositionsPerSymbol}
                    onChange={(e) => setMaxPositionsPerSymbol(parseInt(e.target.value))}
                    min="1"
                    max="5"
                    step="1"
                    data-testid="input-max-positions-per-symbol"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Limit positions per symbol. Set to 1 to prevent conflicting signals from multiple timeframes.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-trade">New Trade Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when the bot opens a new trade
                    </p>
                  </div>
                  <Switch
                    id="new-trade"
                    checked={notifications.newTrade}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, newTrade: checked })
                    }
                    data-testid="switch-new-trade"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="drawdown-breach">Drawdown Breach Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when max drawdown limit is reached
                    </p>
                  </div>
                  <Switch
                    id="drawdown-breach"
                    checked={notifications.drawdownBreach}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, drawdownBreach: checked })
                    }
                    data-testid="switch-drawdown-breach"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-summary">Weekly Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly performance summary
                    </p>
                  </div>
                  <Switch
                    id="weekly-summary"
                    checked={notifications.weeklySummary}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklySummary: checked })
                    }
                    data-testid="switch-weekly-summary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monthly-summary">Monthly Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a monthly performance summary
                    </p>
                  </div>
                  <Switch
                    id="monthly-summary"
                    checked={notifications.monthlySummary}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, monthlySummary: checked })
                    }
                    data-testid="switch-monthly-summary"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-notifications"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4 mt-6">
              <div className="space-y-4">
                {subscription.isPaused ? (
                  <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Pause className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-600">Subscription Paused</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {subscription.pauseReason || "This subscription is currently paused"}
                        </p>
                        <Button
                          onClick={handleResume}
                          disabled={resumeMutation.isPending}
                          variant="outline"
                          className="mt-3"
                          data-testid="button-resume-subscription"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {resumeMutation.isPending ? "Resuming..." : "Resume Trading"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Pause Trading</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Temporarily stop trading while maintaining your subscription
                    </p>
                    <Button
                      onClick={() => setShowPauseDialog(true)}
                      variant="outline"
                      data-testid="button-pause-subscription"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Subscription
                    </Button>
                  </div>
                )}

                {isCancelled ? (
                  <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-600">Subscription Ending Soon</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your subscription is scheduled to end on{" "}
                          {new Date(subscription.subscriptionEndsAt!).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}.
                          You will have full access until then. Changed your mind?
                        </p>
                        <Button
                          onClick={handleReactivate}
                          disabled={reactivateMutation.isPending}
                          variant="default"
                          className="mt-3"
                          data-testid="button-reactivate"
                        >
                          {reactivateMutation.isPending ? "Reactivating..." : "Reactivate Subscription"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-600">Danger Zone</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cancel your subscription and stop all trading activity
                        </p>
                        <Button
                          onClick={() => setShowUnsubscribeDialog(true)}
                          variant="destructive"
                          className="mt-3"
                          data-testid="button-unsubscribe"
                        >
                          Unsubscribe
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will temporarily stop all trading activity. You can resume anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="pause-reason" className="mb-2 block">
              Reason (optional)
            </Label>
            <Textarea
              id="pause-reason"
              placeholder="Why are you pausing?"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              data-testid="textarea-pause-reason"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-pause">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePause}
              disabled={pauseMutation.isPending}
              data-testid="button-confirm-pause"
            >
              {pauseMutation.isPending ? "Pausing..." : "Pause Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnsubscribeDialog} onOpenChange={setShowUnsubscribeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your subscription to {subscription.bot.name} and stop all trading
              activity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unsubscribe">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              disabled={unsubscribeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-unsubscribe"
            >
              {unsubscribeMutation.isPending ? "Unsubscribing..." : "Yes, Unsubscribe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

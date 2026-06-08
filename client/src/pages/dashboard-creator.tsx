import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, RefreshCw, CheckCircle2, XCircle, Clock, Webhook, TrendingUp, Award, AlertCircle, Settings, BarChart3, History, Tag, Percent, DollarSign, Send, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBotSchema } from "@shared/schema";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

const createBotFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  strategy: z.string().min(3, "Strategy is required"),
  category: z.enum(["scalping", "day_trading", "swing_trading", "trend_following", "mean_reversion", "arbitrage", "market_making", "grid_trading"]),
  assetClass: z.enum(["crypto", "stocks"]),
  riskLevel: z.string().min(1, "Risk level is required"),
  monthlyPrice: z.string().min(1, "Monthly price is required"),
  strategyDescription: z.string().min(20, "Strategy description must be at least 20 characters"),
});

type CreateBotForm = z.infer<typeof createBotFormSchema>;

const categoryLabels: Record<string, string> = {
  scalping: "Scalping",
  day_trading: "Day Trading",
  swing_trading: "Swing Trading",
  trend_following: "Trend Following",
  mean_reversion: "Mean Reversion",
  arbitrage: "Arbitrage",
  market_making: "Market Making",
  grid_trading: "Grid Trading",
};

function WebhookHistoryDialog({ bot }: { bot: any }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const { data: history = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creator/bots", bot.id, "webhook-history"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/creator/bots/${bot.id}/webhook-history`);
      return await res.json();
    },
    enabled: dialogOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: async (historyId: string) => {
      const res = await apiRequest("POST", `/api/creator/bots/${bot.id}/webhook-history/${historyId}/restore`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots", bot.id, "webhook-history"] });
      setConfirmRestore(null);
      setDialogOpen(false);
      toast({
        title: "Webhook Restored",
        description: "Previous webhook URL has been restored successfully",
      });
    },
    onError: () => {
      setConfirmRestore(null);
      toast({
        title: "Error",
        description: "Failed to restore webhook URL",
        variant: "destructive",
      });
    },
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            data-testid={`button-history-${bot.id}`}
            aria-label="View webhook history"
          >
            <History className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook URL History</DialogTitle>
            <DialogDescription>
              View and restore previous webhook URLs for {bot.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading history...
              </div>
            )}
            {!isLoading && history.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No previous webhook URLs found
              </div>
            )}
            {!isLoading && history.map((entry: any) => (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDistanceToNow(new Date(entry.replacedAt), { addSuffix: true })}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={entry.webhookUrl}
                            readOnly
                            className="font-mono text-xs"
                            title={entry.webhookUrl}
                            data-testid={`input-history-url-${entry.id}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyUrl(entry.webhookUrl)}
                            aria-label="Copy webhook URL"
                            data-testid={`button-copy-history-${entry.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setConfirmRestore(entry.id)}
                        disabled={restoreMutation.isPending}
                        data-testid={`button-restore-${entry.id}`}
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmRestore} onOpenChange={(open) => !open && setConfirmRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Webhook URL?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current webhook URL with the selected one. Your TradingView alerts will need to use the restored URL to send signals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRestore && restoreMutation.mutate(confirmRestore)}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DiscountCodesDialog({ bot }: { bot: any }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);

  const { data: discountCodes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creator/bots", bot.id, "discount-codes"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/creator/bots/${bot.id}/discount-codes`);
      return await res.json();
    },
    enabled: dialogOpen,
  });

  const form = useForm({
    defaultValues: {
      code: "",
      discountType: "percentage" as "percentage" | "fixed",
      discountValue: "",
      maxUses: "",
      expiresAt: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/creator/bots/${bot.id}/discount-codes`, {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        isActive: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots", bot.id, "discount-codes"] });
      form.reset();
      setCreateMode(false);
      toast({
        title: "Discount Code Created",
        description: "Your discount code has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ codeId, isActive }: { codeId: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/creator/bots/${bot.id}/discount-codes/${codeId}`, {
        isActive,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots", bot.id, "discount-codes"] });
      toast({
        title: "Status Updated",
        description: "Discount code status has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update discount code",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const res = await apiRequest("DELETE", `/api/creator/bots/${bot.id}/discount-codes/${codeId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots", bot.id, "discount-codes"] });
      toast({
        title: "Code Deactivated",
        description: "Discount code has been deactivated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate discount code",
        variant: "destructive",
      });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Discount code copied to clipboard",
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              data-testid={`button-discount-codes-${bot.id}`}
              aria-label="Manage discount codes"
            >
              <Tag className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Manage Discount Codes</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Discount Codes</DialogTitle>
          <DialogDescription>
            Create and manage discount codes for {bot.name}
          </DialogDescription>
        </DialogHeader>

        {!createMode ? (
          <div className="space-y-4">
            <Button
              onClick={() => setCreateMode(true)}
              data-testid="button-create-discount-code"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Discount Code
            </Button>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : discountCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No discount codes created yet
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {discountCodes.map((code: any) => (
                  <Card key={code.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="text-lg font-mono font-semibold bg-muted px-2 py-1 rounded">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyCode(code.code)}
                              data-testid={`button-copy-code-${code.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Badge variant={code.isActive ? "default" : "secondary"}>
                              {code.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              {code.discountType === "percentage" ? (
                                <>
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                  <span>{code.discountValue}% off</span>
                                </>
                              ) : (
                                <>
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span>${code.discountValue} off</span>
                                </>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              Uses: {code.currentUses}{code.maxUses ? ` / ${code.maxUses}` : " / ∞"}
                            </div>
                            {code.expiresAt && (
                              <div className="text-muted-foreground col-span-2">
                                Expires: {new Date(code.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate({ codeId: code.id, isActive: !code.isActive })}
                            disabled={toggleActiveMutation.isPending}
                            data-testid={`button-toggle-${code.id}`}
                          >
                            {code.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Discount Code</label>
                <Input
                  {...form.register("code")}
                  placeholder="SUMMER2025"
                  className="font-mono uppercase"
                  onChange={(e) => form.setValue("code", e.target.value.toUpperCase())}
                  data-testid="input-discount-code"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a unique code (letters and numbers only)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <Select
                  value={form.watch("discountType")}
                  onValueChange={(value: "percentage" | "fixed") => form.setValue("discountType", value)}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {form.watch("discountType") === "percentage" ? "Percentage (%)" : "Amount ($)"}
                </label>
                <Input
                  {...form.register("discountValue")}
                  type="number"
                  step={form.watch("discountType") === "percentage" ? "1" : "0.01"}
                  min={form.watch("discountType") === "percentage" ? "1" : "0.01"}
                  max={form.watch("discountType") === "percentage" ? "100" : undefined}
                  placeholder={form.watch("discountType") === "percentage" ? "20" : "10.00"}
                  data-testid="input-discount-value"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Uses (Optional)</label>
                  <Input
                    {...form.register("maxUses")}
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    data-testid="input-max-uses"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Expires At (Optional)</label>
                  <Input
                    {...form.register("expiresAt")}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-expires-at"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateMode(false);
                  form.reset();
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit-discount-code"
              >
                {createMutation.isPending ? "Creating..." : "Create Code"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardCreator() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: creatorBots = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creator/bots"],
  });

  const form = useForm<CreateBotForm>({
    resolver: zodResolver(createBotFormSchema),
    defaultValues: {
      name: "",
      description: "",
      strategy: "",
      category: "trend_following",
      assetClass: "crypto",
      riskLevel: "2",
      monthlyPrice: "99.00",
      strategyDescription: "",
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: CreateBotForm) => {
      const res = await apiRequest("POST", "/api/creator/bots", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Bot Created",
        description: "Your bot and webhook have been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot",
        variant: "destructive",
      });
    },
  });

  const regenerateWebhookMutation = useMutation({
    mutationFn: async (botId: string) => {
      const res = await apiRequest("PATCH", `/api/creator/bots/${botId}/regenerate-webhook`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots"] });
      toast({
        title: "Webhook Regenerated",
        description: "Your webhook secret has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate webhook",
        variant: "destructive",
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (botId: string) => {
      const res = await apiRequest("POST", `/api/creator/bots/${botId}/test-webhook`, {});
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send test signal");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots"] });
      toast({
        title: "Test Signal Sent",
        description: "A test signal was logged in your recent activity. Your webhook is connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message || "Could not send test signal",
        variant: "destructive",
      });
    },
  });

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  const onSubmit = (data: CreateBotForm) => {
    createBotMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your trading bots and webhook integrations
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-bot">
              <Plus className="mr-2 h-4 w-4" />
              Create Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trading Bot</DialogTitle>
              <DialogDescription>
                Set up a new bot with TradingView webhook integration
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Bot" {...field} data-testid="input-bot-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your bot"
                          {...field}
                          data-testid="input-bot-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Trend Following, Mean Reversion" {...field} data-testid="input-bot-strategy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scalping">Scalping</SelectItem>
                          <SelectItem value="day_trading">Day Trading</SelectItem>
                          <SelectItem value="swing_trading">Swing Trading</SelectItem>
                          <SelectItem value="trend_following">Trend Following</SelectItem>
                          <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                          <SelectItem value="arbitrage">Arbitrage</SelectItem>
                          <SelectItem value="market_making">Market Making</SelectItem>
                          <SelectItem value="grid_trading">Grid Trading</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the trading style that best describes this bot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-class">
                            <SelectValue placeholder="Select market" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="crypto">Crypto (Binance / Bybit)</SelectItem>
                          <SelectItem value="stocks">Stocks (Alpaca)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Which market this bot trades — determines how subscribers connect their broker
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-risk-level">
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 - Safest</SelectItem>
                            <SelectItem value="2">2 - Safe</SelectItem>
                            <SelectItem value="3">3 - Aggressive</SelectItem>
                            <SelectItem value="4">4 - High Risk</SelectItem>
                            <SelectItem value="5">5 - DANGER</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="99.00"
                            {...field}
                            data-testid="input-monthly-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="strategyDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed explanation of how your strategy works..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="input-strategy-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Explain your strategy, indicators used, entry/exit rules, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBotMutation.isPending}
                    data-testid="button-submit-bot"
                  >
                    {createBotMutation.isPending ? "Creating..." : "Create Bot"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold">{creatorBots.length}</p>
              <p className="text-sm text-muted-foreground">Total Bots</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {creatorBots.filter((b) => b.webhook?.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Active Webhooks</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {creatorBots.reduce((acc, b) => acc + (b.recentEvents?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Recent Events</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Bots</h2>
        {creatorBots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first trading bot to get started with webhook integrations
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-bot">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Bot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {creatorBots.map((bot: any) => {
              const isLive = bot.evaluationStatus === "live";
              const isInEvaluation = bot.evaluationStatus === "in_evaluation";
              const progress = bot.evaluationProgress || {
                tradeCount: 0,
                profitPercentage: 0,
                maxDrawdown: 0,
                requiredTrades: 10,
                requiredProfit: 8,
                requiredMaxDrawdown: 12,
              };
              const tradeProgress = (progress.tradeCount / progress.requiredTrades) * 100;
              const profitProgress = Math.max(0, (progress.profitPercentage / progress.requiredProfit) * 100);
              const drawdownUsedPct = progress.requiredMaxDrawdown > 0
                ? (progress.maxDrawdown / progress.requiredMaxDrawdown) * 100
                : 0;
              const drawdownPassing = progress.maxDrawdown <= progress.requiredMaxDrawdown;
              const meetsRequirements =
                progress.tradeCount >= progress.requiredTrades &&
                progress.profitPercentage >= progress.requiredProfit &&
                progress.maxDrawdown <= progress.requiredMaxDrawdown;

              return (
              <Card key={bot.id} data-testid={`card-bot-${bot.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle>{bot.name}</CardTitle>
                        {isLive && (
                          <Badge variant="default" className="gap-1" data-testid={`badge-status-${bot.id}`}>
                            <Award className="h-3 w-3" />
                            Live
                          </Badge>
                        )}
                        {isInEvaluation && (
                          <Badge variant="secondary" className="gap-1" data-testid={`badge-status-${bot.id}`}>
                            <TrendingUp className="h-3 w-3" />
                            In Evaluation
                          </Badge>
                        )}
                        {bot.evaluationStatus === "failed" && (
                          <Badge variant="destructive" className="gap-1" data-testid={`badge-status-${bot.id}`}>
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                        {!isLive && !isInEvaluation && bot.evaluationStatus !== "failed" && (
                          <Badge variant="outline" className="gap-1" data-testid={`badge-status-${bot.id}`}>
                            <AlertCircle className="h-3 w-3" />
                            Not Started
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{bot.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={bot.webhook?.status === "active" ? "default" : "secondary"}>
                        {bot.webhook?.status || "inactive"}
                      </Badge>
                      {bot.performance?.subscribers !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{bot.performance.subscribers} subscriber{bot.performance.subscribers !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isLive && (
                    <div className="space-y-3 p-3 bg-muted/50 rounded-md" data-testid={`evaluation-progress-${bot.id}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {progress.tradeCount === 0 ? "Evaluation Requirements" : "Evaluation Progress"}
                        </span>
                        <Link href={`/dashboard/creator/evaluation/${bot.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-evaluation-${bot.id}`}>
                            {progress.tradeCount === 0 ? "Get Started" : "View Details"}
                          </Button>
                        </Link>
                      </div>
                      
                      {progress.tradeCount === 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            To go live, your bot must meet all three requirements independently:
                          </p>
                          <ul className="text-xs space-y-1 ml-4">
                            <li className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>Minimum <strong>{progress.requiredTrades} trades</strong> completed</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>Cumulative profit of <strong>+{progress.requiredProfit}%</strong> or more</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>Maximum drawdown under <strong>{progress.requiredMaxDrawdown}%</strong></span>
                            </li>
                          </ul>
                          <p className="text-xs text-muted-foreground mt-2">
                            Connect your TradingView webhook below to start trading and begin evaluation.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Trades</span>
                                <span className="font-medium">
                                  {progress.tradeCount} / {progress.requiredTrades}
                                  {progress.tradeCount >= progress.requiredTrades && " ✓"}
                                </span>
                              </div>
                              <Progress value={Math.min(100, tradeProgress)} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Total Profit</span>
                                <span className={`font-medium ${progress.profitPercentage >= progress.requiredProfit ? 'text-success' : progress.profitPercentage >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                                  {progress.profitPercentage > 0 ? '+' : ''}{progress.profitPercentage.toFixed(2)}% / +{progress.requiredProfit}%
                                  {progress.profitPercentage >= progress.requiredProfit && " ✓"}
                                </span>
                              </div>
                              <Progress value={Math.min(100, profitProgress)} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Max Drawdown</span>
                                <span className={`font-medium ${drawdownPassing ? 'text-success' : 'text-destructive'}`}>
                                  {progress.maxDrawdown.toFixed(2)}% / {progress.requiredMaxDrawdown}%
                                  {drawdownPassing && " ✓"}
                                </span>
                              </div>
                              <Progress
                                value={Math.min(100, drawdownUsedPct)}
                                className="h-2"
                              />
                            </div>
                          </div>
                          {meetsRequirements && (
                            <p className="text-xs text-success flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Requirements met! Bot will go live soon.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">Webhook URL</label>
                    <div className="flex gap-2">
                      <Input
                        value={bot.webhook?.webhookUrl || "No webhook"}
                        readOnly
                        className="font-mono text-xs"
                        data-testid={`input-webhook-url-${bot.id}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyWebhookUrl(bot.webhook?.webhookUrl)}
                        disabled={!bot.webhook?.webhookUrl}
                        data-testid={`button-copy-webhook-${bot.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => regenerateWebhookMutation.mutate(bot.id)}
                        disabled={!bot.webhook || regenerateWebhookMutation.isPending}
                        data-testid={`button-regenerate-webhook-${bot.id}`}
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerateWebhookMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => testWebhookMutation.mutate(bot.id)}
                            disabled={!bot.webhook || testWebhookMutation.isPending}
                            data-testid={`button-test-webhook-${bot.id}`}
                          >
                            <Send className={`h-4 w-4 ${testWebhookMutation.isPending ? 'opacity-50' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send test signal</TooltipContent>
                      </Tooltip>
                      <WebhookHistoryDialog bot={bot} />
                      <DiscountCodesDialog bot={bot} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/dashboard/creator/bot/${bot.id}`}>
                        <Button variant="default" className="w-full" size="sm" data-testid={`button-view-bot-dashboard-${bot.id}`}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>
                      </Link>
                      <Link href={`/dashboard/creator/bot/${bot.id}/settings`}>
                        <Button variant="outline" className="w-full" size="sm" data-testid={`button-bot-settings-${bot.id}`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {bot.webhook?.lastReceivedAt && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last signal: {formatDistanceToNow(new Date(bot.webhook.lastReceivedAt), { addSuffix: true })}
                    </div>
                  )}

                  {bot.recentEvents && bot.recentEvents.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Recent Activity</label>
                      <div className="space-y-1">
                        {bot.recentEvents.slice(0, 3).map((event: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs"
                            data-testid={`webhook-event-${bot.id}-${idx}`}
                          >
                            {event.status === "success" ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <XCircle className="h-3 w-3 text-destructive" />
                            )}
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(event.processedAt), { addSuffix: true })}
                            </span>
                            <span>{event.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TradingView Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to connect your TradingView alerts to AlgoPilot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold mb-1">Step 1: Create Your Bot</h4>
              <p className="text-sm text-muted-foreground">
                Click "Create Bot" above to set up your trading bot. A webhook URL will be automatically generated.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Step 2: Set Up TradingView Alert</h4>
              <p className="text-sm text-muted-foreground">
                In TradingView, create an alert for your trading strategy. Configure the alert to trigger on your desired conditions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Step 3: Configure Webhook</h4>
              <p className="text-sm text-muted-foreground">
                In the alert settings, enable "Webhook URL" and paste your bot's webhook URL from above.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Step 4: Format Alert Message</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Set the alert message to JSON format with the following structure:
              </p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "time": "{{timenow}}"
}`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Step 5: Test Your Webhook</h4>
              <p className="text-sm text-muted-foreground">
                Trigger a test alert to verify the webhook is working. Check the "Recent Activity" section above to confirm signals are being received.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

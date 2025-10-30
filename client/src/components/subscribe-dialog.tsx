import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Bot, BotPerformance } from "@shared/schema";
import { TrendingUp, Users, Target, Activity } from "lucide-react";
import { SubscriptionPaymentDialog } from "./subscription-payment-dialog";

interface SubscribeDialogProps {
  bot: Bot & { performance: BotPerformance | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeDialog({ bot, open, onOpenChange }: SubscribeDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState("");

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-subscription-payment", { botId: bot.id });
      return await res.json();
    },
    onSuccess: (data: { clientSecret: string; subscriptionId: string }) => {
      setClientSecret(data.clientSecret);
      setStripeSubscriptionId(data.subscriptionId);
      setPaymentDialogOpen(true);
      onOpenChange(false);
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      setIsProcessing(false);
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
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscriptions", {
        botId: bot.id,
        stripeSubscriptionId: stripeSubscriptionId,
      });
      return await res.json();
    },
    onSuccess: (newSubscription: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription Created!",
        description: `Please configure your settings for ${bot.name} before going live`,
      });
      setPaymentDialogOpen(false);
      setTimeout(() => {
        setLocation(`/dashboard?openSettings=${newSubscription.id}`);
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = async () => {
    setIsProcessing(true);
    createPaymentMutation.mutate();
  };

  const handlePaymentSuccess = () => {
    subscribeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Subscribe to {bot.name}</DialogTitle>
          <DialogDescription>
            Review the bot's performance and confirm your subscription
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Bot Performance</h4>
            {bot.performance && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-success">
                      +{parseFloat(bot.performance.totalRoi).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Total ROI</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {parseFloat(bot.performance.winRate).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{bot.performance.subscribers}</div>
                    <div className="text-xs text-muted-foreground">Subscribers</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{bot.performance.totalTrades}</div>
                    <div className="text-xs text-muted-foreground">Total Trades</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{bot.description}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Monthly Subscription</span>
              <span className="text-2xl font-bold">${parseFloat(bot.monthlyPrice).toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You can cancel anytime. No hidden fees.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-subscribe"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={createPaymentMutation.isPending || isProcessing}
              className="flex-1"
              data-testid="button-confirm-subscribe"
            >
              {createPaymentMutation.isPending || isProcessing ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <SubscriptionPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        clientSecret={clientSecret}
        amount={parseFloat(bot.monthlyPrice).toFixed(0)}
        botName={bot.name}
        onSuccess={handlePaymentSuccess}
      />
    </Dialog>
  );
}

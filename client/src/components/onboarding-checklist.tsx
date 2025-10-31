import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { CheckCircle2, Circle, ArrowRight, Sparkles, X } from "lucide-react";
import type { UserOnboarding } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingChecklistProps {
  onboarding: UserOnboarding | null;
  onDismiss?: () => void;
}

export function OnboardingChecklist({ onboarding, onDismiss }: OnboardingChecklistProps) {
  const { toast } = useToast();
  
  const dismissPermanentlyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/onboarding/dismiss", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      toast({
        title: "Checklist hidden",
        description: "You won't see this checklist again. You can always view the Getting Started guide from the menu.",
      });
      onDismiss?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your preference. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDismissPermanently = () => {
    dismissPermanentlyMutation.mutate();
  };

  if (!onboarding || onboarding.completedAt || onboarding.hasDismissedChecklist) {
    return null;
  }

  const steps = [
    {
      id: "welcome",
      title: "Welcome to AlgoPilot",
      description: "Complete the welcome tour",
      completed: onboarding.hasCompletedWelcome,
      link: null,
      action: null,
    },
    {
      id: "marketplace",
      title: "Explore the Marketplace",
      description: "Browse available trading bots",
      completed: onboarding.hasViewedMarketplace,
      link: "/marketplace",
      action: "Browse Bots",
    },
    {
      id: "subscribe",
      title: "Subscribe to a Bot",
      description: "Choose and subscribe to your first bot",
      completed: onboarding.hasSubscribedToBot,
      link: "/marketplace",
      action: "View Marketplace",
    },
    {
      id: "settings",
      title: "Configure Bot Settings",
      description: "Set capital allocation and risk parameters",
      completed: onboarding.hasConfiguredSettings,
      link: "/dashboard/subscriptions",
      action: "Manage Subscriptions",
    },
    {
      id: "dashboard",
      title: "Review Your Dashboard",
      description: "Monitor your portfolio and performance",
      completed: onboarding.hasViewedDashboard,
      link: "/dashboard",
      action: "View Dashboard",
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle data-testid="text-checklist-title">Get Started with AlgoPilot</CardTitle>
              <CardDescription>
                Complete these steps to start trading
              </CardDescription>
            </div>
          </div>
          {onDismiss && completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              data-testid="button-dismiss-checklist"
            >
              Dismiss
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium" data-testid="text-progress-label">
              {completedCount} of {totalSteps} completed
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-onboarding" />
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                step.completed
                  ? "bg-muted/50"
                  : "bg-background border border-border hover-elevate"
              }`}
              data-testid={`checklist-item-${step.id}`}
            >
              <div className="shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${
                    step.completed ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
              {!step.completed && step.link && step.action && (
                <Link href={step.link}>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`button-action-${step.id}`}
                  >
                    {step.action}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Link href="/getting-started">
            <Button variant="ghost" size="sm" data-testid="button-view-guide">
              View Getting Started Guide
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissPermanently}
              disabled={dismissPermanentlyMutation.isPending}
              data-testid="button-dont-show-again"
            >
              <X className="h-4 w-4 mr-1" />
              Don't show again
            </Button>
            {completedCount === totalSteps && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                data-testid="button-complete-onboarding"
              >
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

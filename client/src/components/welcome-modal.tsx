import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, TrendingUp, Bot, Settings, AlertTriangle } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: (dontShowAgain?: boolean) => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    {
      title: "Welcome to AlgoPilot",
      icon: Bot,
      content: (
        <div className="space-y-4">
          <p className="text-base">
            AlgoPilot is your gateway to automated cryptocurrency trading. Subscribe to
            proven trading bots and let algorithms work for you 24/7.
          </p>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Automated Trading</p>
                <p className="text-sm text-muted-foreground">
                  Bots execute trades automatically based on proven strategies
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Performance Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Track detailed metrics, P&L, and historical performance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Risk Management</p>
                <p className="text-sm text-muted-foreground">
                  Set limits, control capital allocation, and manage drawdowns
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How It Works",
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Browse the Marketplace</p>
                <p className="text-sm text-muted-foreground">
                  Discover trading bots with detailed performance metrics and strategies
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Subscribe to a Bot</p>
                <p className="text-sm text-muted-foreground">
                  Choose a bot and select your subscription plan
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Configure Settings</p>
                <p className="text-sm text-muted-foreground">
                  Set your capital allocation, risk level, and notification preferences
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Monitor Performance</p>
                <p className="text-sm text-muted-foreground">
                  Track your portfolio and bot performance from your dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Important Information",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">Trading Involves Risk</p>
                <p className="text-sm text-muted-foreground">
                  Cryptocurrency trading carries substantial risk of loss. Past performance
                  does not guarantee future results. Only trade with capital you can afford
                  to lose.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Start with Mock Trading</p>
                <p className="text-sm text-muted-foreground">
                  Currently, all trading uses mock USDT balances. This lets you test
                  strategies and learn the platform risk-free before connecting real
                  exchanges.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            By continuing, you acknowledge that you have read our{" "}
            <a href="/terms-of-service" className="text-primary hover:underline" target="_blank">
              Terms of Service
            </a>
            ,{" "}
            <a href="/privacy-policy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </a>
            , and{" "}
            <a href="/risk-disclaimer" className="text-primary hover:underline" target="_blank">
              Risk Disclaimer
            </a>
            .
          </p>
        </div>
      ),
    },
  ];

  const CurrentIcon = steps[currentStep].icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(dontShowAgain);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-welcome">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CurrentIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl" data-testid="text-welcome-title">
                {steps[currentStep].title}
              </DialogTitle>
            </div>
            {currentStep === steps.length - 1 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dont-show"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  data-testid="checkbox-dont-show-again"
                />
                <label
                  htmlFor="dont-show"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Don't show again
                </label>
              </div>
            )}
          </div>
          <DialogDescription className="sr-only">
            Welcome to AlgoPilot onboarding
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{steps[currentStep].content}</div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                data-testid="button-back"
              >
                Back
              </Button>
            )}
            <Button onClick={handleNext} data-testid="button-next">
              {currentStep < steps.length - 1 ? "Next" : "Get Started"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

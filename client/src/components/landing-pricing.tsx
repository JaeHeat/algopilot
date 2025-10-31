import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "For Traders",
    price: "Free",
    description: "Pay only for the bots you subscribe to",
    features: [
      "Free platform access",
      "Browse all trading bots",
      "Subscribe to any bots you like",
      "Bot creators set prices ($5-50/month typical)",
      "Advanced performance metrics",
      "Unlimited exchange connections",
      "$10,000 mock trading capital",
      "Email support",
    ],
    popular: true,
  },
  {
    name: "For Creators",
    price: "Free to Apply",
    description: "Monetize your trading strategies",
    features: [
      "Free creator account",
      "List unlimited trading bots",
      "Set your own monthly pricing",
      "Earn 75% of subscription revenue",
      "Automated payouts",
      "TradingView webhook integration",
      "Performance analytics dashboard",
      "Priority creator support",
    ],
  },
];

export function LandingPricing() {
  return (
    <div className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground">
            Pay only for the bots you use
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            No platform fees, no subscription tiers. Subscribe to individual trading bots in the marketplace. Bot creators set their own prices (typically $5-50/month). We take a 25% commission to keep the platform running and continuously improving.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <Card 
              key={i} 
              className={`p-8 ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="mb-4">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Common
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              <Button 
                className="w-full mb-6" 
                variant={plan.popular ? "default" : "outline"}
                asChild
                data-testid={`button-${plan.name.toLowerCase().replace(/\s+/g, '-')}-plan`}
              >
                <a href="/api/login">{plan.name === "For Creators" ? "Apply to Create" : "Start Trading"}</a>
              </Button>
              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            <strong>Revenue Model:</strong> Traders pay bot subscription fees directly. Bot creators keep 75% of their subscription revenue, and AlgoPilot takes a 25% commission. Featured marketplace placements offer an additional monetization opportunity for creators.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Start trading with limited access",
    features: [
      "Browse all trading bots",
      "Subscribe to 2 free bots",
      "Basic performance metrics",
      "1 exchange connection",
      "Community support",
      "$10,000 mock trading capital",
    ],
  },
  {
    name: "Starter",
    price: "$29",
    description: "For active traders",
    features: [
      "Subscribe to unlimited bots",
      "Advanced analytics & charts",
      "Up to 3 exchange connections",
      "Priority email support",
      "Custom risk settings",
      "Trade history export",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "$99",
    description: "For professionals & bot creators",
    features: [
      "Everything in Starter",
      "Create and monetize your own bots",
      "80% revenue share on bot sales",
      "Unlimited exchange connections",
      "API access for automation",
      "24/7 priority support",
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
            Platform access + marketplace bot subscriptions
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Pay for platform access, then subscribe to individual bots in the marketplace. Bot creators set their own prices (typically $5-50/month). We take a 20% commission to keep your costs low.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <Card 
              key={i} 
              className={`p-8 ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="mb-4">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              <Button 
                className="w-full mb-6" 
                variant={plan.popular ? "default" : "outline"}
                asChild
                data-testid={`button-${plan.name.toLowerCase()}-plan`}
              >
                <a href="/api/login">Get Started</a>
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
      </div>
    </div>
  );
}

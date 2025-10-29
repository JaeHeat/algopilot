import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring the platform",
    features: [
      "Access to 5 free bots",
      "Basic performance metrics",
      "1 exchange connection",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    description: "For serious traders",
    features: [
      "Unlimited bot subscriptions",
      "Advanced analytics & metrics",
      "3 exchange connections",
      "Priority support",
      "Custom risk management",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For institutions and creators",
    features: [
      "Everything in Pro",
      "White-label solutions",
      "Dedicated account manager",
      "Custom integrations",
      "Revenue sharing program",
      "SLA guarantee",
    ],
  },
];

export function LandingPricing() {
  return (
    <div className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your trading goals
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
                data-testid={`button-${plan.name.toLowerCase()}-plan`}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
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

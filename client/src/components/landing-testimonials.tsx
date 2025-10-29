import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "AlgoPilot helped me automate my trading strategy and I've seen consistent returns. The platform is intuitive and the bots are vetted.",
    author: "Sarah Chen",
    role: "Crypto Trader",
    initials: "SC",
  },
  {
    quote: "As a bot creator, AlgoPilot gives me a platform to monetize my algorithms. The revenue sharing is fair and payouts are on time.",
    author: "Marcus Williams",
    role: "Algorithm Developer",
    initials: "MW",
  },
  {
    quote: "I was skeptical at first, but the transparency in performance metrics and the ability to test strategies risk-free convinced me.",
    author: "Alex Rivera",
    role: "DeFi Investor",
    initials: "AR",
  },
];

export function LandingTestimonials() {
  return (
    <div className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Trusted by Traders Worldwide</h2>
          <p className="text-xl text-muted-foreground">
            See what our community has to say
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="p-6 relative">
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

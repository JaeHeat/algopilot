import { LandingHero } from "@/components/landing-hero";
import { LandingHowItWorks } from "@/components/landing-how-it-works";
import { LandingExchanges } from "@/components/landing-exchanges";
import { LandingFeatures } from "@/components/landing-features";
import { LandingDashboardPreview } from "@/components/landing-dashboard-preview";
import { LandingCreatorCTA } from "@/components/landing-creator-cta";
import { LandingTestimonials } from "@/components/landing-testimonials";
import { LandingPricing } from "@/components/landing-pricing";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Footer } from "@/components/footer";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-2 -ml-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">AlgoPilot</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#creators" className="text-sm font-medium hover:text-primary transition-colors">
              For Creators
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
          </nav>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-sign-in">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        <LandingHero />
        
        <LandingExchanges />
        
        <div id="how-it-works">
          <LandingHowItWorks />
        </div>
        
        <div id="features">
          <LandingFeatures />
        </div>
        
        <LandingDashboardPreview />
        
        <div id="creators">
          <LandingCreatorCTA />
        </div>
        
        <LandingTestimonials />
        
        <div id="pricing">
          <LandingPricing />
        </div>
        
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Trading Smarter?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of traders using AlgoPilot to automate their crypto strategies
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="gap-2" data-testid="button-cta-start">
                <a href="/api/login">Start Free Trial</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20" data-testid="button-cta-demo">
                <a href="/marketplace">Book a Demo</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

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

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 hover-elevate rounded-lg px-2 -ml-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">AlgoPilot</span>
            </a>
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
            <Link href="/dashboard">
              <Button data-testid="button-sign-in">Sign In</Button>
            </Link>
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
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-start">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20" data-testid="button-cta-demo">
                Book a Demo
              </Button>
            </div>
          </div>
        </section>
        
        <footer className="py-12 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-bold">AlgoPilot</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automated crypto trading for everyone.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Marketplace</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
              © 2025 AlgoPilot. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

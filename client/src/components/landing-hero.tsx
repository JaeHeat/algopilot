import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ChevronRight, LineChart, Plug, Power } from "lucide-react";
import { SiBinance } from "react-icons/si";
import { Link } from "wouter";

const flowCards = [
  {
    title: "Choose Strategies",
    icon: LineChart,
    body: (
      <div className="space-y-2">
        <div className="h-1.5 w-16 rounded-full bg-muted-foreground/30" />
        <svg viewBox="0 0 120 36" className="w-full h-9" preserveAspectRatio="none">
          <path d="M0 28 L20 22 L40 26 L60 12 L80 16 L100 6 L120 9" fill="none" stroke="hsl(142 76% 40%)" strokeWidth="2.5" />
        </svg>
        <div className="flex gap-1">
          {[10, 16, 8, 14].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-emerald-500/60" style={{ height: h }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Connect Your Broker",
    icon: Plug,
    body: (
      <div className="space-y-1.5 text-[13px] font-semibold">
        <div className="rounded-md bg-muted px-2.5 py-1.5 flex items-center gap-2"><span className="h-4 w-4 rounded-sm bg-primary/20 inline-flex items-center justify-center text-[9px] text-primary">A</span> Alpaca</div>
        <div className="rounded-md bg-muted px-2.5 py-1.5 flex items-center gap-2"><SiBinance className="h-4 w-4 text-[#F0B90B]" /> Binance</div>
        <div className="rounded-md bg-muted px-2.5 py-1.5 flex items-center gap-2"><span className="h-4 w-4 rounded-sm bg-primary/20 inline-flex items-center justify-center text-[9px] text-primary">B</span> Bybit</div>
      </div>
    ),
  },
  {
    title: "Automate Your Trades",
    icon: Power,
    body: (
      <div className="space-y-2">
        <div className="mx-auto h-9 w-9 rounded-full bg-emerald-500/80 flex items-center justify-center">
          <Power className="h-4 w-4 text-white" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 rounded-sm bg-muted-foreground/15" />
          ))}
        </div>
      </div>
    ),
  },
];

const stats = [
  { value: "100%", label: "Verified track records" },
  { value: "Crypto + Stocks", label: "Both markets, one platform" },
  { value: "Non-custodial", label: "Your keys, your funds" },
];

export function LandingHero() {
  return (
    <div className="relative pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          Open Marketplace for<br />Trading Strategies
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Follow crypto &amp; stock strategies in real-time. Automate trades by connecting your own
          broker or exchange. Split capital across multiple strategies.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="gap-2" data-testid="button-get-started">
            <Link href="/auth/register">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" data-testid="button-sign-in-hero">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>No coding required</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground hidden sm:block" />
          <span>Connect Alpaca, Binance &amp; Bybit</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground hidden sm:block" />
          <span>Verified, tamper-proof records</span>
        </div>

        {/* Flow cards */}
        <div className="mt-14 flex flex-wrap items-stretch justify-center gap-3 md:gap-4">
          {flowCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="flex items-center gap-3 md:gap-4">
                <Card className="w-44 p-4 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{card.title}</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3 min-h-[92px]">{card.body}</div>
                </Card>
                {i < flowCards.length - 1 && <ChevronRight className="hidden md:block h-6 w-6 text-muted-foreground/40 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

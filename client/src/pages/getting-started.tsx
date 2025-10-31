import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bot,
  TrendingUp,
  Settings,
  LineChart,
  Bell,
  Shield,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function GettingStarted() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
            Getting Started with AlgoPilot
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn how to use AlgoPilot to automate your cryptocurrency trading
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>What is AlgoPilot?</CardTitle>
                  <CardDescription>Understanding the platform</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AlgoPilot is a marketplace for cryptocurrency trading bots. It connects traders
                with proven automated trading strategies, allowing you to subscribe to bots
                and have them execute trades on your behalf 24/7.
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <span className="font-medium">For Traders:</span> Access professional-grade
                    trading bots without writing a single line of code
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <span className="font-medium">For Creators:</span> Monetize your trading
                    algorithms by offering them to other traders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Step 1: Browse the Marketplace</CardTitle>
                  <CardDescription>Find the right bot for your strategy</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Navigate to the <Link href="/marketplace"><span className="text-primary hover:underline">Marketplace</span></Link> to
                browse available trading bots. Each bot displays:
              </p>
              <ul className="space-y-2 ml-6 list-disc text-sm">
                <li>Performance metrics (total return, win rate, Sharpe ratio)</li>
                <li>Strategy description and trading approach</li>
                <li>Subscription pricing plans</li>
                <li>Historical equity curve showing performance over time</li>
                <li>Recent trade history</li>
              </ul>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Pro Tip:</span> Look for bots with consistent
                  performance over time rather than just high returns. A steady equity curve
                  often indicates more sustainable strategies.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Step 2: Subscribe to a Bot</CardTitle>
                  <CardDescription>Choose your plan and start trading</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Once you've found a bot you like:</p>
              <ol className="space-y-3 ml-6 list-decimal">
                <li className="text-sm">
                  Click the <span className="font-medium">"Subscribe"</span> button on the bot's
                  detail page
                </li>
                <li className="text-sm">
                  Select a subscription plan (monthly, quarterly, or annual)
                </li>
                <li className="text-sm">
                  Complete payment through our secure Stripe integration
                </li>
                <li className="text-sm">
                  Your subscription will be activated immediately
                </li>
              </ol>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Payment Security:</span> All payments are processed
                  securely through Stripe. We never store your payment information.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Step 3: Configure Your Settings</CardTitle>
                  <CardDescription>Customize risk and capital allocation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>After subscribing, configure your bot settings:</p>
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-medium mb-2 text-sm">Capital Allocation</p>
                  <p className="text-sm text-muted-foreground">
                    Set how much capital to allocate to this bot (as a fixed amount or percentage
                    of your balance)
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-medium mb-2 text-sm">Risk Percentage (1-5%)</p>
                  <p className="text-sm text-muted-foreground">
                    Determines position size as a percentage of allocated capital per trade
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-medium mb-2 text-sm">Maximum Drawdown</p>
                  <p className="text-sm text-muted-foreground">
                    Auto-pause the bot if losses exceed this percentage to protect your capital
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-medium mb-2 text-sm">Notification Preferences</p>
                  <p className="text-sm text-muted-foreground">
                    Choose which email alerts you want to receive (trades, drawdowns, summaries)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Step 4: Monitor Performance</CardTitle>
                  <CardDescription>Track your portfolio and bot activity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Access your <Link href="/dashboard"><span className="text-primary hover:underline">Dashboard</span></Link> to:</p>
              <ul className="space-y-2 ml-6 list-disc text-sm">
                <li>View all active subscriptions and their performance</li>
                <li>Track total portfolio value and P&L</li>
                <li>Monitor individual bot performance metrics</li>
                <li>Review recent trades and positions</li>
                <li>Manage subscription settings</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Your dashboard updates in real-time as bots execute trades, giving you complete
                visibility into your automated trading portfolio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Stay informed about your trading activity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>AlgoPilot keeps you informed with email notifications:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Trade Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when positions are opened or closed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Drawdown Warnings</p>
                    <p className="text-sm text-muted-foreground">
                      Alerts when a bot exceeds maximum drawdown and is auto-paused
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Performance Summaries</p>
                    <p className="text-sm text-muted-foreground">
                      Weekly and monthly reports with detailed P&L breakdowns
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Risk Warning</CardTitle>
                  <CardDescription>Important information about trading</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium">
                Cryptocurrency trading involves substantial risk of loss.
              </p>
              <ul className="space-y-2 ml-6 list-disc text-sm">
                <li>Past performance does not guarantee future results</li>
                <li>You could lose some or all of your invested capital</li>
                <li>Only trade with money you can afford to lose</li>
                <li>Automated bots cannot eliminate market risk</li>
                <li>Always use risk management features (drawdown limits, position sizing)</li>
              </ul>
              <Separator />
              <p className="text-sm">
                For complete details, please review our{" "}
                <a href="/risk-disclaimer" className="text-primary hover:underline" target="_blank">
                  Risk Disclaimer
                </a>
                ,{" "}
                <a href="/terms-of-service" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </a>
                , and{" "}
                <a href="/privacy-policy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>For Bot Creators</CardTitle>
                  <CardDescription>Monetize your trading algorithms</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have a proven trading strategy, you can become a bot creator:
              </p>
              <ol className="space-y-3 ml-6 list-decimal text-sm">
                <li>
                  Access the <Link href="/creator-dashboard"><span className="text-primary hover:underline">Creator Dashboard</span></Link>
                </li>
                <li>Create a new bot with your strategy description and pricing</li>
                <li>Get your unique webhook URL for TradingView integration</li>
                <li>Configure TradingView alerts to send trade signals to your webhook</li>
                <li>Monitor subscriber activity and webhook events</li>
              </ol>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">TradingView Integration:</span> AlgoPilot uses
                  webhooks to receive trade signals from TradingView alerts. This allows you to
                  use TradingView's powerful charting and strategy tools to generate automated
                  trading signals.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Link href="/marketplace">
              <Button size="lg" data-testid="button-browse-marketplace">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ExchangeConnectionCard } from "@/components/exchange-connection-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function DashboardSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and exchange connections</p>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Exchange Connections</h2>
        <div className="space-y-4">
          <ExchangeConnectionCard exchange="Binance" connected={true} />
          <ExchangeConnectionCard exchange="Coinbase" connected={false} />
          <ExchangeConnectionCard exchange="KuCoin" connected={false} />
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="cryptotrader" data-testid="input-username" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" data-testid="input-current-password" />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" data-testid="input-confirm-password" />
            </div>
          </div>
          
          <Button data-testid="button-save-settings">Save Changes</Button>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trade Notifications</p>
              <p className="text-sm text-muted-foreground">Receive alerts when bots execute trades</p>
            </div>
            <Switch data-testid="switch-trade-notifications" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Performance Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified of significant P&L changes</p>
            </div>
            <Switch data-testid="switch-performance-alerts" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Subscription Renewals</p>
              <p className="text-sm text-muted-foreground">Reminders for upcoming bot subscription renewals</p>
            </div>
            <Switch defaultChecked data-testid="switch-subscription-renewals" />
          </div>
        </div>
      </Card>
    </div>
  );
}

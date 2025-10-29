import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ExchangeConnectionCard } from "@/components/exchange-connection-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ExchangeConnection } from "@shared/schema";
import { Plus } from "lucide-react";

export default function DashboardSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [addExchangeOpen, setAddExchangeOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const { data: connections, error } = useQuery<ExchangeConnection[]>({
    queryKey: ["/api/exchanges"],
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const addConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/exchanges", {
        method: "POST",
        body: JSON.stringify({
          exchange: selectedExchange,
          apiKey,
          apiSecret,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      toast({
        title: "Success",
        description: `${selectedExchange} connection added successfully`,
      });
      setAddExchangeOpen(false);
      setSelectedExchange("");
      setApiKey("");
      setApiSecret("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add exchange connection",
        variant: "destructive",
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/exchanges/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchanges"] });
      toast({
        title: "Success",
        description: "Exchange connection removed",
      });
    },
  });

  const handleAddConnection = () => {
    if (!selectedExchange || !apiKey || !apiSecret) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    addConnectionMutation.mutate();
  };

  const availableExchanges = ["Binance", "Coinbase", "Bybit", "KuCoin"];
  const connectedExchanges = connections?.map((c) => c.exchange) ?? [];

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and exchange connections</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Exchange Connections</h2>
          <Button
            onClick={() => setAddExchangeOpen(true)}
            className="gap-2"
            data-testid="button-add-exchange"
          >
            <Plus className="h-4 w-4" />
            Add Exchange
          </Button>
        </div>
        <div className="space-y-4">
          {availableExchanges.map((exchange) => {
            const connection = connections?.find((c) => c.exchange === exchange);
            return (
              <ExchangeConnectionCard
                key={exchange}
                exchange={exchange}
                connected={!!connection}
                onDisconnect={connection ? () => deleteConnectionMutation.mutate(connection.id) : undefined}
              />
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Account Information</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Not set"}
                disabled
                data-testid="input-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user?.role || "subscriber"} disabled data-testid="input-role" />
          </div>
          <p className="text-sm text-muted-foreground">
            Profile information is managed through Replit Auth
          </p>
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

      <Dialog open={addExchangeOpen} onOpenChange={setAddExchangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exchange Connection</DialogTitle>
            <DialogDescription>
              Connect your exchange account to enable automated trading
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                <SelectTrigger data-testid="select-exchange">
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {availableExchanges
                    .filter((ex) => !connectedExchanges.includes(ex))
                    .map((exchange) => (
                      <SelectItem key={exchange} value={exchange}>
                        {exchange}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                data-testid="input-api-key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API secret"
                data-testid="input-api-secret"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your API keys are encrypted and stored securely. We recommend using API keys with trading
              permissions only, not withdrawal permissions.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAddExchangeOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddConnection}
                disabled={addConnectionMutation.isPending}
                className="flex-1"
                data-testid="button-save-exchange"
              >
                {addConnectionMutation.isPending ? "Saving..." : "Save Connection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ExchangeConnection } from "@shared/schema";
import {
  Plus,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";

export default function DashboardSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [addExchangeOpen, setAddExchangeOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [connectionType, setConnectionType] = useState<"paper" | "live">("paper");
  const [accountType, setAccountType] = useState<"spot" | "futures">("spot");
  const [isTestnet, setIsTestnet] = useState(false);

  const { data: connections, error } = useQuery<ExchangeConnection[]>({
    queryKey: ["/api/exchange-connections"],
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
        window.location.href = "/auth/login";
      }, 500);
    }
  }, [error, toast]);

  const addConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/exchange-connections", {
        exchange: selectedExchange,
        apiKey,
        apiSecret,
        passphrase: passphrase || null,
        connectionType,
        accountType,
        isTestnet,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-connections"] });
      toast({
        title: "Success",
        description: `${selectedExchange} connection added successfully`,
      });
      resetForm();
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
      const res = await apiRequest("DELETE", `/api/exchange-connections/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-connections"] });
      toast({
        title: "Success",
        description: "Exchange connection removed",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/exchange-connections/${id}/test`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-connections"] });
      toast({
        title: data.isValid ? "Success" : "Connection Failed",
        description: data.message,
        variant: data.isValid ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAddExchangeOpen(false);
    setSelectedExchange("");
    setApiKey("");
    setApiSecret("");
    setPassphrase("");
    setConnectionType("paper");
    setAccountType("spot");
    setIsTestnet(false);
  };

  const handleAddConnection = () => {
    if (!selectedExchange || !apiKey || !apiSecret) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedExchange === "OKX" && !passphrase) {
      toast({
        title: "Validation Error",
        description: "OKX requires a passphrase",
        variant: "destructive",
      });
      return;
    }
    
    addConnectionMutation.mutate();
  };

  const availableExchanges = ["Binance", "Bybit", "OKX", "Kraken", "Bitfinex"];

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "invalid":
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>;
      case "invalid":
        return <Badge className="bg-danger/10 text-danger border-danger/20">Invalid</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Unchecked</Badge>;
    }
  };

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
          <div>
            <h2 className="text-xl font-semibold">Exchange Connections</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your exchange accounts for live trading or use paper trading mode
            </p>
          </div>
          <Button
            onClick={() => setAddExchangeOpen(true)}
            className="gap-2"
            data-testid="button-add-exchange"
          >
            <Plus className="h-4 w-4" />
            Add Exchange
          </Button>
        </div>

        {connections && connections.length > 0 ? (
          <div className="space-y-3">
            {connections.map((connection) => (
              <Card key={connection.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{connection.exchange}</h3>
                      {getStatusBadge(connection.connectionStatus)}
                      {connection.connectionType === "live" && (
                        <Badge variant="outline" className="bg-primary/10">Live Trading</Badge>
                      )}
                      {connection.isTestnet && (
                        <Badge variant="outline" className="bg-accent/10">Testnet</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Account Type:</span> {connection.accountType}
                      </div>
                      <div>
                        <span className="font-medium">Mode:</span> {connection.connectionType === "paper" ? "Paper Trading" : "Live Trading"}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">API Key:</span> {connection.apiKey.substring(0, 8)}...
                      </div>
                      {connection.lastSyncedAt && (
                        <div className="col-span-2">
                          <span className="font-medium">Last Tested:</span>{" "}
                          {new Date(connection.lastSyncedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => testConnectionMutation.mutate(connection.id)}
                      disabled={testConnectionMutation.isPending}
                      data-testid={`button-test-${connection.id}`}
                    >
                      <RefreshCw className={`h-4 w-4 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteConnectionMutation.mutate(connection.id)}
                      data-testid={`button-delete-${connection.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No exchange connections yet. Add one to get started.</p>
          </div>
        )}
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

      <Card className="p-6 border-danger/50">
        <h2 className="text-xl font-semibold mb-4 text-danger">Account Actions</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your AlgoPilot account</p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/api/logout")}
              className="gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={addExchangeOpen} onOpenChange={setAddExchangeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Exchange Connection</DialogTitle>
            <DialogDescription>
              Connect your exchange account to enable automated trading. Start with paper trading to test strategies risk-free.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange *</Label>
              <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                <SelectTrigger data-testid="select-exchange">
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {availableExchanges.map((exchange) => (
                    <SelectItem key={exchange} value={exchange}>
                      {exchange}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trading Mode *</Label>
                <Select value={connectionType} onValueChange={(v: any) => setConnectionType(v)}>
                  <SelectTrigger data-testid="select-connection-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paper">Paper Trading (Virtual Money)</SelectItem>
                    <SelectItem value="live">Live Trading (Real Money)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                  <SelectTrigger data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spot">Spot Trading</SelectItem>
                    <SelectItem value="futures">Futures/Margin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="testnet"
                checked={isTestnet}
                onCheckedChange={setIsTestnet}
                data-testid="switch-testnet"
              />
              <Label htmlFor="testnet" className="cursor-pointer">
                Use Testnet/Sandbox (for testing with fake money)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key *</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                data-testid="input-api-key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret *</Label>
              <Input
                id="api-secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API secret"
                data-testid="input-api-secret"
              />
            </div>

            {selectedExchange === "OKX" && (
              <div className="space-y-2">
                <Label htmlFor="passphrase">Passphrase * (Required for OKX)</Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase"
                  data-testid="input-passphrase"
                />
              </div>
            )}

            <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
              <p className="text-sm font-medium mb-2">Security Recommendations:</p>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                <li>Your API keys are encrypted and stored securely</li>
                <li>Enable trading permissions only, NOT withdrawal permissions</li>
                <li>Use IP whitelist restrictions on your exchange API settings</li>
                <li>Start with paper trading to test strategies without risk</li>
                <li>For live trading, start with small amounts</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm} className="flex-1">
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

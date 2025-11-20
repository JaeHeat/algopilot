import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BotSettings } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Settings2, TrendingUp, Shield, Clock, Target } from "lucide-react";

export default function DashboardBotSettings() {
  const { id: botId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("position");

  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ["/api/creator/bots", botId, "settings"],
    enabled: !!botId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<BotSettings>) => {
      return apiRequest("PATCH", `/api/creator/bots/${botId}/settings`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bots", botId, "settings"] });
      toast({
        title: "Settings saved",
        description: "Your bot settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState<Partial<BotSettings>>({});

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
    setFormData({});
  };

  const updateField = (field: keyof BotSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getValue = <K extends keyof BotSettings>(field: K): BotSettings[K] | undefined => {
    return (formData[field] !== undefined ? formData[field] : settings?.[field]) as BotSettings[K] | undefined;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Settings not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/creator")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Bot Settings</h1>
          <p className="text-muted-foreground">Configure your trading bot parameters and risk management</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={Object.keys(formData).length === 0 || updateSettingsMutation.isPending}
          data-testid="button-save-settings"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="position" data-testid="tab-position">
            <TrendingUp className="h-4 w-4 mr-2" />
            Position
          </TabsTrigger>
          <TabsTrigger value="risk" data-testid="tab-risk">
            <Shield className="h-4 w-4 mr-2" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="signals" data-testid="tab-signals">
            <Settings2 className="h-4 w-4 mr-2" />
            Signals
          </TabsTrigger>
          <TabsTrigger value="execution" data-testid="tab-execution">
            <Target className="h-4 w-4 mr-2" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="position" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Sizing</CardTitle>
              <CardDescription>Configure how your bot sizes positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="leverage">Leverage</Label>
                <Input
                  id="leverage"
                  type="number"
                  min="1"
                  max="20"
                  value={getValue("leverage") || 1}
                  onChange={(e) => updateField("leverage", parseInt(e.target.value))}
                  data-testid="input-leverage"
                />
                <p className="text-sm text-muted-foreground">Trading leverage (1x to 20x)</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="positionSizingStrategy">Position Sizing Strategy</Label>
                <Select
                  value={getValue("positionSizingStrategy") || "fixed_amount"}
                  onValueChange={(value) => updateField("positionSizingStrategy", value)}
                >
                  <SelectTrigger id="positionSizingStrategy" data-testid="select-position-sizing-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="percent_of_balance">Percent of Balance</SelectItem>
                    <SelectItem value="risk_based">Risk-Based (% of Balance per Trade)</SelectItem>
                    <SelectItem value="kelly_criterion">Kelly Criterion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionSizeValue">Position Size Value</Label>
                <Input
                  id="positionSizeValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={getValue("positionSizeValue") || "100.00"}
                  onChange={(e) => updateField("positionSizeValue", e.target.value)}
                  data-testid="input-position-size-value"
                />
                <p className="text-sm text-muted-foreground">
                  {getValue("positionSizingStrategy") === "percent_of_balance" 
                    ? "Percentage of balance to use per trade (e.g., 10 = 10%)"
                    : getValue("positionSizingStrategy") === "risk_based"
                    ? "Risk percentage per trade (e.g., 2 = 2% risk per trade)"
                    : getValue("positionSizingStrategy") === "kelly_criterion"
                    ? "Kelly fraction as percentage (e.g., 25 = 25% of Kelly)"
                    : "Fixed dollar amount per trade"}
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoCompounding">Auto-Compounding</Label>
                  <p className="text-sm text-muted-foreground">Automatically increase position sizes as balance grows</p>
                </div>
                <Switch
                  id="autoCompounding"
                  checked={getValue("autoCompounding") || false}
                  onCheckedChange={(checked) => updateField("autoCompounding", checked)}
                  data-testid="switch-auto-compounding"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Set stop loss, take profit, and drawdown limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stopLossPercentage">Stop Loss Percentage</Label>
                <Input
                  id="stopLossPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={getValue("stopLossPercentage") || ""}
                  onChange={(e) => updateField("stopLossPercentage", e.target.value || null)}
                  placeholder="Optional"
                  data-testid="input-stop-loss-percentage"
                />
                <p className="text-sm text-muted-foreground">Automatic stop loss at X% below entry (leave empty for none)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeProfitPercentage">Take Profit Percentage</Label>
                <Input
                  id="takeProfitPercentage"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={getValue("takeProfitPercentage") || ""}
                  onChange={(e) => updateField("takeProfitPercentage", e.target.value || null)}
                  placeholder="Optional"
                  data-testid="input-take-profit-percentage"
                />
                <p className="text-sm text-muted-foreground">Automatic take profit at X% above entry (leave empty for none)</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxDrawdownPercentage">Maximum Drawdown</Label>
                <Input
                  id="maxDrawdownPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={getValue("maxDrawdownPercentage") || "10.00"}
                  onChange={(e) => updateField("maxDrawdownPercentage", e.target.value)}
                  data-testid="input-max-drawdown-percentage"
                />
                <p className="text-sm text-muted-foreground">Maximum allowed drawdown before bot pauses (default 10%)</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="closePositionsOnDrawdown">Close Positions on Drawdown Breach</Label>
                  <p className="text-sm text-muted-foreground">Automatically close all positions when max drawdown is hit</p>
                </div>
                <Switch
                  id="closePositionsOnDrawdown"
                  checked={getValue("closePositionsOnDrawdown") ?? true}
                  onCheckedChange={(checked) => updateField("closePositionsOnDrawdown", checked)}
                  data-testid="switch-close-positions-on-drawdown"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxPositionsPerSymbol">Max Positions Per Symbol</Label>
                <Input
                  id="maxPositionsPerSymbol"
                  type="number"
                  min="1"
                  max="10"
                  value={getValue("maxPositionsPerSymbol") || 1}
                  onChange={(e) => updateField("maxPositionsPerSymbol", parseInt(e.target.value))}
                  data-testid="input-max-positions-per-symbol"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTotalPositions">Max Total Open Positions</Label>
                <Input
                  id="maxTotalPositions"
                  type="number"
                  min="1"
                  max="20"
                  value={getValue("maxTotalPositions") || 5}
                  onChange={(e) => updateField("maxTotalPositions", parseInt(e.target.value))}
                  data-testid="input-max-total-positions"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Signal Handling</CardTitle>
              <CardDescription>Configure how your bot responds to TradingView signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signalHandling">Signal Handling Mode</Label>
                <Select
                  value={getValue("signalHandling") || "open_close"}
                  onValueChange={(value) => updateField("signalHandling", value)}
                >
                  <SelectTrigger id="signalHandling" data-testid="select-signal-handling">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_close">Open & Close - LONG opens long, SHORT opens short</SelectItem>
                    <SelectItem value="reverse">Reverse - Each signal reverses current position</SelectItem>
                    <SelectItem value="close_only">Close Only - Signals only close existing positions</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">How the bot interprets LONG/SHORT signals from TradingView</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="allowedSymbols">Allowed Trading Symbols</Label>
                <Input
                  id="allowedSymbols"
                  type="text"
                  value={(getValue("allowedSymbols") as string[] || []).join(", ")}
                  onChange={(e) => updateField("allowedSymbols", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="BTCUSDT, ETHUSDT, SOLUSDT (leave empty for all)"
                  data-testid="input-allowed-symbols"
                />
                <p className="text-sm text-muted-foreground">Comma-separated list of symbols (leave empty to allow all)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minTradeInterval">Minimum Trade Interval (minutes)</Label>
                <Input
                  id="minTradeInterval"
                  type="number"
                  min="0"
                  value={getValue("minTradeInterval") || ""}
                  onChange={(e) => updateField("minTradeInterval", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Optional - prevents rapid consecutive trades"
                  data-testid="input-min-trade-interval"
                />
                <p className="text-sm text-muted-foreground">Minimum time between trades (leave empty for no restriction)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Execution</CardTitle>
              <CardDescription>Configure order types and execution parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orderType">Order Type</Label>
                <Select
                  value={getValue("orderType") || "market"}
                  onValueChange={(value) => updateField("orderType", value)}
                >
                  <SelectTrigger id="orderType" data-testid="select-order-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Order</SelectItem>
                    <SelectItem value="limit">Limit Order</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Market orders execute immediately, limit orders wait for specific price</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slippageTolerance">Slippage Tolerance (%)</Label>
                <Input
                  id="slippageTolerance"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={getValue("slippageTolerance") || "0.50"}
                  onChange={(e) => updateField("slippageTolerance", e.target.value)}
                  data-testid="input-slippage-tolerance"
                />
                <p className="text-sm text-muted-foreground">Maximum acceptable price slippage for market orders (default 0.5%)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Schedule</CardTitle>
              <CardDescription>Set specific hours and days for trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tradingHoursEnabled">Enable Trading Hours</Label>
                  <p className="text-sm text-muted-foreground">Restrict trading to specific hours of the day</p>
                </div>
                <Switch
                  id="tradingHoursEnabled"
                  checked={getValue("tradingHoursEnabled") || false}
                  onCheckedChange={(checked) => updateField("tradingHoursEnabled", checked)}
                  data-testid="switch-trading-hours-enabled"
                />
              </div>

              {getValue("tradingHoursEnabled") && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tradingHoursStart">Start Hour (UTC)</Label>
                      <Input
                        id="tradingHoursStart"
                        type="number"
                        min="0"
                        max="23"
                        value={getValue("tradingHoursStart") || 0}
                        onChange={(e) => updateField("tradingHoursStart", parseInt(e.target.value))}
                        data-testid="input-trading-hours-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tradingHoursEnd">End Hour (UTC)</Label>
                      <Input
                        id="tradingHoursEnd"
                        type="number"
                        min="0"
                        max="23"
                        value={getValue("tradingHoursEnd") || 23}
                        onChange={(e) => updateField("tradingHoursEnd", parseInt(e.target.value))}
                        data-testid="input-trading-hours-end"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradingDays">Trading Days</Label>
                    <Input
                      id="tradingDays"
                      type="text"
                      value={(getValue("tradingDays") as string[] || []).join(", ")}
                      onChange={(e) => updateField("tradingDays", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      placeholder="Monday, Tuesday, Wednesday, Thursday, Friday"
                      data-testid="input-trading-days"
                    />
                    <p className="text-sm text-muted-foreground">Comma-separated days (leave empty for all days)</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {Object.keys(formData).length > 0 && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFormData({})} data-testid="button-discard">
                Discard
              </Button>
              <Button onClick={handleSave} disabled={updateSettingsMutation.isPending} data-testid="button-save-changes">
                <Save className="h-4 w-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

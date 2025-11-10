import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle2,
  Settings,
  BarChart3,
  Edit,
  Save,
  X,
  Award,
  Clock,
  Percent,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryLabels: Record<string, string> = {
  scalping: "Scalping",
  day_trading: "Day Trading",
  swing_trading: "Swing Trading",
  trend_following: "Trend Following",
  mean_reversion: "Mean Reversion",
  arbitrage: "Arbitrage",
  market_making: "Market Making",
  grid_trading: "Grid Trading",
};

export default function DashboardCreatorBotDetail() {
  const [, params] = useRoute("/dashboard/creator/bot/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const botId = params?.id;
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });

  const { data: creatorBots = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creator/bots"],
  });

  const bot = creatorBots.find((b) => b.id === botId);

  const updateBotMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest("PATCH", `/api/creator/bots/${botId}`, updates);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/creator/bots"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/bots", botId] });
      setIsEditingDetails(false);
      toast({
        title: "Bot updated",
        description: "Your bot details have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bot. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Bot not found</h2>
        <Link href="/dashboard/creator">
          <Button variant="outline" data-testid="button-back-to-creator">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Creator Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isLive = bot.evaluationStatus === "live";
  const isInEvaluation = bot.evaluationStatus === "in_evaluation";
  const progress = bot.evaluationProgress || {
    tradeCount: 0,
    profitPercentage: 0,
    maxDrawdown: 0,
    requiredTrades: 10,
    requiredProfit: 10,
    requiredMaxDrawdown: 5,
  };

  const handleEditDetails = () => {
    setEditForm({
      name: bot.name,
      description: bot.description || "",
      price: (bot.price / 100).toString(),
      category: bot.category,
    });
    setIsEditingDetails(true);
  };

  const handleSaveDetails = () => {
    updateBotMutation.mutate({
      name: editForm.name,
      description: editForm.description,
      price: Math.round(parseFloat(editForm.price) * 100),
      category: editForm.category,
    });
  };

  const meetsEvaluationRequirements =
    progress.tradeCount >= progress.requiredTrades &&
    progress.profitPercentage >= progress.requiredProfit &&
    progress.maxDrawdown <= progress.requiredMaxDrawdown;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/creator">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-bot-name">{bot.name}</h1>
            <p className="text-muted-foreground">{bot.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Live
            </Badge>
          )}
          {isInEvaluation && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              In Evaluation
            </Badge>
          )}
          {!isLive && !isInEvaluation && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Not Started
            </Badge>
          )}
          <Link href={`/dashboard/creator/bot/${botId}/settings`}>
            <Button variant="outline" data-testid="button-bot-settings">
              <Settings className="mr-2 h-4 w-4" />
              Bot Settings
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="evaluation" data-testid="tab-evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">Bot Details</TabsTrigger>
          <TabsTrigger value="updates" data-testid="tab-updates">Updates</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-trades">{progress.tradeCount}</div>
                <p className="text-xs text-muted-foreground">
                  {progress.requiredTrades - progress.tradeCount > 0
                    ? `${progress.requiredTrades - progress.tradeCount} more needed for evaluation`
                    : "Requirement met"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                {progress.profitPercentage >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    progress.profitPercentage >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                  data-testid="stat-total-profit"
                >
                  {progress.profitPercentage.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress.profitPercentage >= progress.requiredProfit
                    ? "Requirement met"
                    : `Need +${(progress.requiredProfit - progress.profitPercentage).toFixed(2)}% more`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    progress.maxDrawdown <= progress.requiredMaxDrawdown
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                  data-testid="stat-max-drawdown"
                >
                  {progress.maxDrawdown.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress.maxDrawdown <= progress.requiredMaxDrawdown
                    ? "Within limit"
                    : `Exceeds ${progress.requiredMaxDrawdown}% limit`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-price">${((bot.price || 0) / 100).toFixed(2)}/mo</div>
                <p className="text-xs text-muted-foreground">Monthly subscription</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/creator/evaluation/${botId}`}>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-evaluation">
                    <Award className="mr-2 h-4 w-4" />
                    View Evaluation Details
                  </Button>
                </Link>
                <Link href={`/dashboard/creator/bot/${botId}/settings`}>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-configure-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Bot Settings
                  </Button>
                </Link>
                <Link href={`/bot/${botId}`}>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-preview-public">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Preview Public Page
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={bot.webhook?.status === "active" ? "default" : "secondary"}>
                    {bot.webhook?.status || "inactive"}
                  </Badge>
                </div>
                {bot.webhook?.lastReceivedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Signal</span>
                    <span className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(bot.webhook.lastReceivedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evaluation Progress</CardTitle>
                  <CardDescription>
                    Track your bot's performance against marketplace requirements
                  </CardDescription>
                </div>
                <Link href={`/dashboard/creator/evaluation/${botId}`}>
                  <Button variant="outline" data-testid="button-full-evaluation">
                    View Full Details
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trades Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Completed Trades</Label>
                  <span className="text-sm text-muted-foreground">
                    {progress.tradeCount} / {progress.requiredTrades}
                  </span>
                </div>
                <Progress
                  value={(progress.tradeCount / progress.requiredTrades) * 100}
                  className="h-2"
                />
                {progress.tradeCount >= progress.requiredTrades ? (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Requirement met
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {progress.requiredTrades - progress.tradeCount} more trades needed
                  </p>
                )}
              </div>

              {/* Profit Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Total Profit</Label>
                  <span className="text-sm text-muted-foreground">
                    {progress.profitPercentage.toFixed(2)}% / {progress.requiredProfit}%
                  </span>
                </div>
                <Progress
                  value={Math.min((progress.profitPercentage / progress.requiredProfit) * 100, 100)}
                  className="h-2"
                />
                {progress.profitPercentage >= progress.requiredProfit ? (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Requirement met
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Need +{(progress.requiredProfit - progress.profitPercentage).toFixed(2)}% more profit
                  </p>
                )}
              </div>

              {/* Drawdown Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Maximum Drawdown</Label>
                  <span className="text-sm text-muted-foreground">
                    {progress.maxDrawdown.toFixed(2)}% / {progress.requiredMaxDrawdown}%
                  </span>
                </div>
                <Progress
                  value={Math.min((progress.maxDrawdown / progress.requiredMaxDrawdown) * 100, 100)}
                  className="h-2"
                />
                {progress.maxDrawdown <= progress.requiredMaxDrawdown ? (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Within acceptable limit
                  </p>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Exceeds maximum allowed drawdown
                  </p>
                )}
              </div>

              {meetsEvaluationRequirements && !isLive && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-500">Ready to Go Live!</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your bot has met all evaluation requirements and is ready to be published to the
                        marketplace.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bot Information</CardTitle>
                {!isEditingDetails && (
                  <Button
                    variant="outline"
                    onClick={handleEditDetails}
                    data-testid="button-edit-details"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingDetails ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Bot Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      data-testid="input-edit-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                      data-testid="input-edit-description"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price">Monthly Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        data-testid="input-edit-price"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                      >
                        <SelectTrigger data-testid="select-edit-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scalping">Scalping</SelectItem>
                          <SelectItem value="day_trading">Day Trading</SelectItem>
                          <SelectItem value="swing_trading">Swing Trading</SelectItem>
                          <SelectItem value="trend_following">Trend Following</SelectItem>
                          <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                          <SelectItem value="arbitrage">Arbitrage</SelectItem>
                          <SelectItem value="market_making">Market Making</SelectItem>
                          <SelectItem value="grid_trading">Grid Trading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingDetails(false)}
                      data-testid="button-cancel-edit"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveDetails}
                      disabled={updateBotMutation.isPending}
                      data-testid="button-save-details"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="text-lg font-medium" data-testid="text-display-name">{bot.name}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm" data-testid="text-display-description">{bot.description || "No description provided"}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Price</Label>
                      <p className="text-lg font-medium" data-testid="text-display-price">
                        ${((bot.price || 0) / 100).toFixed(2)}/month
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Category</Label>
                      <p className="text-lg font-medium" data-testid="text-display-category">
                        {bot.category ? categoryLabels[bot.category] || bot.category : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="text-sm">
                        {new Date(bot.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="text-sm capitalize">{bot.evaluationStatus?.replace("_", " ") || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Updates</CardTitle>
              <CardDescription>
                Share updates about your bot's performance, new features, or improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Updates feature coming soon</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll be able to post updates about your bot's performance and improvements
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

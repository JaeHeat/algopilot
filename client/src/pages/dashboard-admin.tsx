import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { Users, Bot, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardAdmin() {
  const pendingBots = [
    { id: "1", name: "AI Predictor Pro", creator: "NewDev123", submitted: "2 hours ago", status: "pending" },
    { id: "2", name: "Whale Tracker", creator: "CryptoWhale", submitted: "5 hours ago", status: "pending" },
    { id: "3", name: "Volume Scanner", creator: "TradeBot", submitted: "1 day ago", status: "pending" },
  ];
  
  const recentUsers = [
    { id: "1", username: "trader_pro", email: "trader@example.com", joined: "2 days ago", subscriptions: 3 },
    { id: "2", username: "crypto_king", email: "king@example.com", joined: "3 days ago", subscriptions: 1 },
    { id: "3", username: "algo_master", email: "algo@example.com", joined: "5 days ago", subscriptions: 5 },
  ];
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Platform management and oversight</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value="12,453"
          change="+234 this week"
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Active Bots"
          value="87"
          change="3 pending approval"
          icon={Bot}
        />
        <MetricCard
          title="Platform Revenue"
          value="$45,231"
          change="+18% this month"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Pending Reviews"
          value="3"
          icon={AlertCircle}
        />
      </div>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Pending Bot Approvals</h2>
          <Badge variant="secondary">{pendingBots.length} pending</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bot Name</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingBots.map((bot) => (
              <TableRow key={bot.id} data-testid={`row-pending-bot-${bot.id}`}>
                <TableCell className="font-medium">{bot.name}</TableCell>
                <TableCell className="text-muted-foreground">{bot.creator}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{bot.submitted}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Pending</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="default" data-testid={`button-approve-${bot.id}`}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" data-testid={`button-reject-${bot.id}`}>
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Users</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Subscriptions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentUsers.map((user) => (
              <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.joined}</TableCell>
                <TableCell className="text-right tabular-nums">{user.subscriptions}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" data-testid={`button-view-user-${user.id}`}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

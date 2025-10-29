import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
}

export function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-3xl font-bold tabular-nums">{value}</div>
          {change && (
            <div className={`text-sm font-medium ${
              trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted-foreground"
            }`}>
              {change}
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}

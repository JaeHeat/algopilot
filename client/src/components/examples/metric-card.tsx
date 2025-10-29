import { MetricCard } from "../metric-card";
import { DollarSign } from "lucide-react";

export default function MetricCardExample() {
  return (
    <div className="p-6">
      <MetricCard
        title="Total Value"
        value="$45,231"
        change="+12.5% from last month"
        icon={DollarSign}
        trend="up"
      />
    </div>
  );
}

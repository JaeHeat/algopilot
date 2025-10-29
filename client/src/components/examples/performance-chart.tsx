import { PerformanceChart } from "../performance-chart";

export default function PerformanceChartExample() {
  const mockData = [10000, 10500, 10200, 11000, 11500, 11200, 12000, 12800, 12500, 13200, 13800, 14500];
  const mockLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return (
    <div className="p-6">
      <PerformanceChart
        title="Equity Curve"
        data={mockData}
        labels={mockLabels}
      />
    </div>
  );
}

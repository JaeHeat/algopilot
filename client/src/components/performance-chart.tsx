import { Card } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  title: string;
  data: number[];
  labels: string[];
  height?: number;
  showCard?: boolean;
}

export function PerformanceChart({ title, data, labels, height = 300, showCard = true }: PerformanceChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: "Equity",
        data,
        borderColor: "hsl(217 91% 52%)",
        backgroundColor: "hsl(217 91% 52% / 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "hsl(222 18% 9%)",
        titleColor: "hsl(0 0% 95%)",
        bodyColor: "hsl(0 0% 95%)",
        borderColor: "hsl(222 12% 18%)",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(222 12% 18% / 0.5)",
          drawBorder: false,
        },
        ticks: {
          color: "hsl(220 8% 65%)",
        },
      },
      y: {
        grid: {
          color: "hsl(222 12% 18% / 0.5)",
          drawBorder: false,
        },
        ticks: {
          color: "hsl(220 8% 65%)",
          callback: function(value: any) {
            return "$" + value.toLocaleString();
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  const chartContent = (
    <>
      {title && <h3 className="font-semibold mb-6">{title}</h3>}
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    </>
  );

  if (!showCard) {
    return chartContent;
  }

  return (
    <Card className="p-6">
      {chartContent}
    </Card>
  );
}

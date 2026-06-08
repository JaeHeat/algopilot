interface EquitySparklineProps {
  data: number[];
  className?: string;
  height?: number;
}

/**
 * Lightweight SVG equity-curve sparkline — no chart library, so it's cheap to render many at once.
 * Green when the curve ends up, red when it ends down. Stretches to its container width.
 */
export function EquitySparkline({ data, className, height = 56 }: EquitySparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div className={`flex items-center justify-center text-xs text-muted-foreground ${className ?? ""}`} style={{ height }}>
        No track record yet
      </div>
    );
  }

  const width = 300; // viewBox units; scales to container via preserveAspectRatio
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const up = data[data.length - 1] >= data[0];
  const color = up ? "rgb(16 185 129)" : "rgb(239 68 68)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className ?? ""}`}
      style={{ height }}
      aria-hidden="true"
    >
      <path d={area} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface DonutChartProps {
  pct: number;
  color: string;
}

export default function DonutChart({ pct, color }: DonutChartProps) {
  const r = 54, cx = 64, cy = 64;
  const circ  = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);

  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#6B7A9E" fontSize="10">
        Overall progress
      </text>
    </svg>
  );
}
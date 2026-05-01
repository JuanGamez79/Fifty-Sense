import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type DashboardCardProps = {
  title: string;
  total: number;
  income: number;
  expenses: number;
  labels: string[];
  dataPoints: number[];
};

export default function DashboardCard({
  title,
  total,
  income,
  expenses,
  labels,
  dataPoints,
}: DashboardCardProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Spending",
        data: dataPoints,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.total}>${total.toLocaleString()}</div>
      </div>
      <div style={styles.stats}>
        <span style={{ ...styles.badge, backgroundColor: "#10b981" }}>Income: ${income.toLocaleString()}</span>
        <span style={{ ...styles.badge, backgroundColor: "#ef4444" }}>Expenses: ${expenses.toLocaleString()}</span>
      </div>
      <div style={styles.chart}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#1f2937",
    color: "white",
    borderRadius: "12px",
    padding: "20px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  title: { fontSize: "1rem", opacity: 0.8 },
  total: { fontSize: "1.5rem", fontWeight: "bold" },
  stats: { display: "flex", gap: "10px", marginBottom: "15px" },
  badge: { padding: "5px 10px", borderRadius: "6px", fontSize: "0.8rem" },
  chart: { height: "150px" },
};
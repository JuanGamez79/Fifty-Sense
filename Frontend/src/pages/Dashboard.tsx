import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useAuth } from "../api/useAuth";
import { apiRequest } from "../api/axios";
import "../style/Dashboard.css";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Filler
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Account {
  account_id: string;
  account_name: string;
  balance: number;
}

interface Transaction {
  transaction_id: string;
  account_id: string;
  description?: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category_id?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const fmtShort = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

// ── FIX 1: Build monthly net balance (income - expenses) not just expenses ────
function buildMonthlyBalance(txs: Transaction[], accounts: Account[]) {
  const now = new Date();
  const labels: string[] = [];
  const data: number[] = [];

  // Start from total current balance and work backwards
  const currentBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  // Build month-by-month net changes
  const monthChanges: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(target.toLocaleString("default", { month: "short" }));
    const net = txs
      .filter((t) => {
        const d = new Date(t.date);
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth()
        );
      })
      .reduce((s, t) => {
        return t.type === "income" ? s + Number(t.amount) : s - Number(t.amount);
      }, 0);
    monthChanges.push(net);
  }

  // Reconstruct running balance going backwards from current
  let balance = currentBalance;
  const balances = new Array(6).fill(0);
  balances[5] = balance;
  for (let i = 4; i >= 0; i--) {
    balance -= monthChanges[i + 1];
    balances[i] = balance;
  }

  return { labels, data: balances };
}

// ── FIX 2: Build weekly chart showing BOTH income and expenses ────────────────
function buildWeeklyAmounts(txs: Transaction[]) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const income  = new Array(7).fill(0);
  const expense = new Array(7).fill(0);
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  txs.forEach((t) => {
    const d = new Date(t.date);
    if (d >= monday) {
      const idx = (d.getDay() + 6) % 7;
      if (t.type === "income")  income[idx]  += Number(t.amount);
      if (t.type === "expense") expense[idx] += Number(t.amount);
    }
  });

  return { DAYS, income, expense };
}

function generateInsight(txs: Transaction[], totalBalance: number): string {
  const now = new Date();
  const msPerDay = 86_400_000;
  const thisWeek = txs
    .filter((t) => t.type === "expense" && (now.getTime() - new Date(t.date).getTime()) / msPerDay <= 7)
    .reduce((s, t) => s + Number(t.amount), 0);
  const lastWeek = txs
    .filter((t) => {
      const age = (now.getTime() - new Date(t.date).getTime()) / msPerDay;
      return t.type === "expense" && age > 7 && age <= 14;
    })
    .reduce((s, t) => s + Number(t.amount), 0);

  if (totalBalance > 0 && txs.length === 0)
    return `You have ${fmt(totalBalance)} across your accounts. Add transactions to track spending!`;
  if (lastWeek > 0) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    if (pct > 0) return `You're spending ${pct}% more than last week.`;
    if (pct < 0) return `Great job! Spending is down ${Math.abs(pct)}% vs last week.`;
    return "Your spending is on par with last week.";
  }
  if (thisWeek > 0) return `You've spent ${fmt(thisWeek)} so far this week.`;
  return "Add transactions to start tracking your spending!";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const userId = (user as any)?.user_id;
    if (!userId) { setError("User not authenticated."); setLoading(false); return; }

    setLoading(true);
    setError(null);
    try {
      let accs: Account[] = [];
      try {
        const raw = await apiRequest<any>(`/api/accounts/user/${userId}`, { token });
        accs = unwrapArray<Account>(raw);
      } catch { accs = []; }
      setAccounts(accs);

      if (accs.length === 0) { setTransactions([]); return; }

      const txBatches = await Promise.all(
        accs.map(async (acc) => {
          try {
            const raw = await apiRequest<any>(`/api/transactions/account/${acc.account_id}`, { token });
            return unwrapArray<Transaction>(raw);
          } catch { return [] as Transaction[]; }
        })
      );

      const merged = Object.values(
        txBatches.flat().reduce<Record<string, Transaction>>((map, t) => {
          map[t.transaction_id] = t;
          return map;
        }, {})
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(merged);
    } catch (err: any) {
      setError(err?.message ?? "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived numbers ───────────────────────────────────────────────────────
  const totalBalance  = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalIncome   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const changePct     = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const isUp          = changePct >= 0;

  const { labels: monthLabels, data: monthlyData } = buildMonthlyBalance(transactions, accounts);
  const { DAYS, income: weekIncome, expense: weekExpense } = buildWeeklyAmounts(transactions);
  const recentFive = transactions.slice(0, 5);
  const aiInsight  = generateInsight(transactions, totalBalance);

  const hasAccounts     = accounts.length > 0;
  const hasTransactions = transactions.length > 0;

  // ── FIX 1: Overview chart shows running balance ───────────────────────────
  const overviewLine = {
    labels: monthLabels,
    datasets: [{
      data: monthlyData,
      borderColor: "#00E676",
      borderWidth: 2,
      fill: true,
      backgroundColor: "rgba(0,230,118,0.07)",
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: "#00E676",
    }],
  };

  const overviewLineOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a2550", titleColor: "#aab4d4", bodyColor: "#fff",
        callbacks: { label: (ctx: any) => ` ${fmt(ctx.raw)}` },
      },
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#5a6a9a", font: { size: 10 } } },
      y: { display: false },
    },
  };

  // ── FIX 2: Weekly chart shows income + expenses, always renders ───────────
  const maxWeekExpense = Math.max(...weekExpense, 1);
  const spendingBar = {
    labels: DAYS,
    datasets: [
      {
        type: "bar" as const,
        label: "Income",
        data: weekIncome,
        backgroundColor: "#00E67644",
        borderColor: "#00E676",
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 12,
      },
      {
        type: "bar" as const,
        label: "Expenses",
        data: weekExpense,
        backgroundColor: weekExpense.map((v) =>
          v === maxWeekExpense && v > 0 ? "#FF4D6D" : "#1e2d6e"
        ),
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 12,
      },
      {
        type: "line" as const,
        label: "Trend",
        data: weekExpense,
        borderColor: "#00E676",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#00E676",
      },
    ],
  };

  const spendingBarOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a2550", titleColor: "#aab4d4", bodyColor: "#fff",
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmt(ctx.raw)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#5a6a9a", font: { size: 11 } } },
      y: { display: false },
    },
  };

  // ── Weekly amounts row — show income or expense whichever is nonzero ──────
  const weekDisplayAmounts = DAYS.map((_, i) =>
    weekIncome[i] > 0 || weekExpense[i] > 0
      ? fmtShort(weekIncome[i] - weekExpense[i])
      : "—"
  );

  if (loading) {
    return (
      <div className="fs-dashboard">
        <div className="fs-glow fs-glow--purple" />
        <div className="fs-loading"><div className="fs-spinner" /><p>Loading your finances…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fs-dashboard">
        <div className="fs-glow fs-glow--purple" />
        <div className="fs-error">
          <span className="fs-error-icon">⚠</span>
          <p className="fs-error-title">Something went wrong</p>
          <p className="fs-error-msg">{error}</p>
          <button className="fs-btn-outline" onClick={fetchAll}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fs-dashboard">
      <div className="fs-glow fs-glow--purple" />
      <div className="fs-glow fs-glow--blue" />

      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <div className="fs-top-row">

        {/* Overview card */}
        <div className="fs-card fs-overview">
          <div className="fs-overview__left">
            <span className="fs-label">Overview</span>
            <h1 className="fs-balance">{fmt(totalBalance)}</h1>

            <div className={`fs-badge ${isUp ? "fs-badge--green" : "fs-badge--red"}`}>
              {isUp
                ? <svg width="9" height="9" viewBox="0 0 10 10"><polygon points="5,1 9,9 1,9" fill="#00E676"/></svg>
                : <svg width="9" height="9" viewBox="0 0 10 10"><polygon points="5,9 9,1 1,1" fill="#FF4D6D"/></svg>
              }
              {Math.abs(changePct).toFixed(1)}%
            </div>

            <div className="fs-pill-row">
              <div className="fs-pill fs-pill--green">
                <span className="fs-pill-label">Income</span>
                <span className="fs-pill-val">{fmtShort(totalIncome)}</span>
              </div>
              <div className="fs-pill fs-pill--red">
                <span className="fs-pill-label">Expenses</span>
                <span className="fs-pill-val">{fmtShort(totalExpenses)}</span>
              </div>
            </div>

            {hasAccounts && (
              <div className="fs-accs-mini">
                {accounts.map((a) => (
                  <div className="fs-acc-mini-row" key={a.account_id}>
                    <span className="fs-acc-mini-name">{a.account_name}</span>
                    <span className="fs-acc-mini-bal">{fmt(a.balance)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FIX 1: Chart shows once accounts exist, reflects real balance */}
          <div className="fs-overview__chart">
            {hasAccounts
              ? <Line data={overviewLine} options={overviewLineOpts} />
              : (
                <div className="fs-empty-chart">
                  <span>📊</span>
                  <p>Chart appears after<br/>you add an account</p>
                </div>
              )
            }
          </div>
        </div>

        {/* AI Insight */}
        <div className="fs-card fs-ai-insight">
          <div className="fs-ai-insight__header">
            <span className="fs-label">AI Insight</span>
            <span className="fs-ai-spark">✦</span>
          </div>
          <blockquote className="fs-ai-quote">"{aiInsight}"</blockquote>
          <button className="fs-btn-outline">View tips →</button>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────────── */}
      <div className="fs-bottom-row">

        {/* Spending trends — FIX 2: always renders chart, shows income too */}
        <div className="fs-card fs-trends">
          <span className="fs-label">Activity — this week</span>
          <div className="fs-trends__amounts">
            {weekDisplayAmounts.map((v, i) => (
              <span key={i} className="fs-trends__amt">{v}</span>
            ))}
          </div>
          <div className="fs-trends__chart">
            <Bar data={spendingBar as any} options={spendingBarOpts} />
          </div>
        </div>

        {/* Right column */}
        <div className="fs-right-col">

          {/* Accounts */}
          <div className="fs-card fs-accounts-card">
            <span className="fs-label">Accounts</span>
            {!hasAccounts
              ? (
                <div className="fs-empty-state">
                  <span>🏦</span>
                  <p>No accounts yet</p>
                  <button className="fs-btn-outline" onClick={() => navigate("/accounts")}>
                    + Add Account
                  </button>
                </div>
              )
              : accounts.map((a) => (
                <div className="fs-account-row" key={a.account_id}>
                  <div className="fs-account-icon">{a.account_name.charAt(0).toUpperCase()}</div>
                  <div className="fs-account-info">
                    <span className="fs-account-name">{a.account_name}</span>
                    <span className="fs-account-id">···{a.account_id.slice(-4)}</span>
                  </div>
                  <span className="fs-account-bal">{fmt(a.balance)}</span>
                </div>
              ))
            }
          </div>

          {/* Recent transactions */}
          <div className="fs-card fs-recent">
            <div className="fs-recent__header">
              <span className="fs-label" style={{ margin: 0 }}>Recent transactions</span>
              {hasTransactions && <span className="fs-tx-count">{transactions.length} total</span>}
            </div>

            {!hasTransactions
              ? (
                <div className="fs-empty-state">
                  <span>📝</span>
                  <p>No transactions yet</p>
                  {!hasAccounts && <p className="fs-empty-sub">Create an account first</p>}
                </div>
              )
              : recentFive.map((t) => (
                <div className="fs-tx-row" key={t.transaction_id}>
                  <div className="fs-tx-icon" data-type={t.type}>
                    {t.type === "income" ? "↑" : "↓"}
                  </div>
                  <div className="fs-tx-meta">
                    <span className="fs-tx-desc">
                      {t.description || (t.type === "income" ? "Income" : "Expense")}
                    </span>
                    <span className="fs-tx-date">
                      {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <span className={`fs-tx-amt ${t.type === "income" ? "fs-green" : "fs-red"}`}>
                    {t.type === "income" ? "+" : "−"}{fmt(Number(t.amount))}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
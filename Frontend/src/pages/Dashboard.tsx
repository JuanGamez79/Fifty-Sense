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

const OLLAMA_MODEL = "hf.co/QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M";
const OLLAMA_URL   = "http://192.168.1.18:11434/api/chat";

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

interface Category {
  _id: string;
  category_name: string;
  icon?: string;
}

interface Budget {
  _id: string;
  budget_id: string;
  user_id: string;
  category_name: string;
  limit_amount: number;
  period: "monthly" | "weekly" | "yearly";
}

interface BudgetWithSpent extends Budget {
  spent: number;
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

function getCategoryIcons(): Record<string, string> {
  try {
    const s = localStorage.getItem("categoryIcons");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function buildMonthlyBalance(txs: Transaction[], accounts: Account[]) {
  const now = new Date();
  const labels: string[] = [];
  const currentBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const monthChanges: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(target.toLocaleString("default", { month: "short" }));
    const net = txs
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
      })
      .reduce((s, t) => t.type === "income" ? s + Number(t.amount) : s - Number(t.amount), 0);
    monthChanges.push(net);
  }

  let balance = currentBalance;
  const balances = new Array(6).fill(0);
  balances[5] = balance;
  for (let i = 4; i >= 0; i--) {
    balance -= monthChanges[i + 1];
    balances[i] = balance;
  }

  return { labels, data: balances };
}

function buildWeeklyAmounts(txs: Transaction[]) {
  const DAYS: string[] = [];
  const income  = new Array(7).fill(0);
  const expense = new Array(7).fill(0);
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day   = String(date.getDate()).padStart(2, "0");
    DAYS.push(`${month}/${day}`);
  }

  const dateMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    dateMap[date.toDateString()] = i;
  }

  txs.forEach((t) => {
    const d   = new Date(t.date);
    const idx = dateMap[d.toDateString()];
    if (idx !== undefined) {
      if (t.type === "income")  income[idx]  += Number(t.amount);
      if (t.type === "expense") expense[idx] += Number(t.amount);
    }
  });

  return { DAYS, income, expense };
}

// Fallback static insight (used when Ollama is unreachable)
function generateStaticInsight(txs: Transaction[], totalBalance: number): string {
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

  const [accounts,     setAccounts]     = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets,      setBudgets]      = useState<BudgetWithSpent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [aiInsight,    setAiInsight]    = useState<string>("Analysing your finances…");
  const [aiLoading,    setAiLoading]    = useState(false);

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

      let cats: Category[] = [];
      try {
        const raw = await apiRequest<any>(`/api/categories/${userId}`, { token });
        cats = unwrapArray<Category>(raw);
        const icons = getCategoryIcons();
        cats = cats.map(c => ({ ...c, icon: icons[c.category_name] || c.icon || "💳" }));
      } catch { cats = []; }

      let allTx: Transaction[] = [];
      if (accs.length > 0) {
        const txBatches = await Promise.all(
          accs.map(async (acc) => {
            try {
              const raw = await apiRequest<any>(`/api/transactions/account/${acc.account_id}`, { token });
              return unwrapArray<Transaction>(raw);
            } catch { return [] as Transaction[]; }
          })
        );
        allTx = Object.values(
          txBatches.flat().reduce<Record<string, Transaction>>((map, t) => {
            map[t.transaction_id] = t;
            return map;
          }, {})
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      setTransactions(allTx);

      try {
        const budRaw = await apiRequest<any>(`/api/budgets/user/${userId}`, { token });
        const raw = unwrapArray<Budget>(budRaw);
        const now = new Date();
        const spentMap: Record<string, number> = {};
        for (const tx of allTx) {
          if (tx.type !== "expense") continue;
          const d = new Date(tx.date);
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
          const cat = cats.find(c => c._id === tx.category_id)
                   ?? cats.find(c => c.category_name === tx.category_id);
          if (cat) spentMap[cat.category_name] = (spentMap[cat.category_name] || 0) + Number(tx.amount);
        }
        setBudgets(raw.map(b => ({ ...b, spent: spentMap[b.category_name] || 0 })));
      } catch { setBudgets([]); }

    } catch (err: any) {
      setError(err?.message ?? "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── AI insight: fires after data loads ────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const totalIncome   = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance       = accounts.reduce((s, a) => s + Number(a.balance), 0);
    const net           = totalIncome - totalExpenses;
    const f             = (n: number) => `$${Math.abs(n).toFixed(2)}`;

    if (!transactions.length && !accounts.length) {
      setAiInsight("Add transactions to start tracking your spending!");
      return;
    }

    setAiLoading(true);
    fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You are Fifty, a concise financial assistant. Write exactly ONE sentence (max 20 words) summarising the user's current financial health. No markdown, no lists, no extra commentary. Just the sentence.",
          },
          {
            role: "user",
            content: `Income: ${f(totalIncome)}, Expenses: ${f(totalExpenses)}, Net: ${net >= 0 ? "+" : ""}${f(net)}, Balance: ${f(balance)}.`,
          },
        ],
      }),
    })
      .then(r => r.json())
      .then(j => {
        const text = j?.message?.content?.trim();
        setAiInsight(text || generateStaticInsight(transactions, balance));
      })
      .catch(() => {
        setAiInsight(generateStaticInsight(transactions, totalBalance));
      })
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Derived numbers ───────────────────────────────────────────────────────
  const totalBalance  = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalIncome   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const changePct     = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const isUp          = changePct >= 0;

  const { labels: monthLabels, data: monthlyData } = buildMonthlyBalance(transactions, accounts);
  const { DAYS, income: weekIncome, expense: weekExpense } = buildWeeklyAmounts(transactions);
  const recentFive = transactions.slice(0, 5);

  const hasAccounts     = accounts.length > 0;
  const hasTransactions = transactions.length > 0;

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
          v === maxWeekExpense && v > 0 ? "#FF4D6D" : "#FF4D6D"
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
        <h1 className="page-title">Dashboard</h1>
      <div className="fs-glow fs-glow--purple" />
      <div className="fs-glow fs-glow--blue" />
      
      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <div className="fs-top-row">
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

        <div className="fs-card fs-ai-insight">
          <div className="fs-ai-insight__header">
            <span className="fs-label">AI Insight</span>
            <span className={`fs-ai-spark ${aiLoading ? "fs-ai-spark--pulse" : ""}`}>✦</span>
          </div>
          <blockquote className="fs-ai-quote">
            {aiLoading ? (
              <span className="fs-ai-loading-dots">
                <span /><span /><span />
              </span>
            ) : (
              `"${aiInsight}"`
            )}
          </blockquote>
          <button className="fs-btn-outline" onClick={() => navigate("/ai")}>
            View insights →
          </button>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────────── */}
      <div className="fs-bottom-row">

        <div className="fs-card fs-trends">
          <span className="fs-label">Activity — last 7 days</span>
          <div className="fs-trends__amounts">
            {weekDisplayAmounts.map((v, i) => (
              <span key={i} className="fs-trends__amt">{v}</span>
            ))}
          </div>
          <div className="fs-trends__chart">
            <Bar data={spendingBar as any} options={spendingBarOpts} />
          </div>
        </div>

        <div className="fs-right-col">

          {/* Budgets card */}
          <div className="fs-card fs-budgets-card">
            <div className="fs-budgets-card__header">
              <span className="fs-label" style={{ margin: 0 }}>Budgets</span>
              <button className="fs-btn-outline fs-btn-outline--sm" onClick={() => navigate("/budgets")}>
                View all →
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="fs-empty-state">
                <span>📊</span>
                <p>No budgets yet</p>
                <button className="fs-btn-outline" onClick={() => navigate("/budgets")}>
                  + Create Budget
                </button>
              </div>
            ) : (
              <div className="fs-budget-list">
                {budgets.slice(0, 4).map(b => {
                  const pct  = Math.min((b.spent / b.limit_amount) * 100, 100);
                  const over = b.spent > b.limit_amount;
                  return (
                    <div key={b.budget_id} className="fs-budget-row">
                      <div className="fs-budget-row__top">
                        <span className="fs-budget-name">{b.category_name}</span>
                        <span className="fs-budget-amt" style={{ color: over ? "#FF4D6D" : "#6B7A9E" }}>
                          ${b.spent.toFixed(0)} / ${b.limit_amount.toFixed(0)}
                        </span>
                      </div>
                      <div className="fs-budget-track">
                        <div
                          className="fs-budget-fill"
                          style={{
                            width: `${pct}%`,
                            background: over
                              ? "linear-gradient(90deg,#EF4444,#F87171)"
                              : "linear-gradient(90deg,#00E676,#10B981)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
import { useState, useRef, useEffect, useCallback } from "react";
import "../style/AIInsights.css";

const OLLAMA_MODEL = "hf.co/QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M";
const OLLAMA_URL   = "https://ollama.unearned.duckdns.org/api/chat";
const API_BASE     = "https://backend.unearned.duckdns.org/api";


interface Insight {
  id: string; icon: string; iconBg: string; title: string;
  body: string; category: string; amount: string;
  changePct: number; changeLabel: string;
  sentiment: "positive" | "warning" | "negative" | "neutral";
  summaryCategory: "positive" | "watchout" | "opportunity";
}
interface SummaryItem { label: string; count: number; delta: number; color: string; icon: string; }
interface FeaturedCard {
  icon: string; title: string; sub: string; category: string;
  amount: string; changePct: number; changeLabel: string; up: boolean;
}
interface PageState { featured: FeaturedCard; insights: Insight[]; summary: SummaryItem[]; tips: string[]; }
interface UserData  { accounts: any[]; transactions: any[]; budgets: any[]; goals: any[]; categories: any[]; }
type ChatMessage = { role: "user" | "ai"; text: string; displayText: string; timestamp: Date };

const DEFAULT_STATE: PageState = {
  featured: {
    icon: "✦", title: "Analysing your finances...",
    sub: "Fifty is reviewing your transactions, budgets, and goals.",
    category: "Loading", amount: "—", changePct: 0, changeLabel: "", up: true,
  },
  insights: [],
  summary: [
    { label: "Positive insights", count: 0, delta: 0, color: "#10B981", icon: "↑" },
    { label: "Watch out",         count: 0, delta: 0, color: "#F59E0B", icon: "!" },
    { label: "Opportunities",     count: 0, delta: 0, color: "#A855F7", icon: "◎" },
  ],
  tips: [
    "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
    "Wait 48 hours before any non-essential purchase.",
    "Find one small recurring cut in each of your top spending categories.",
    "Treat savings like a fixed bill — pay yourself first every month.",
  ],
};

function getToken(): string { return localStorage.getItem("token") ?? ""; }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

async function apiFetch(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) { console.warn(`[Fifty] ${url} → ${res.status}`); return []; }
    const json = await res.json();
    if (json && Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object") {
      const first = Object.values(json).find(v => Array.isArray(v));
      if (first) return first as any[];
    }
    return [];
  } catch (e) { console.error(`[Fifty] apiFetch error ${url}`, e); return []; }
}

async function fetchUserData(userId: string): Promise<UserData> {
  const [accounts, budgets, goals, categories] = await Promise.all([
    apiFetch(`${API_BASE}/accounts/user/${userId}`),
    apiFetch(`${API_BASE}/budgets/user/${userId}`),
    apiFetch(`${API_BASE}/goals/user/${userId}`),
    apiFetch(`${API_BASE}/categories/${userId}`),
  ]);
  const txArrays = await Promise.all(
    accounts.map((acc: any) => {
      const id = acc.account_id ?? acc._id;
      return apiFetch(`${API_BASE}/transactions/account/${id}`);
    })
  );
  const transactions = txArrays.flat();
  return { accounts, transactions, budgets, goals, categories };
}

function computeSummary(ud: UserData) {
  const incomeTxs  = ud.transactions.filter((t: any) => t.type === "income");
  const expenseTxs = ud.transactions.filter((t: any) => t.type === "expense");
  const totalIncome   = incomeTxs.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpenses = expenseTxs.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalBalance  = ud.accounts.reduce((s: number, a: any) => s + Number(a.balance), 0);

  const catById: Record<string, string> = {};
  ud.categories.forEach((c: any) => {
    const id = c.category_id ?? c._id ?? c.id;
    if (id) catById[String(id)] = c.name ?? c.category_name ?? String(id);
  });

  const byCat: Record<string, { categoryName: string; total: number; subTotals: Record<string, number> }> = {};
  expenseTxs.forEach((t: any) => {
    const catId        = String(t.category_id ?? t.category ?? "");
    const categoryName = catById[catId] || t.category_name || "Other";
    const txDesc       = (t.description || "").trim();
    const key          = catId || categoryName;
    if (!byCat[key]) byCat[key] = { categoryName, total: 0, subTotals: {} };
    byCat[key].total += Number(t.amount);
    if (txDesc && txDesc.toLowerCase() !== categoryName.toLowerCase()) {
      byCat[key].subTotals[txDesc] = (byCat[key].subTotals[txDesc] || 0) + Number(t.amount);
    }
  });
  const topExpenses = Object.values(byCat)
    .sort((a, b) => b.total - a.total).slice(0, 5)
    .map(({ categoryName, total, subTotals }) => {
      const topSub = Object.entries(subTotals).sort((a, b) => b[1] - a[1])[0];
      const desc = topSub && topSub[1] / total >= 0.4
        ? `${categoryName} – ${topSub[0]}`
        : categoryName;
      return { desc, categoryName, total: +total.toFixed(2), topSubDesc: topSub?.[0] ?? null, topSubTotal: topSub ? +topSub[1].toFixed(2) : 0 };
    });

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  const budgetHealth = ud.budgets.map((b: any) => {
    const budgetCatId = String(b.category_id ?? b.category ?? "");
    const budgetName  = (b.category_name || "").toLowerCase();
    const spent = expenseTxs
      .filter((t: any) => {
        const tCatId = String(t.category_id ?? t.category ?? "");
        if (budgetCatId && tCatId && budgetCatId === tCatId) return true;
        const tLabel = (catById[tCatId] || t.category_name || t.description || "").toLowerCase();
        return budgetName && tLabel.includes(budgetName);
      })
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    const limit = Number(b.limit_amount);
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return { category: b.category_name, limit, spent: +spent.toFixed(2), pct, over: spent > limit, remaining: +(limit - spent).toFixed(2) };
  });
  const overBudget = budgetHealth.filter(b => b.over).sort((a, b) => b.pct - a.pct);
  const nearBudget = budgetHealth.filter(b => !b.over && b.pct >= 70).sort((a, b) => b.pct - a.pct);

  const largestExpense = expenseTxs.length > 0
    ? expenseTxs.reduce((max: any, t: any) => Number(t.amount) > Number(max.amount) ? t : max, expenseTxs[0])
    : null;

  const goals = ud.goals.map((g: any) => {
    const target  = +g.target_amount;
    const current = +g.current_amount;
    const pct     = target > 0 ? Math.round((current / target) * 100) : 0;
    const remaining = +(target - current).toFixed(2);
    let monthlyNeeded: number | null = null;
    if (g.deadline && remaining > 0) {
      const months = Math.max(1, Math.round((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
      monthlyNeeded = +(remaining / months).toFixed(2);
    }
    return { name: g.goal_name, target, current, pct, remaining, monthlyNeeded };
  });

  return {
    totalIncome:   +totalIncome.toFixed(2),
    totalExpenses: +totalExpenses.toFixed(2),
    totalBalance:  +totalBalance.toFixed(2),
    net:           +(totalIncome - totalExpenses).toFixed(2),
    savingsRate,
    topExpenses,
    budgetHealth,
    overBudget,
    nearBudget,
    largestExpense,
    goals,
    incomeCount:  incomeTxs.length,
    expenseCount: expenseTxs.length,
  };
}

function buildDashboardUpdate(c: ReturnType<typeof computeSummary>): PageState {
  const d     = (n: number) => `$${Math.abs(n).toFixed(2)}`;
  const goal0 = c.goals[0];
  const top   = c.topExpenses[0];
  const top2  = c.topExpenses[1];

  const spendPct = c.totalIncome > 0 ? Math.round((c.totalExpenses / c.totalIncome) * 100) : 100;

  const spendingInsight: Insight = (() => {
    if (c.net < 0) return {
      id: "overspend", icon: "🚨", iconBg: "rgba(239,68,68,0.18)",
      title: "You're spending more than you earn",
      body: `Expenses exceed income by ${d(Math.abs(c.net))} (${spendPct}% of income spent). Your biggest outgoing is "${top?.desc ?? "unknown"}" at ${d(top?.total ?? 0)} — start cutting there.`,
      category: "Spending", amount: `-${d(Math.abs(c.net))}`,
      changePct: spendPct, changeLabel: "of income spent",
      sentiment: "negative", summaryCategory: "watchout",
    };
    if (spendPct > 80) return {
      id: "high-spend", icon: "⚠️", iconBg: "rgba(245,158,11,0.18)",
      title: `${spendPct}% of income is going to expenses`,
      body: `You're spending ${d(c.totalExpenses)} of ${d(c.totalIncome)} earned. Only ${d(c.net)} left — consider trimming "${top?.desc ?? "your biggest category"}" first.`,
      category: "Spending", amount: `${spendPct}%`,
      changePct: spendPct, changeLabel: "of income spent",
      sentiment: "warning", summaryCategory: "watchout",
    };
    return {
      id: "spend-ok", icon: "✅", iconBg: "rgba(16,185,129,0.18)",
      title: `Healthy spend rate: ${spendPct}% of income`,
      body: `You're keeping ${d(c.net)} (${c.savingsRate}%) of your ${d(c.totalIncome)} income. Keep it up — even small increases to savings add up fast.`,
      category: "Spending", amount: `${c.savingsRate}%`,
      changePct: c.savingsRate, changeLabel: "saved",
      sentiment: "positive", summaryCategory: "positive",
    };
  })();

  const topSpendInsight: Insight = top ? (() => {
    const pctOfTotal = c.totalExpenses > 0 ? Math.round((top.total / c.totalExpenses) * 100) : 0;
    const topTitle   = top.desc;
    const subNote    = top.topSubDesc && top.topSubDesc !== top.categoryName
      ? ` The biggest driver within ${top.categoryName} is "${top.topSubDesc}" at ${d(top.topSubTotal)}.`
      : "";
    const body = top2
      ? `"${topTitle}" is ${d(top.total)} (${pctOfTotal}% of all spending).${subNote} Next is "${top2.desc}" at ${d(top2.total)}.`
      : `"${topTitle}" is your largest expense at ${d(top.total)} — ${pctOfTotal}% of all spending.${subNote}`;
    return {
      id: "top-spend", icon: "💸", iconBg: "rgba(239,68,68,0.18)",
      title: `Biggest expense: ${topTitle}`, body,
      category: top.categoryName, amount: d(top.total),
      changePct: pctOfTotal, changeLabel: "of total spend",
      sentiment: "warning" as const, summaryCategory: "watchout" as const,
    };
  })() : {
    id: "top-spend", icon: "💸", iconBg: "rgba(239,68,68,0.18)",
    title: "No expense transactions yet",
    body: "Start logging expenses to see a breakdown of where your money goes.",
    category: "Top Spend", amount: "$0.00",
    changePct: 0, changeLabel: "recorded",
    sentiment: "neutral", summaryCategory: "watchout",
  };

  const goalInsight: Insight = goal0 ? (() => {
    const urgent = goal0.monthlyNeeded !== null && c.net < goal0.monthlyNeeded;
    return {
      id: "goal", icon: "🎯", iconBg: "rgba(168,85,247,0.18)",
      title: `${goal0.name}: ${goal0.pct}% saved`,
      body: goal0.monthlyNeeded
        ? urgent
          ? `You need ${d(goal0.monthlyNeeded)}/month for ${goal0.name} but only saving ${d(Math.max(0, c.net))} — close the gap by reducing "${top?.desc ?? "expenses"}".`
          : `Save ${d(goal0.monthlyNeeded)}/month to hit your ${goal0.name} goal on time. You've got ${d(goal0.current)} of ${d(goal0.target)} — ${d(goal0.remaining)} to go.`
        : `You've saved ${d(goal0.current)} toward ${goal0.name}. ${d(goal0.remaining)} remaining — consistent monthly transfers will get you there.`,
      category: "Goals", amount: d(goal0.current),
      changePct: goal0.pct, changeLabel: "of target",
      sentiment: goal0.pct >= 50 ? "positive" : urgent ? "warning" : "neutral",
      summaryCategory: "opportunity",
    };
  })() : {
    id: "goal", icon: "🎯", iconBg: "rgba(168,85,247,0.18)",
    title: "Set a savings goal",
    body: "No goals yet. Adding a goal with a target and deadline gives you a monthly savings number to aim for.",
    category: "Goals", amount: "$0.00",
    changePct: 0, changeLabel: "no goals set",
    sentiment: "neutral", summaryCategory: "opportunity",
  };

  const budgetInsight: Insight = (() => {
    if (c.overBudget.length > 0) {
      const ob = c.overBudget[0];
      return {
        id: "budget-over", icon: "🔴", iconBg: "rgba(239,68,68,0.18)",
        title: `Over budget: ${ob.category}`,
        body: `You've spent ${d(ob.spent)} against a ${d(ob.limit)} budget — ${ob.pct}% used and ${d(Math.abs(ob.remaining))} over limit. Pause spending here immediately.`,
        category: "Budget", amount: d(ob.spent),
        changePct: ob.pct, changeLabel: "of limit",
        sentiment: "negative", summaryCategory: "watchout",
      };
    }
    if (c.nearBudget.length > 0) {
      const nb = c.nearBudget[0];
      return {
        id: "budget-warn", icon: "🟡", iconBg: "rgba(245,158,11,0.18)",
        title: `Approaching limit: ${nb.category}`,
        body: `${nb.category} is at ${nb.pct}% of your ${d(nb.limit)} budget — only ${d(nb.remaining)} left. Slow down spending here before the period ends.`,
        category: "Budget", amount: d(nb.spent),
        changePct: nb.pct, changeLabel: "used",
        sentiment: "warning", summaryCategory: "watchout",
      };
    }
    const rateMsg = c.savingsRate >= 20
      ? `You're saving ${c.savingsRate}% of income — above the recommended 20%. Consider directing the surplus toward your ${goal0?.name ?? "savings goal"}.`
      : c.savingsRate > 0
      ? `You're saving ${c.savingsRate}% of income. Aim for 20% — that's ${d(c.totalIncome * 0.2)} per period based on your income.`
      : `You're currently saving 0% of income. Even setting aside 5% (${d(c.totalIncome * 0.05)}) each period builds a meaningful buffer.`;
    return {
      id: "savings-rate", icon: "🏦", iconBg: "rgba(59,130,246,0.18)",
      title: `Savings rate: ${Math.max(0, c.savingsRate)}%`,
      body: rateMsg,
      category: "Savings", amount: d(Math.max(0, c.net)),
      changePct: Math.max(0, c.savingsRate), changeLabel: "saved this period",
      sentiment: c.savingsRate >= 20 ? "positive" : c.savingsRate > 0 ? "warning" : "negative",
      summaryCategory: c.savingsRate >= 20 ? "positive" : "watchout",
    };
  })();

  const tips: string[] = [
    top
      ? `Your top expense "${top.desc}" is ${d(top.total)} (${top.topSubDesc && top.topSubDesc !== top.categoryName ? `mainly "${top.topSubDesc}"` : "your biggest category"}). Even a 10% cut saves ${d(top.total * 0.1)} this period.`
      : "Categorise every transaction — you can't manage what you don't measure.",
    goal0
      ? `You need ${d(goal0.remaining)} more for ${goal0.name}. Set up an automatic transfer of ${d(goal0.monthlyNeeded ?? goal0.remaining / 6)}/month so you don't have to think about it.`
      : "Create a goal with a deadline — it converts a vague wish into a concrete monthly number.",
    c.net < 0
      ? `Spending exceeds income by ${d(Math.abs(c.net))}. List every subscription and non-essential bill — often 10-15% of spending is forgotten autopayments.`
      : `You have ${d(c.net)} left over this period. Move it to savings today before it disappears into small purchases.`,
    "The 50/30/20 rule: 50% needs, 30% wants, 20% savings. Compare your own split to find where to adjust.",
  ];

  const allInsights    = [spendingInsight, topSpendInsight, goalInsight, budgetInsight];
  const positiveCount  = allInsights.filter(i => i.summaryCategory === "positive").length;
  const warnCount      = allInsights.filter(i => i.summaryCategory === "watchout").length;
  const oppCount       = allInsights.filter(i => i.summaryCategory === "opportunity").length;

  return {
    featured: {
      icon: c.net >= 0 ? "💰" : "⚠️",
      title: c.net >= 0
        ? `You're saving ${d(c.net)} this period`
        : `Overspending by ${d(Math.abs(c.net))} this period`,
      sub: `Income ${d(c.totalIncome)} · Expenses ${d(c.totalExpenses)} · Balance ${c.totalBalance < 0 ? "-" : ""}${d(c.totalBalance)}`,
      category: "Overview",
      amount: `${c.totalBalance < 0 ? "-" : ""}${d(c.totalBalance)}`,
      changePct: 0, changeLabel: "account balance", up: c.net >= 0,
    },
    insights: allInsights,
    summary: [
      { label: "Positive insights", count: positiveCount, delta: 0, color: "#10B981", icon: "↑" },
      { label: "Watch out",         count: warnCount,     delta: 0, color: "#F59E0B", icon: "!" },
      { label: "Opportunities",     count: oppCount,      delta: 0, color: "#A855F7", icon: "◎" },
    ],
    tips,
  };
}

function buildSystemPrompt(userData: UserData): string {
  const c     = computeSummary(userData);
  const d     = (n: number) => `$${Math.abs(n).toFixed(2)}`;
  const goal0 = c.goals[0];
  return (
`You are Fifty, a friendly financial assistant in the Fifty Sense budgeting app.
Answer in 2-3 conversational sentences. No markdown. No lists. No JSON.
End every reply with: What else can I help you with?
Decline non-financial questions politely.

=== USER FINANCIAL SUMMARY ===
Total income:   ${d(c.totalIncome)} (${c.incomeCount} transactions)
Total expenses: ${d(c.totalExpenses)} (${c.expenseCount} transactions)
Net cash flow:  ${c.net >= 0 ? "+" : "-"}${d(Math.abs(c.net))}
Savings rate:   ${c.savingsRate}%
Account balance: ${c.totalBalance < 0 ? "-" : ""}${d(Math.abs(c.totalBalance))}
Top expense: ${c.topExpenses[0]?.desc ?? "none"} at ${d(c.topExpenses[0]?.total ?? 0)}${c.topExpenses[0]?.topSubDesc && c.topExpenses[0].topSubDesc !== c.topExpenses[0].categoryName ? ` (main sub-item: "${c.topExpenses[0].topSubDesc}" at ${d(c.topExpenses[0].topSubTotal)})` : ""}
Goal: ${goal0 ? `${goal0.name} — ${goal0.pct}% reached (${d(goal0.current)} of ${d(goal0.target)})` : "none set"}

=== BUDGET ANALYSIS ===
${c.budgetHealth.length > 0
  ? `Total budgets: ${c.budgetHealth.length}
${c.budgetHealth.map(b =>
  `${b.category}: ${d(b.spent)}/${d(b.limit)} (${b.pct}%)${b.over ? ` — OVER by ${d(Math.abs(b.remaining))}` : b.pct >= 70 ? ` — approaching limit` : ""}`
).join("\n")}
Over budget: ${c.overBudget.length > 0 ? c.overBudget.map(b => b.category).join(", ") : "none"}
Near budget (70%+): ${c.nearBudget.length > 0 ? c.nearBudget.map(b => b.category).join(", ") : "none"}`
  : "No budgets set yet"}
`
  );
}

const SENTIMENT_COLORS: Record<Insight["sentiment"], { color: string; arrow: string }> = {
  positive: { color: "#10B981", arrow: "▲" },
  warning:  { color: "#F59E0B", arrow: "▲" },
  negative: { color: "#EF4444", arrow: "▼" },
  neutral:  { color: "#6B7A9E", arrow: "–" },
};

function ChangeBadge({ pct, label, sentiment }: { pct: number; label: string; sentiment: Insight["sentiment"] }) {
  const { color, arrow } = SENTIMENT_COLORS[sentiment];
  if (pct === 0 && sentiment === "neutral") return null;
  return (
    <div className="ai-change-wrap">
      <span className="ai-change-badge" style={{ color, background: `${color}1a`, border: `1px solid ${color}33` }}>
        {arrow} {pct > 0 ? `${pct}%` : ""}
      </span>
      <span className="ai-change-label">{label}</span>
    </div>
  );
}

function BudgetBar({ pct, over }: { pct: number; over: boolean }) {
  const capped = Math.min(pct, 100);
  const color  = over ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginTop: 4 }}>
      <div style={{ width: `${capped}%`, height: "100%", borderRadius: 2, background: color, transition: "width 0.6s ease" }} />
    </div>
  );
}

function AITipsCard({ tips }: { tips: string[] }) {
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, tips.length - 1);
  return (
    <div className="ai-tips-card">
      <div className="ai-tips-header">
        <span className="ai-tips-title">💡 AI tips</span>
        <span className="ai-sparkle" style={{ fontSize: 14 }}>✦</span>
      </div>
      <p className="ai-tips-text">{tips[safeIdx]}</p>
      <div className="ai-tips-footer">
        <button className="ai-tips-arrow" onClick={() => setIdx(i => (i - 1 + tips.length) % tips.length)}>‹</button>
        <div className="ai-tips-dots">
          {tips.map((_, i) => <span key={i} className={`ai-tips-dot ${i === safeIdx ? "active" : ""}`} onClick={() => setIdx(i)} />)}
        </div>
        <button className="ai-tips-arrow" onClick={() => setIdx(i => (i + 1) % tips.length)}>›</button>
      </div>
    </div>
  );
}

const FALLBACK_PROMPTS = [
  "Where am I overspending?",
  "Am I on track for my goals?",
  "How can I save more?",
  "Which budget is most at risk?",
];

async function generateQuickPrompts(userData: UserData): Promise<string[]> {
  const c     = computeSummary(userData);
  const d     = (n: number) => `$${Math.abs(n).toFixed(2)}`;
  const goal0 = c.goals[0];
  const top   = c.topExpenses[0];

  const context = [
    `Net: ${c.net >= 0 ? "+" : "-"}${d(Math.abs(c.net))}`,
    `Savings rate: ${c.savingsRate}%`,
    top   ? `Top expense: ${top.desc} at ${d(top.total)}` : "",
    goal0 ? `Goal: ${goal0.name} at ${goal0.pct}%` : "No goals set",
    c.overBudget.length > 0 ? `Over budget: ${c.overBudget.map(b => b.category).join(", ")}` : "No budgets exceeded",
  ].filter(Boolean).join(". ");

  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{
          role: "system",
          content: "You are a financial assistant. Given a user's financial snapshot, generate exactly 4 short, specific, conversational questions the user might want to ask about their finances. Each question must be under 8 words. Return ONLY a JSON array of 4 strings, nothing else. Example: [\"Why is my rent so high?\", \"How do I cut food spending?\"]",
        }, {
          role: "user",
          content: `Financial snapshot: ${context}. Generate 4 relevant questions.`,
        }],
      }),
    });
    if (!res.ok) return FALLBACK_PROMPTS;
    const json  = await res.json();
    const raw   = json?.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length >= 2) return parsed.slice(0, 4);
    }
  } catch {}
  return FALLBACK_PROMPTS;
}

function AskFifty({
  userData, pageState, onStateUpdate, autoPrompt, onAutoPromptDone,
}: {
  userData: UserData | null; pageState: PageState;
  onStateUpdate: (u: Partial<PageState>) => void;
  autoPrompt: string | null; onAutoPromptDone: () => void;
}) {
  const [query,          setQuery]          = useState("");
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [retrying,       setRetrying]       = useState(false);
  const [quickPrompts,   setQuickPrompts]   = useState<string[]>(FALLBACK_PROMPTS);
  const [promptsReady,   setPromptsReady]   = useState(false);
  const [promptsLoading, setPromptsLoading] = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const didAuto      = useRef(false);
  const abortRef     = useRef<AbortController | null>(null);
  const pageStateRef = useRef<PageState>(pageState);
  // ── NEW: always-current userData ref so sendMessage never uses a stale closure ──
  const userDataRef  = useRef<UserData | null>(null);

  useEffect(() => { pageStateRef.current = pageState; },  [pageState]);
  useEffect(() => { userDataRef.current  = userData;  },  [userData]);   // ← keep ref in sync
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Generate AI prompts once data is ready
  useEffect(() => {
    if (userData && !promptsReady) {
      setPromptsLoading(true);
      generateQuickPrompts(userData).then(prompts => {
        setQuickPrompts(prompts);
        setPromptsReady(true);
        setPromptsLoading(false);
      });
    }
  }, [userData, promptsReady]);

  const refreshPrompts = () => {
    if (!userData || promptsLoading) return;
    setPromptsLoading(true);
    setPromptsReady(false);
    generateQuickPrompts(userData).then(prompts => {
      setQuickPrompts(prompts);
      setPromptsReady(true);
      setPromptsLoading(false);
    });
  };

  useEffect(() => {
    if (autoPrompt && userData && !didAuto.current) {
      didAuto.current = true;
      sendMessage(autoPrompt, true);
      onAutoPromptDone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrompt, userData]);

  const sendMessage = useCallback(async (q: string, isAuto = false) => {
    if (!q.trim() || loading) return;

    // ── Read from ref so we always have the latest data, never a stale closure ──
    const currentUserData = userDataRef.current;
    if (!currentUserData) { setError("Still loading your financial data, please wait..."); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const history = messages.slice(-8).map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.displayText,
    }));

    if (!isAuto) {
      setMessages(prev => [...prev,
        { role: "user", text: q, displayText: q, timestamp: new Date() },
        { role: "ai",   text: "", displayText: "", timestamp: new Date() },
      ]);
      setQuery("");
    } else {
      setMessages([{ role: "ai", text: "", displayText: "", timestamp: new Date() }]);
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: true,
          messages: [
            // ── Use currentUserData (from ref) not userData (from closure) ──
            { role: "system", content: buildSystemPrompt(currentUserData) },
            ...history,
            { role: "user", content: q },
          ],
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Status: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const json  = JSON.parse(line);
            const token = json?.message?.content ?? "";
            if (token) {
              fullText += token;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "ai") next[next.length - 1] = { ...last, text: fullText, displayText: fullText };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError("Unable to reach Fifty. Check your local Ollama server.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [loading, messages]); // ── userData removed from deps; ref handles freshness ──

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) { setRetrying(true); setError(null); sendMessage(lastUser.displayText); }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    didAuto.current = false;
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const QuickPromptRow = ({ compact }: { compact?: boolean }) => (
    <div className={`ai-quick-prompts ${compact ? "ai-quick-prompts--inline" : ""}`}>
      {quickPrompts.slice(0, compact ? 2 : 4).map(p => (
        <button
          key={p}
          className={`ai-quick-btn ${promptsLoading ? "ai-quick-btn--loading" : ""}`}
          onClick={() => !promptsLoading && sendMessage(p)}
          disabled={promptsLoading || loading}
        >
          {promptsLoading ? <span className="ai-quick-shimmer" /> : p}
        </button>
      ))}
      <button
        className="ai-quick-refresh"
        onClick={refreshPrompts}
        disabled={promptsLoading || !userData}
        title="Generate new questions"
      >
        <span style={{ display: "inline-block", transition: "transform 0.4s", transform: promptsLoading ? "rotate(360deg)" : "none" }}>↻</span>
      </button>
    </div>
  );

  return (
    <div className="ai-ask-card">
      <div className="ai-ask-header">
        <span className="ai-sparkle">✦</span>
        <span className="ai-ask-title">Ask Fifty</span>
        <span className="ai-ask-model-badge">Local Finance LLM</span>
        {messages.length > 0 && (
          <button className="ai-ask-clear" onClick={clearChat} title="Clear chat">⟳</button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="ai-ask-empty">
          <div className="ai-ask-star-wrap"><span className="ai-ask-star">✦</span></div>
          <p className="ai-ask-hint">
            {userData ? "Fifty has loaded your data. Ask anything about your finances." : "Loading your financial data..."}
          </p>
          {userData && <QuickPromptRow />}
        </div>
      ) : (
        <div className="ai-ask-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ai-msg-${m.role}`}>
              {m.role === "ai" && <span className="ai-msg-icon">✦</span>}
              <div className="ai-msg-inner">
                <span className="ai-msg-text">
                  {m.displayText || (loading && i === messages.length - 1
                    ? <span className="ai-typing"><span /><span /><span /></span>
                    : null)}
                </span>
                {m.displayText && (
                  <span className="ai-msg-time">{formatTime(m.timestamp)}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <div className="ai-ask-error-row">
          <p className="ai-ask-error">{error}</p>
          <button className="ai-ask-retry" onClick={handleRetry} disabled={retrying}>
            {retrying ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}

      {messages.length > 0 && !loading && <QuickPromptRow compact />}

      <div className="ai-ask-input-row">
        <input
          className="ai-ask-input"
          placeholder="How can I save more?"
          value={query}
          disabled={loading || !userData}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage(query.trim())}
        />
        {loading
          ? <button className="ai-ask-send ai-ask-stop" onClick={() => abortRef.current?.abort()}>■</button>
          : <button className="ai-ask-send" onClick={() => sendMessage(query.trim())} disabled={!query.trim() || !userData}>➤</button>
        }
      </div>
    </div>
  );
}

export default function AIInsights() {
  const [pageState,  setPageState]  = useState<PageState>(DEFAULT_STATE);
  const [userData,   setUserData]   = useState<UserData | null>(null);
  const [autoPrompt, setAutoPrompt] = useState<string | null>(null);
  const [dataError,  setDataError]  = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { setDataError("No user session found. Please log in."); return; }
    let userId: string;
    try {
      const parsed = JSON.parse(raw);
      userId = parsed.user_id ?? parsed._id ?? parsed.id;
    } catch { setDataError("Could not parse user session."); return; }

    fetchUserData(userId).then(data => {
      setUserData(data);
      const c = computeSummary(data);
      setPageState(buildDashboardUpdate(c));
      setAutoPrompt("Give me a 2-3 sentence overview of my current financial situation based on my data.");
    }).catch(() => setDataError("Failed to load financial data. Please refresh."));
  }, []);

  const handleStateUpdate = (update: Partial<PageState>) => {
    setPageState(prev => ({
      featured: update.featured ? { ...prev.featured, ...update.featured } : prev.featured,
      insights: update.insights ?? prev.insights,
      summary:  update.summary  ?? prev.summary,
      tips:     update.tips     ?? prev.tips,
    }));
  };

  const { featured, insights, tips } = pageState;
  const sum = pageState.summary;

  return (
    <div className="ai-page">
      <div className="ai-oval" />
      <div className="ai-header">
        <h1 className="ai-title">AI Insights</h1>
        <p className="ai-subtitle">Overview of your financial activity</p>
        {dataError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>{dataError}</p>}
      </div>

      <div className="ai-layout">
        <div className="ai-left">
          <div className="ai-featured-card">
            <div className="ai-featured-left">
              <div className="ai-featured-icon-wrap"><span>{featured.icon}</span></div>
              <div className="ai-featured-body">
                <p className="ai-featured-title">{featured.title}</p>
                <p className="ai-featured-sub">{featured.sub}</p>
              </div>
            </div>
            <div className="ai-featured-right">
              <span className="ai-featured-cat">{featured.category}</span>
              <span className="ai-featured-amount">{featured.amount}</span>
              {featured.changePct !== 0 && (
                <ChangeBadge
                  pct={featured.changePct}
                  label={featured.changeLabel}
                  sentiment={featured.up ? "positive" : "negative"}
                />
              )}
            </div>
          </div>

          <div className="ai-section-label">Top Insights for you</div>
          <div className="ai-insights-list">
            {insights.length === 0 ? (
              <p style={{ color: "#6B7A9E", fontSize: 13 }}>Fifty is generating your personalised insights...</p>
            ) : (
              insights.map(ins => {
                const accentColor = ins.summaryCategory === "positive" ? "#10B981"
                  : ins.summaryCategory === "opportunity" ? "#A855F7"
                  : "#F59E0B";
                return (
                  <div key={ins.id} className="ai-insight-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
                    <div className="ai-insight-icon" style={{ background: ins.iconBg }}><span>{ins.icon}</span></div>
                    <div className="ai-insight-body">
                      <p className="ai-insight-title">{ins.title}</p>
                      <p className="ai-insight-sub">{ins.body}</p>
                      {(ins.id === "budget-over" || ins.id === "budget-warn") && ins.changePct > 0 && (
                        <BudgetBar pct={ins.changePct} over={ins.id === "budget-over"} />
                      )}
                    </div>
                    <div className="ai-insight-right">
                      <span className="ai-insight-cat">{ins.category}</span>
                      <span className="ai-insight-amount">{ins.amount}</span>
                      <ChangeBadge pct={ins.changePct} label={ins.changeLabel} sentiment={ins.sentiment} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="ai-right">
          <AskFifty
            userData={userData}
            pageState={pageState}
            onStateUpdate={handleStateUpdate}
            autoPrompt={autoPrompt}
            onAutoPromptDone={() => setAutoPrompt(null)}
          />

          <div className="ai-summary-card">
            <span className="ai-summary-title">Insights summary</span>
            <div className="ai-summary-list">
              {sum.map(s => (
                <div key={s.label} className="ai-summary-row">
                  <div className="ai-summary-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
                  <div className="ai-summary-info">
                    <span className="ai-summary-count" style={{ color: s.color }}>{s.count}</span>
                    <span className="ai-summary-label">{s.label}</span>
                  </div>
                  {s.delta > 0 && (
                    <span className="ai-summary-delta up" style={{ color: s.color }}>▲ {s.delta} vs last month</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <AITipsCard tips={tips} />
        </div>
      </div>
    </div>
  );
}
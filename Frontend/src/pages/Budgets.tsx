import { useState, useEffect, useCallback, useRef } from "react";
import "../style/Budgets.css";
import { useAuth } from "../api/useAuth";
import { apiRequest } from "../api/axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  _id: string;
  category_name: string;
  icon?: string;
}

interface Transaction {
  transaction_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

interface Account {
  account_id: string;
  account_name: string;
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
  icon: string;
  color: string;
  bgColor: string;
  transactionCount: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PALETTE: Array<{ color: string; bg: string }> = [
  { color: "#EC4899", bg: "rgba(236,72,153,0.18)" },
  { color: "#F59E0B", bg: "rgba(245,158,11,0.18)" },
  { color: "#3B82F6", bg: "rgba(59,130,246,0.18)" },
  { color: "#8B5CF6", bg: "rgba(139,92,246,0.18)" },
  { color: "#EF4444", bg: "rgba(239,68,68,0.18)" },
  { color: "#10B981", bg: "rgba(16,185,129,0.18)" },
  { color: "#F97316", bg: "rgba(249,115,22,0.18)" },
  { color: "#06B6D4", bg: "rgba(6,182,212,0.18)" },
];

const POLL_INTERVAL_MS = 60_000;

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function isInPeriod(date: Date, period: Budget["period"]): boolean {
  const now = new Date();
  if (period === "yearly") return date.getFullYear() === now.getFullYear();
  if (period === "monthly") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  const dayOfWeek = now.getDay();
  const diffToMon = (dayOfWeek + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - diffToMon);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

function formatLastUpdated(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({
  segments,
  remaining,
  centerLabel,
}: {
  segments: { value: number; color: string }[];
  remaining: number;
  centerLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const S = 180;
    canvas.width = S;
    canvas.height = S;
    const cx = S / 2, cy = S / 2, OR = 82, IR = 56;
    const slices = [
      ...segments.filter(s => s.value > 0),
      ...(remaining > 0 ? [{ value: remaining, color: "#1a2040" }] : []),
    ];
    const total = slices.reduce((s, x) => s + x.value, 0) || 1;
    ctx.clearRect(0, 0, S, S);
    let angle = -Math.PI / 2;
    for (const sl of slices) {
      const sweep = (sl.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, OR, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();
      angle += sweep;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, IR, 0, 2 * Math.PI);
    ctx.fillStyle = "#11183A";
    ctx.fill();
  }, [segments, remaining]);

  return (
    <div className="bud-donut-wrap">
      <canvas ref={ref} style={{ width: 180, height: 180, display: "block" }} />
      <div className="bud-donut-center">
        <span className="bud-donut-value">{centerLabel}</span>
        <span className="bud-donut-sub">remaining</span>
      </div>
    </div>
  );
}

// ── Budget Modal (Handle Create & Edit) ─────────────────────────────────────────
function BudgetModal({
  userId,
  token,
  categories,
  existingBudgets,
  editBudget,
  onClose,
  onCreated,
}: {
  userId: string;
  token: string | null;
  categories: Category[];
  existingBudgets: Budget[];
  editBudget?: BudgetWithSpent | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [categoryName, setCategoryName] = useState(editBudget?.category_name ?? categories[0]?.category_name ?? "");
  const [limitAmount, setLimitAmount]   = useState(editBudget?.limit_amount.toString() ?? "");
  const [period, setPeriod]             = useState<Budget["period"]>(editBudget?.period ?? "monthly");
  const [submitting, setSubmitting]     = useState(false);
  const [err, setErr]                   = useState<string | null>(null);

  const isEditing = !!editBudget;

  const handleSubmit = async () => {
    const amt = parseFloat(limitAmount);
    if (!categoryName) return setErr("Please select a category.");
    if (!limitAmount || isNaN(amt) || amt <= 0) return setErr("Enter a valid amount.");
    if (amt >= 1_000_000) return setErr("Amount must be less than 1,000,000.");
    
    const isDuplicate = existingBudgets.some(b => 
      b.category_name === categoryName && 
      b.period === period && 
      b.budget_id !== editBudget?.budget_id
    );
    if (isDuplicate) return setErr("A budget for this category & period already exists.");

    setSubmitting(true);
    setErr(null);
    try {
      const url = isEditing ? `/api/budgets/${editBudget.budget_id}` : "/api/budgets/create";
      const method = isEditing ? "PUT" : "POST";

      await apiRequest(url, {
        token,
        method,
        body: { user_id: userId, category_name: categoryName, limit_amount: amt, period },
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? `Failed to ${isEditing ? "update" : "create"} budget.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bud-overlay" onClick={onClose}>
      <div className="bud-modal" onClick={e => e.stopPropagation()}>
        <div className="bud-modal-head">
          <div>
            <h2 className="bud-modal-title">{isEditing ? "Edit Budget" : "New Budget"}</h2>
            <p className="bud-modal-sub">{isEditing ? "Update spending target" : "Set a spending limit for a category"}</p>
          </div>
          <button className="bud-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="bud-field">
          <label className="bud-label">Category</label>
          <select className="bud-input" value={categoryName} onChange={e => setCategoryName(e.target.value)}>
            {categories.map(c => (
              <option key={c._id} value={c.category_name}>{c.icon || "💳"} {c.category_name}</option>
            ))}
          </select>
        </div>

        <div className="bud-field">
          <label className="bud-label">Limit Amount ($)</label>
          <input
            className="bud-input"
            type="number"
            placeholder="e.g. 500"
            value={limitAmount}
            onChange={e => setLimitAmount(e.target.value)}
          />
        </div>

        <div className="bud-field">
          <label className="bud-label">Period</label>
          <div className="bud-period-row">
            {(["weekly", "monthly", "yearly"] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`bud-period-btn${period === p ? " active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {err && <p className="bud-err">{err}</p>}

        <button className="bud-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving…" : isEditing ? "Update Budget" : "Create Budget"}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Budgets() {
  const { user, token } = useAuth();
  const userId = (user as any)?.user_id;

  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activePeriod, setActivePeriod] = useState<Budget["period"] | "all">("all");

  const fetchAll = useCallback(async (silent = false) => {
    if (!userId) { setLoading(false); return; }
    if (silent) setRefreshing(true); else setLoading(true);
    setError(null);

    try {
      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      const cats = unwrapArray<Category>(catRaw);
      const icons = getCategoryIcons();
      const catsWI = cats.map(c => ({ ...c, icon: icons[c.category_name] || c.icon || "💳" }));
      setCategories(catsWI);

      const accRaw = await apiRequest<any>(`/api/accounts/user/${userId}`, { token });
      const accs = unwrapArray<Account>(accRaw);

      const txArrays = await Promise.all(
        accs.map(async acc => {
          try {
            const r = await apiRequest<any>(`/api/transactions/account/${acc.account_id}`, { token });
            return unwrapArray<Transaction>(r);
          } catch { return []; }
        })
      );
      const allTx = txArrays.flat();

      const budRaw = await apiRequest<any>(`/api/budgets/user/${userId}`, { token });
      const raw = unwrapArray<Budget>(budRaw);
      setRawBudgets(raw);

      const spentMap: Record<string, { total: number; count: number }> = {};
      for (const tx of allTx) {
        if (tx.type !== "expense") continue;
        const txDate = new Date(tx.date);
        const cat = catsWI.find(c => c._id === tx.category_id);
        if (!cat) continue;
        for (const b of raw) {
          if (b.category_name !== cat.category_name) continue;
          if (!isInPeriod(txDate, b.period)) continue;
          const key = `${b.category_name}::${b.period}`;
          if (!spentMap[key]) spentMap[key] = { total: 0, count: 0 };
          spentMap[key].total += Number(tx.amount);
          spentMap[key].count += 1;
        }
      }

      setBudgets(raw.map((b, i) => {
        const key = `${b.category_name}::${b.period}`;
        const data = spentMap[key] ?? { total: 0, count: 0 };
        const cat = catsWI.find(c => c.category_name === b.category_name);
        const pal = PALETTE[i % PALETTE.length];
        return {
          ...b,
          spent: data.total,
          transactionCount: data.count,
          icon: cat?.icon || "💳",
          color: pal.color,
          bgColor: pal.bg,
        };
      }));
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load budgets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchAll(false); }, [fetchAll]);
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => fetchAll(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAll, userId]);

  const handleDelete = async (budgetId: string) => {
    setDeletingId(budgetId);
    try {
      await apiRequest(`/api/budgets/${budgetId}`, { token, method: "DELETE" });
      setConfirmId(null);
      await fetchAll(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete budget.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBudgets = activePeriod === "all" ? budgets : budgets.filter(b => b.period === activePeriod);
  const totalSpent = filteredBudgets.reduce((s, b) => s + b.spent, 0);
  const totalLimit = filteredBudgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalRemaining = Math.max(0, totalLimit - totalSpent);
  const maxSpent = Math.max(...filteredBudgets.map(b => b.spent), 1);
  const overBudgetCount = filteredBudgets.filter(b => b.spent > b.limit_amount).length;
  const periodLabel: Record<Budget["period"], string> = { weekly: "This week", monthly: "This month", yearly: "This year" };

  return (
    <div className="budgets-page">
      <div className="oval" />

      <div className="bud-page-header">
        <h1 className="page-title">Budgets</h1>
        <div className="bud-header-meta">
          {lastUpdated && <span className="bud-last-updated">Updated {formatLastUpdated(lastUpdated)}</span>}
          <button className={`bud-refresh-btn${refreshing ? " spinning" : ""}`} onClick={() => fetchAll(true)} disabled={refreshing}>↻</button>
        </div>
      </div>

      {error && <div className="bud-error-banner">{error}</div>}

      <div className="bud-period-tabs">
        {(["all", "weekly", "monthly", "yearly"] as const).map(p => (
          <button key={p} className={`bud-tab${activePeriod === p ? " active" : ""}`} onClick={() => setActivePeriod(p)}>
            {p === "all" ? "All" : p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {overBudgetCount > 0 && !loading && <div className="bud-warning-banner">⚠️ {overBudgetCount} budget{overBudgetCount > 1 ? "s are" : " is"} over limit</div>}

      <div className="bud-layout">
        <div className="bud-card bud-progress-card">
          <div className="bud-progress-head">
            <span className="bud-section-title">Budget Progress</span>
            <button className="bud-new-btn" onClick={() => setShowModal(true)}>+ New budget</button>
          </div>

          {loading ? <p className="bud-empty">Loading…</p> : filteredBudgets.length === 0 ? <p className="bud-empty">No budgets yet.</p> : (
            <div className="bud-list">
              {filteredBudgets.map(b => {
                const pct = Math.min((b.spent / b.limit_amount) * 100, 100);
                const over = b.spent > b.limit_amount;
                const isC = confirmId === b.budget_id;
                return (
                  <div key={b.budget_id} className={`bud-item${over ? " bud-item--over" : ""}`}>
                    <div className="bud-item-row">
                      <div className="bud-item-icon" style={{ background: b.bgColor }}><span style={{ fontSize: 18 }}>{b.icon}</span></div>
                      <div className="bud-item-meta">
                        <span className="bud-item-name">{b.category_name}</span>
                        <span className="bud-item-period-badge">{b.period}</span>
                      </div>
                      <span className="bud-item-amount" style={{ color: over ? "#EF4444" : "#6B7A9E" }}>${fmt(b.spent)} / ${fmt(b.limit_amount)}</span>
                      
                      <div className="bud-actions">
                        {isC ? (
                          <>
                            <span className="bud-confirm-text">Delete?</span>
                            <button className="bud-action-btn bud-yes-btn" onClick={() => handleDelete(b.budget_id)} disabled={deletingId === b.budget_id}>✓</button>
                            <button className="bud-action-btn bud-no-btn" onClick={() => setConfirmId(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="bud-action-btn bud-no-btn" onClick={() => setEditingBudget(b)} title="Edit">✎</button>
                            <button className="bud-action-btn bud-del-btn" onClick={() => setConfirmId(b.budget_id)} title="Delete">🗑</button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bud-bar-track">
                      <div className="bud-bar-fill" style={{ width: `${pct}%`, background: over ? "linear-gradient(90deg,#EF4444,#F87171)" : "linear-gradient(90deg,#13AC24,#10B981)" }} />
                    </div>

                    <div className="bud-item-footer">
                      {over ? <p className="bud-over-text">Over by ${fmt(b.spent - b.limit_amount)}</p> : <p className="bud-rem-text">${fmt(b.limit_amount - b.spent)} remaining</p>}
                      <span className="bud-tx-count">{b.transactionCount} transactions {activePeriod === "all" ? `(${periodLabel[b.period]})` : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bud-card bud-overview-card">
          <span className="bud-section-title">{activePeriod === "all" ? "Overall" : activePeriod} overview</span>
          <p className="bud-overview-sub">${fmt(totalSpent)} spent · ${fmt(totalLimit)} budgeted</p>
          <DonutChart segments={filteredBudgets.map(b => ({ value: b.spent, color: b.color }))} remaining={totalRemaining} centerLabel={`$${fmt(totalRemaining)}`} />
          <div className="bud-stats-row">
            <div className="bud-stat"><span className="bud-stat-value">{filteredBudgets.length}</span><span className="bud-stat-label">Budgets</span></div>
            <div className="bud-stat"><span className="bud-stat-value">{totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0}%</span><span className="bud-stat-label">Used</span></div>
            <div className="bud-stat" style={{ color: overBudgetCount > 0 ? "#EF4444" : "inherit" }}><span className="bud-stat-value">{overBudgetCount}</span><span className="bud-stat-label">Over</span></div>
          </div>
          <div className="bud-divider" />
          <p className="bud-avg-label">Spending by category</p>
          <div className="bud-avg-list">
            {filteredBudgets.map(b => (
              <div key={b.budget_id} className="bud-avg-row">
                <span className="bud-avg-name">{b.icon} {b.category_name}</span>
                <div className="bud-avg-track"><div className="bud-avg-fill" style={{ width: `${(b.spent / maxSpent) * 100}%`, background: b.color }} /></div>
                <span className="bud-avg-amount">${fmt(b.spent)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(showModal || editingBudget) && userId && (
        <BudgetModal
          userId={userId}
          token={token ?? null}
          categories={categories}
          existingBudgets={rawBudgets}
          editBudget={editingBudget}
          onClose={() => { setShowModal(false); setEditingBudget(null); }}
          onCreated={() => fetchAll(false)}
        />
      )}
    </div>
  );
}
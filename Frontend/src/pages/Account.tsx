import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { apiRequest } from "../api/axios";
import "../style/Account.css";

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

interface AccountWithTx extends Account {
  transactions: Transaction[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

const fmtBalance = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n));

const fmtAmount = (n: number) =>
  (n >= 0 ? "+" : "−") + new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD"
  }).format(Math.abs(n));

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Pick icon + background colour based on account name */
function accountStyle(name: string): { icon: string; bg: string; color: string } {
  const n = name.toLowerCase();
  if (n.includes("check"))   return { icon: "🏦", bg: "#1a3a1f", color: "#13AC24" };
  if (n.includes("saving"))  return { icon: "💰", bg: "#1a2a3a", color: "#3D8EFF" };
  if (n.includes("credit"))  return { icon: "💳", bg: "#2a1e2a", color: "#a855f7" };
  if (n.includes("crypto") || n.includes("btc") || n.includes("eth"))
    return { icon: "₿", bg: "#2a2a1e", color: "#f59e0b" };
  if (n.includes("invest") || n.includes("stock") || n.includes("brokerage"))
    return { icon: "📈", bg: "#1a2a1a", color: "#13AC24" };
  if (n.includes("cash"))    return { icon: "💵", bg: "#1e2a1e", color: "#13AC24" };
  return { icon: "🏛️", bg: "#1e1e2a", color: "#7a8ab0" };
}

/** Derive a category label from category_id or description */
function categoryLabel(tx: Transaction): string {
  if (tx.category_id) return tx.category_id;
  const d = (tx.description ?? "").toLowerCase();
  if (d.includes("groceri") || d.includes("trader") || d.includes("whole foods")) return "Groceries";
  if (d.includes("coffee") || d.includes("starbucks") || d.includes("food")) return "Food";
  if (d.includes("amazon")) return "Shopping";
  if (d.includes("paycheck") || d.includes("salary") || d.includes("direct dep")) return "Income";
  if (d.includes("netflix") || d.includes("spotify") || d.includes("hulu")) return "Subscriptions";
  return tx.type === "income" ? "Income" : "Expense";
}

function txIcon(tx: Transaction): { icon: string; bg: string } {
  const d = (tx.description ?? "").toLowerCase();
  if (d.includes("amazon"))    return { icon: "📦", bg: "#2a2a1e" };
  if (d.includes("starbucks") || d.includes("coffee")) return { icon: "☕", bg: "#2a2a1e" };
  if (d.includes("trader") || d.includes("groceri") || d.includes("whole")) return { icon: "🛒", bg: "#1e2a1e" };
  if (d.includes("paycheck") || d.includes("salary")) return { icon: "💳", bg: "#1e2a1e" };
  if (d.includes("netflix"))   return { icon: "🎬", bg: "#2a1e1e" };
  if (d.includes("spotify"))   return { icon: "🎵", bg: "#1e2a1e" };
  if (d.includes("uber"))      return { icon: "🚗", bg: "#1e1e2a" };
  if (tx.type === "income")    return { icon: "⊕", bg: "#1a3a1f" };
  return { icon: "⊖", bg: "#2a1e1e" };
}

// ── Create Account Modal ──────────────────────────────────────────────────────
function CreateAccountModal({
  onClose,
  onCreated,
  userId,
  token,
}: {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
  token: string | null;
}) {
  const [name, setName]       = useState("");
  const [balance, setBalance] = useState("");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) { setErr("Account name is required."); return; }
    setSaving(true);
    setErr(null);
    try {
      await apiRequest("/api/accounts/create", {
        token,
        method: "POST",
        body: {
          user_id: userId,
          account_name: name.trim(),
          balance: parseFloat(balance) || 0,
        },
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ac-modal-header">
          <h2>New Account</h2>
          <button className="ac-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label>Account Name</label>
          <input
            type="text"
            placeholder="e.g. Checking, Savings, Credit Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Starting Balance ($)</label>
          <input
            type="number"
            placeholder="0.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            step="0.01"
          />
        </div>

        {err && <p className="ac-modal-error">{err}</p>}

        <div className="form-actions">
          <button className="btn-save" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "Create Account"}
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Account Modal ────────────────────────────────────────────────────────
function EditAccountModal({
  acc,
  onClose,
  onUpdated,
  token,
}: {
  acc: AccountWithTx;
  onClose: () => void;
  onUpdated: () => void;
  token: string | null;
}) {
  const [name, setName]       = useState(acc.account_name);
  const [balance, setBalance] = useState(String(acc.balance));
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!name.trim()) { setErr("Account name is required."); return; }
    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) { setErr("Please enter a valid balance."); return; }
    setSaving(true);
    setErr(null);
    try {
      await apiRequest(`/api/accounts/${acc.account_id}`, {
        token,
        method: "PUT",
        body: {
          account_name: name.trim(),
          balance: parsedBalance,
        },
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ac-modal-header">
          <h2>Edit Account</h2>
          <button className="ac-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label>Account Name</label>
          <input
            type="text"
            placeholder="e.g. Checking, Savings, Credit Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Balance ($)</label>
          <input
            type="number"
            placeholder="0.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            step="0.01"
          />
        </div>

        {err && <p className="ac-modal-error">{err}</p>}

        <div className="form-actions">
          <button className="btn-save" onClick={handleUpdate} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({
  acc,
  onDelete,
  onEdit,
}: {
  acc: AccountWithTx;
  onDelete: (id: string) => void;
  onEdit: (acc: AccountWithTx) => void;
}) {
  const style  = accountStyle(acc.account_name);
  const income = acc.transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = acc.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const total  = income + expense || 1;
  const barPct = Math.min(100, Math.round((Math.max(income, expense) / total) * 100));
  const recentTx = acc.transactions.slice(0, 3);
  const isPositive = acc.balance >= 0;

  return (
    <div className="acct-card">
      <div className="acct-title-row">
        <div className="acct-icon" style={{ background: style.bg, color: style.color }}>
          {style.icon}
        </div>
        <span className="acct-name">{acc.account_name}</span>
        <span className={`acct-balance ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "" : "−"}{fmtBalance(acc.balance)}
        </span>
      </div>

      <div className="acct-bar-wrap">
        <div
          className={`acct-bar ${isPositive ? "green" : "red"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div className="acct-nums">
        <span className="acct-num negative">⊖ {expense.toFixed(0)}</span>
        <span className="acct-num positive">⊕ {income.toFixed(0)}</span>
      </div>

      <div className="tx-list">
        {recentTx.length === 0 ? (
          <p className="ac-no-tx">No transactions yet</p>
        ) : (
          recentTx.map((tx) => {
            const ti = txIcon(tx);
            return (
              <div key={tx.transaction_id} className="tx-row">
                <div className="tx-icon" style={{ background: ti.bg }}>{ti.icon}</div>
                <div className="tx-info">
                  <div className="tx-name">
                    {tx.description || (tx.type === "income" ? "Income" : "Expense")}
                  </div>
                  <div className="tx-cat">{categoryLabel(tx)}</div>
                </div>
                <div className="tx-right">
                  <div className={`tx-amount ${tx.type === "income" ? "positive" : "negative"}`}>
                    {fmtAmount(tx.type === "income" ? Number(tx.amount) : -Number(tx.amount))}
                  </div>
                  <div className="tx-date">{fmtDate(tx.date)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Card action buttons ── */}
      <div className="acct-card-actions">
        <button
          className="ac-edit-acct"
          onClick={() => onEdit(acc)}
          title="Edit this account"
        >
          Edit
        </button>
        <button
          className="ac-delete-acct"
          onClick={() => onDelete(acc.account_id)}
          title="Delete this account"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Account() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts]         = useState<AccountWithTx[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithTx | null>(null);
  const [formData, setFormData]         = useState({
    first_name: user?.first_name ?? "",
    last_name:  user?.last_name  ?? "",
    email:      user?.email      ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const userId = (user as any)?.user_id;

  // ── Fetch accounts + transactions ─────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const raw = await apiRequest<any>(`/api/accounts/user/${userId}`, { token });
      const accs: Account[] = unwrapArray<Account>(raw);

      const withTx: AccountWithTx[] = await Promise.all(
        accs.map(async (acc) => {
          try {
            const txRaw = await apiRequest<any>(
              `/api/transactions/account/${acc.account_id}`,
              { token }
            );
            const txs = unwrapArray<Transaction>(txRaw)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { ...acc, transactions: txs };
          } catch {
            return { ...acc, transactions: [] };
          }
        })
      );
      setAccounts(withTx);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Delete this account and all its transactions?")) return;
    try {
      await apiRequest(`/api/accounts/delete/${accountId}`, {
        token,
        method: "DELETE",
      });
      fetchAccounts();
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete account.");
    }
  };

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      console.log("Saving profile:", formData);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const allTx        = accounts.flatMap((a) => a.transactions);
  const totalIncome  = allTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = allTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const changePct    = totalIncome > 0
    ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)
    : "0.0";
  const changeUp     = Number(changePct) >= 0;

  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";

  return (
    <div className="account-container">
      <h1 className="account-page-title">Profile</h1>

      <div className="account-grid">

        {/* ── Left: Profile Card ─────────────────────────────────────────── */}
        <div className="profile-card">
          <div className="avatar">{initials}</div>
          <div className="profile-name">{fullName}</div>

          <div className="profile-meta">
            <div className="meta-row">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b949e" strokeWidth="1.5">
                <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                <path d="M1 6l7 4 7-4"/>
              </svg>
              {user?.email ?? "—"}
            </div>
            <div className="meta-row">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b949e" strokeWidth="1.5">
                <rect x="2" y="7" width="12" height="8" rx="1"/>
                <path d="M5 7V5a3 3 0 016 0v2"/>
              </svg>
              ••••••••••
            </div>
          </div>

          {/* Edit profile form */}
          <div className="tab-content">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text" name="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text" name="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formData.email} disabled />
            </div>

            <div className="form-actions">
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : saveMsg ?? "Save Changes"}
              </button>
              <button className="btn-cancel" onClick={() => setFormData({
                first_name: user?.first_name ?? "",
                last_name:  user?.last_name  ?? "",
                email:      user?.email      ?? "",
              })}>
                Cancel
              </button>
            </div>
          </div>

          <button className="btn-action" onClick={() => navigate("/settings")}>Settings</button>
          <button className="btn-action" onClick={() => { logout?.(); navigate("/login"); }}>
            Log Out
          </button>
          <button className="btn-delete">Delete account</button>
        </div>

        {/* ── Right: Balance + Account Cards ────────────────────────────── */}
        <div className="right-col">

          {/* Balance summary bar */}
          <div className="balance-card">
            <div>
              <div className="balance-amount">
                {totalBalance < 0 ? "−" : ""}${Math.abs(totalBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <span className={`badge-up ${changeUp ? "" : "badge-down"}`}>
                  {changeUp ? "▲" : "▼"} {Math.abs(Number(changePct))}%
                </span>
              </div>
              <div className="balance-pills">
                <span className="pill green">⊕ {totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                <span className="pill red">⊖ {totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <button className="btn-create-account" onClick={() => setShowModal(true)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 2v12M2 8h12"/>
              </svg>
              Add Account
            </button>
          </div>

          {/* Account cards grid */}
          {loading ? (
            <div className="ac-loading">
              <div className="ac-spinner" />
              <span>Loading accounts…</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="ac-empty">
              <span>🏦</span>
              <p>No accounts yet</p>
              <p className="ac-empty-sub">Create your first account to get started</p>
              <button className="btn-save" style={{ width: "auto", padding: "10px 24px" }} onClick={() => setShowModal(true)}>
                + Create Account
              </button>
            </div>
          ) : (
            <div className="acct-grid">
              {accounts.map((acc) => (
                <AccountCard
                  key={acc.account_id}
                  acc={acc}
                  onDelete={handleDeleteAccount}
                  onEdit={setEditingAccount}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Account Modal ─────────────────────────────────────────── */}
      {showModal && userId && (
        <CreateAccountModal
          userId={userId}
          token={token ?? null}
          onClose={() => setShowModal(false)}
          onCreated={fetchAccounts}
        />
      )}

      {/* ── Edit Account Modal ───────────────────────────────────────────── */}
      {editingAccount && (
        <EditAccountModal
          acc={editingAccount}
          token={token ?? null}
          onClose={() => setEditingAccount(null)}
          onUpdated={fetchAccounts}
        />
      )}
    </div>
  );
}
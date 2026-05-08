import { useState, useMemo, useEffect, useCallback } from "react";
import "../../style/Transactions.css";
import { useAuth } from "../../api/useAuth";
import { apiRequest } from "../../api/axios";
import CategoryModal from "./Categorymodal";
import TransactionRow from "./Transactionrow";
import {
  validate, isValid, unwrapArray,
  toLocalISOString, applyStoredIcons,
} from "./Utils";
import type {
  Account, Category, Transaction,
  EditState, FieldErrors, TransactionType,
} from "./Types";

export default function Transactions() {
  const { user, token } = useAuth();
  const userId = (user as any)?.user_id;

  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // ── Add form ──────────────────────────────────────────────────────────────
  const [activeType, setActiveType]             = useState<TransactionType>("expense");
  const [amount, setAmount]                     = useState("");
  const [description, setDescription]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount]   = useState("");
  const [date, setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [addTouched, setAddTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const addErrors = useMemo(() => validate(description, amount), [description, amount]);

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editState, setEditState]     = useState<EditState | null>(null);
  const [editTouched, setEditTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const editErrors = useMemo(
    () => (editState ? validate(editState.description, editState.amount) : {}),
    [editState]
  );

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Search + pagination ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const perPage = 7;

  // ── Filters ───────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters]         = useState(false);
  const [filterType, setFilterType]           = useState<"all" | TransactionType>("all");
  const [filterCategory, setFilterCategory]   = useState("all");
  const [filterDateFrom, setFilterDateFrom]   = useState("");
  const [filterDateTo, setFilterDateTo]       = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");

  const hasActiveFilters =
    filterType !== "all" || filterCategory !== "all" ||
    filterDateFrom !== "" || filterDateTo !== "" ||
    filterAmountMin !== "" || filterAmountMax !== "";

  const clearFilters = () => {
    setFilterType("all"); setFilterCategory("all");
    setFilterDateFrom(""); setFilterDateTo("");
    setFilterAmountMin(""); setFilterAmountMax("");
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const accRaw = await apiRequest<any>(`/api/accounts/user/${userId}`, { token });
      const accs = unwrapArray<Account>(accRaw);
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccount) setSelectedAccount(accs[0].account_id);

      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      const cats = applyStoredIcons(unwrapArray<Category>(catRaw));
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0]._id);

      const txArrays = await Promise.all(
        accs.map(async (acc) => {
          try {
            const raw = await apiRequest<any>(`/api/transactions/account/${acc.account_id}`, { token });
            return unwrapArray<Transaction>(raw);
          } catch { return []; }
        })
      );
      setTransactions(
        txArrays.flat().sort((a, b) => {
          const cmp = b.date.localeCompare(a.date);
          return cmp !== 0 ? cmp : b._id.localeCompare(a._id);
        })
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    try {
      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      setCategories(applyStoredIcons(unwrapArray<Category>(catRaw)));
    } catch { /* ignore */ }
  }, [userId, token]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalIncome   = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalExpenses;
  const netPct = totalIncome > 0 ? Math.min(Math.max((net / totalIncome) * 100, 0), 100) : net > 0 ? 100 : 0;

  const filtered = transactions.filter(t => {
    const desc    = (t.description ?? "").toLowerCase();
    const catName = (categories.find(c => c._id === t.category_id)?.category_name ?? "").toLowerCase();
    const txDate  = t.date.split("T")[0];
    return (
      (!search || desc.includes(search.toLowerCase()) || catName.includes(search.toLowerCase())) &&
      (filterType === "all" || t.type === filterType) &&
      (filterCategory === "all" || t.category_id === filterCategory) &&
      (!filterDateFrom || txDate >= filterDateFrom) &&
      (!filterDateTo   || txDate <= filterDateTo) &&
      (!filterAmountMin || Number(t.amount) >= Number(filterAmountMin)) &&
      (!filterAmountMax || Number(t.amount) <= Number(filterAmountMax))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Handlers ──────────────────────────────────────────────────────────────
const playExpenseSound = () => {
  const audio = new Audio("../../public/sounds/Fahhh - QuickSounds.com.mp3");
  audio.play().catch(() => {});
};
  const handleConfirm = async () => {
    setAddTouched({ description: true, amount: true });
    if (!isValid(addErrors)) return;
    if (!selectedAccount) { setError("Please select an account."); return; }
    setSubmitting(true); setError(null);
    try {
      await apiRequest("/api/transactions/create", {
        token, method: "POST",
        body: {
          account_id: selectedAccount, category_id: selectedCategory || "Other",
          type: activeType, amount: parseFloat(amount),
          date: toLocalISOString(date), description: description.trim(),
        },
      });
      setDescription(""); setAmount(""); setAddTouched({}); setPage(1);
      await fetchAll();
      if (activeType === "expense") playExpenseSound(); 
    } catch (e: any) {
      setError(e?.message ?? "Failed to create transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/transactions/${id}`, { token, method: "DELETE" });
      setDeleteConfirmId(null);
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete transaction.");
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.transaction_id);
    setEditState({
      description: tx.description ?? "",
      category_id: tx.category_id,
      amount: String(tx.amount),
      type: tx.type,
      account_id: tx.account_id,
      date: tx.date.split("T")[0],
    });
    setEditTouched({});
    setDeleteConfirmId(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditState(null); setEditTouched({}); };

  const saveEdit = async (tx: Transaction) => {
    if (!editState) return;
    setEditTouched({ description: true, amount: true });
    if (!isValid(editErrors)) return;
    try {
      await apiRequest(`/api/transactions/${tx.transaction_id}`, {
        token, method: "PUT",
        body: {
          description: editState.description.trim(),
          category_id: editState.category_id,
          amount: parseFloat(editState.amount),
          type: editState.type,
          account_id: editState.account_id,
          date: toLocalISOString(editState.date),
        },
      });
      cancelEdit();
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update transaction.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="transactions-page">
      <div className="oval" />
      <h1 className="page-title">Transactions</h1>

      {error && (
        <div style={{ background: "#1a0f0f", border: "1px solid #3d1515", color: "#f87171", padding: "8px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="transactions-layout">
        {/* ── LEFT COLUMN ── */}
        <div className="left-col">
          <div className="card add-card">
            <div className="add-card-header"><h2>Add transaction</h2></div>
            <p className="add-card-sub">Quick add manually</p>

            <div className="type-toggle">
              <button className={`type-btn ${activeType === "income" ? "active-income" : ""}`} onClick={() => setActiveType("income")}>+ Income</button>
              <button className={`type-btn ${activeType === "expense" ? "active-expense" : ""}`} onClick={() => setActiveType("expense")}>X Expense</button>
            </div>

            <div className="amount-display">
              $<input
                className={`amount-input ${addTouched.amount && addErrors.amount ? "input-error" : ""}`}
                type="number" placeholder="0.00" min="0.01" max="999999.99"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onBlur={() => setAddTouched(t => ({ ...t, amount: true }))}
              />
            </div>
            {addTouched.amount && addErrors.amount && <p className="field-error">{addErrors.amount}</p>}

            <div className="form-field">
              <input
                className={`field-input ${addTouched.description && addErrors.description ? "input-error" : ""}`}
                placeholder="Merchant or note" maxLength={50}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => setAddTouched(t => ({ ...t, description: true }))}
              />
            </div>
            {addTouched.description && addErrors.description && <p className="field-error">{addErrors.description}</p>}

            <div className="form-field">
              <select className="field-input" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                {accounts.length === 0
                  ? <option value="">No accounts found</option>
                  : accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
              </select>
            </div>

            <div className="form-field">
              <select className="field-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {categories.length === 0
                  ? <option value="">No categories found</option>
                  : categories.map(c => <option key={c._id} value={c._id}>{c.icon || "💳"} {c.category_name}</option>)}
              </select>
            </div>

            <div className="form-field">
              <input className="field-input field-input--date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={submitting || (addTouched.description && addTouched.amount ? !isValid(addErrors) : false)}
            >
              {submitting ? "Adding…" : "Confirm"}
            </button>
          </div>

          {/* Monthly Summary */}
          <div className="card summary-card">
            <h2>Monthly summary</h2>
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-amount income">${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                <span className="summary-label">Income</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="summary-amount expense">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                <span className="summary-label">Expenses</span>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${net >= 0 ? netPct : Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%`, background: net >= 0 ? 'linear-gradient(90deg, #13AC24, #10B981)' : 'linear-gradient(90deg, #EF4444, #DC2626)' }} />
            </div>
          </div>

          {/* Categories */}
          <div className="card categories-card">
            <div className="categories-card-header">
              <div>
                <h2>Categories</h2>
                <p className="categories-card-sub">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
              </div>
              <button className="manage-categories-btn" onClick={() => setShowCategoryModal(true)}>⚙️ Manage</button>
            </div>
            <div className="category-chips">
              {categories.slice(0, 6).map(c => (
                <span key={c._id} className="category-chip">{c.icon || "💳"} {c.category_name}</span>
              ))}
              {categories.length > 6 && <span className="category-chip category-chip--more">+{categories.length - 6} more</span>}
              {categories.length === 0 && <span className="category-chip category-chip--empty">No categories yet</span>}
            </div>
          </div>
        </div>

        {/* ── RIGHT: History ── */}
        <div className="card history-card">
          <div className="history-header">
            <h2>History</h2>
            <div className="history-controls">
              <div className="search-box">
                <span>🔍</span>
                <input placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <button className={`filter-btn ${showFilters ? "filter-btn--active" : ""}`} onClick={() => setShowFilters(f => !f)}>
                ⚙ Filters{hasActiveFilters ? " ●" : ""}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Type</label>
                  <div className="filter-type-btns">
                    {(["all", "income", "expense"] as const).map(t => (
                      <button key={t} className={`filter-type-btn ${filterType === t ? `filter-type-btn--${t}` : ""}`} onClick={() => { setFilterType(t); setPage(1); }}>
                        {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Category</label>
                  <select className="filter-select" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
                    <option value="all">All categories</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.icon || "💳"} {c.category_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Date from</label>
                  <input type="date" className="filter-input field-input--date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Date to</label>
                  <input type="date" className="filter-input field-input--date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Min amount ($)</label>
                  <input type="number" className="filter-input" placeholder="0" min="0" value={filterAmountMin} onChange={e => { setFilterAmountMin(e.target.value); setPage(1); }} />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Max amount ($)</label>
                  <input type="number" className="filter-input" placeholder="∞" min="0" value={filterAmountMax} onChange={e => { setFilterAmountMax(e.target.value); setPage(1); }} />
                </div>
              </div>
              {hasActiveFilters && <button className="filter-clear-btn" onClick={clearFilters}>✕ Clear filters</button>}
            </div>
          )}

          <p className="history-sub">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtered)" : ""}
          </p>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>Loading transactions…</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Date ↕</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(tx => (
                  <TransactionRow
                    key={tx.transaction_id}
                    tx={tx}
                    accounts={accounts}
                    categories={categories}
                    isEditing={editingId === tx.transaction_id}
                    editState={editState}
                    editErrors={editErrors}
                    editTouched={editTouched}
                    isConfirmingDelete={deleteConfirmId === tx.transaction_id}
                    onEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onEditChange={setEditState}
                    onEditBlur={field => setEditTouched(t => ({ ...t, [field]: true }))}
                    onDeleteRequest={setDeleteConfirmId}
                    onDeleteConfirm={handleDelete}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                    editFormValid={isValid(editErrors)}
                  />
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {search || hasActiveFilters ? "No transactions match your filters." : "No transactions yet. Add one above!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            <span>{page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>

      {showCategoryModal && userId && (
        <CategoryModal
          userId={userId}
          token={token ?? null}
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onChanged={fetchCategories}
        />
      )}
    </div>
  );
}
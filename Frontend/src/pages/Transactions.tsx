import { useState, useMemo, useEffect, useCallback } from "react";
import "../style/Transactions.css";
import { useAuth } from "../api/useAuth";
import { apiRequest } from "../api/axios";

// ── Types ─────────────────────────────────────────────────────────────────────
type TransactionType = "income" | "expense";

interface Account {
  account_id: string;
  account_name: string;
  balance: number;
}

interface Category {
  _id: string;
  category_id?: string;
  category_name: string;
  icon?: string; // ✅ NEW
}

interface Transaction {
  _id: string;
  transaction_id: string;
  account_id: string;
  category_id: string;
  description?: string;
  amount: number;
  type: TransactionType;
  date: string;
}

interface EditState {
  description: string;
  category_id: string;
  amount: string;
  type: TransactionType;
  account_id: string;
}

interface FieldErrors {
  description?: string;
  amount?: string;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateDescription(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Description is required.";
  if (v.length < 2) return "Must be at least 2 characters.";
  if (v.length > 50) return "Must be 50 characters or fewer.";
  return undefined;
}

function validateAmount(raw: string): string | undefined {
  const n = parseFloat(raw);
  if (!raw || isNaN(n)) return "Amount is required.";
  if (n <= 0) return "Amount must be greater than 0.";
  if (n >= 1_000_000) return "Amount must be less than 1,000,000.";
  return undefined;
}

function validate(description: string, amount: string): FieldErrors {
  return {
    description: validateDescription(description),
    amount: validateAmount(amount),
  };
}

function isValid(errors: FieldErrors): boolean {
  return !errors.description && !errors.amount;
}

const ICON_OPTIONS = [
  "🍽️","🛒","🏦","💳","🎬",
  "☕","📦","⛽","🏠","✈️",
  "🎮","💡","📚","❤️","🧾"
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

// ── LocalStorage helpers for category icons (frontend-only persistence) ──────
function getCategoryIcons(): Record<string, string> {
  try {
    const stored = localStorage.getItem("categoryIcons");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCategoryIcon(categoryName: string, icon: string): void {
  const icons = getCategoryIcons();
  icons[categoryName] = icon;
  localStorage.setItem("categoryIcons", JSON.stringify(icons));
}

function applyStoredIcons(categories: Category[]): Category[] {
  const icons = getCategoryIcons();
  return categories.map(cat => ({
    ...cat,
    icon: icons[cat.category_name] || cat.icon || "💳",
  }));
}


// ── Category Manager Modal ────────────────────────────────────────────────────
function CategoryModal({
  userId,
  token,
  categories,
  onClose,
  onChanged,
}: {
  userId: string;
  token: string | null;
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("💳"); // ✅ NEW
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [renameIcon, setRenameIcon] = useState("💳"); // ✅ NEW
  const [renameErr, setRenameErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ── Create ─────────────────────────────
  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return setCreateErr("Name is required.");
    if (name.length < 2) return setCreateErr("At least 2 characters.");
    if (name.length > 30) return setCreateErr("Max 30 characters.");

    setCreating(true);
    setCreateErr(null);

    try {
      await apiRequest("/api/categories/create", {
        token,
        method: "POST",
        body: {
          user_id: userId,
          category_name: name,
          icon: newIcon, // ✅ NEW
        },
      });

      // ✅ Save icon to localStorage for frontend persistence
      saveCategoryIcon(name, newIcon);

      setNewName("");
      setNewIcon("💳");
      onChanged();
    } catch (e: any) {
      setCreateErr(e?.message ?? "Failed to create category.");
    } finally {
      setCreating(false);
    }
  };

  // ── Rename ─────────────────────────────
  const startRename = (cat: Category) => {
    setRenamingId(cat._id);
    setRenameVal(cat.category_name);
    setRenameIcon(cat.icon || "💳"); // ✅ load existing
    setRenameErr(null);
    setConfirmId(null);
  };

  const saveRename = async (cat: Category) => {
    const name = renameVal.trim();
    if (!name) return setRenameErr("Name is required.");
    if (name.length < 2) return setRenameErr("At least 2 characters.");
    if (name.length > 30) return setRenameErr("Max 30 characters.");

    setSavingId(cat._id);
    setRenameErr(null);

    try {
      await apiRequest(`/api/categories/${cat._id}`, {
        token,
        method: "PUT",
        body: {
          category_name: name,
          icon: renameIcon, // ✅ NEW
        },
      });

      // ✅ Save icon to localStorage for frontend persistence
      saveCategoryIcon(name, renameIcon);

      setRenamingId(null);
      onChanged();
    } catch (e: any) {
      setRenameErr(e?.message ?? "Failed to rename.");
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete ─────────────────────────────
  const handleDelete = async (cat: Category) => {
    setDeletingId(cat._id);
    try {
      await apiRequest(`/api/categories/${cat._id}`, {
        token,
        method: "DELETE",
      });
      setConfirmId(null);
      onChanged();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cat-overlay" onClick={onClose}>
      <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="cat-modal-header">
          <div>
            <h2>Categories</h2>
            <p className="cat-modal-sub">Manage your transaction categories</p>
          </div>
          <button className="cat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* CREATE SECTION */}
        <div className="cat-create">
          <input
            type="text"
            className="cat-name-input"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreate()}
          />
          
          {/* ICON PICKER */}
          <div className="cat-icon-picker">
            {ICON_OPTIONS.map(icon => (
              <button
                key={icon}
                className={newIcon === icon ? "active" : ""}
                onClick={() => setNewIcon(icon)}
                type="button"
              >
                {icon}
              </button>
            ))}
          </div>

          {createErr && <div className="cat-err">{createErr}</div>}

          <button 
            className="cat-add-btn" 
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? "Creating…" : "+ Add Category"}
          </button>
        </div>

        {/* DIVIDER */}
        <div className="cat-divider"></div>

        {/* LIST */}
        {categories.length === 0 ? (
          <p className="cat-empty">No categories yet. Create one to get started!</p>
        ) : (
          <div className="cat-list">
            {categories.map(cat => {
              const isEditing = renamingId === cat._id;
              const isConfirming = confirmId === cat._id;

              return (
                <div key={cat._id} className={`cat-row ${isEditing ? "cat-row--editing" : ""}`}>
                  
                  {/* ICON */}
                  <div className="cat-row-icon">{cat.icon || "💳"}</div>

                  {isEditing ? (
                    <>
                      {/* RENAME MODE */}
                      <div className="cat-rename-group">
                        <input
                          type="text"
                          className="cat-rename-input"
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && saveRename(cat)}
                        />
                        
                        {/* ICON PICKER EDIT */}
                        <div className="cat-icon-picker">
                          {ICON_OPTIONS.map(icon => (
                            <button
                              key={icon}
                              className={renameIcon === icon ? "active" : ""}
                              onClick={() => setRenameIcon(icon)}
                              type="button"
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        
                        {renameErr && <div className="cat-err cat-err--inline">{renameErr}</div>}
                      </div>

                      {/* ACTION BUTTONS - SAVE/CANCEL */}
                      <div className="cat-row-actions">
                        <button
                          className="cat-action-btn cat-action-btn--save"
                          onClick={() => saveRename(cat)}
                          disabled={savingId === cat._id}
                          type="button"
                        >
                          ✓
                        </button>
                        <button
                          className="cat-action-btn cat-action-btn--cancel"
                          onClick={() => setRenamingId(null)}
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* VIEW MODE */}
                      <div className="cat-row-name">{cat.category_name}</div>

                      {/* ACTION BUTTONS - EDIT/DELETE */}
                      <div className="cat-row-actions">
                        <button
                          className="cat-action-btn cat-action-btn--edit"
                          onClick={() => startRename(cat)}
                          type="button"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="cat-action-btn cat-action-btn--delete"
                          onClick={() => setConfirmId(cat._id)}
                          type="button"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>

                      {/* CONFIRM DELETE */}
                      {isConfirming && (
                        <div className="cat-row-actions">
                          <span className="cat-confirm-text">Confirm?</span>
                          <button
                            className="cat-action-btn cat-action-btn--confirm"
                            onClick={() => handleDelete(cat)}
                            disabled={deletingId === cat._id}
                            type="button"
                          >
                            ✓
                          </button>
                          <button
                            className="cat-action-btn cat-action-btn--cancel"
                            onClick={() => setConfirmId(null)}
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Transactions() {
  const { user, token } = useAuth();
  const userId = (user as any)?.user_id;

  // ── Remote data ───────────────────────────────────────────────────────────
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ── Category modal ────────────────────────────────────────────────────────
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // ── Add-form state ────────────────────────────────────────────────────────
  const [activeType, setActiveType]         = useState<TransactionType>("expense");
  const [amount, setAmount]                 = useState("");
  const [description, setDescription]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount]   = useState("");
  const [date, setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [addTouched, setAddTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const addErrors = useMemo(() => validate(description, amount), [description, amount]);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editState, setEditState]     = useState<EditState | null>(null);
  const [editTouched, setEditTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const editErrors = useMemo(
    () => (editState ? validate(editState.description, editState.amount) : {}),
    [editState]
  );

  // ── Delete state ──────────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Search / pagination ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const perPage = 7;

  // ── Fetch everything ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const accRaw = await apiRequest<any>(`/api/accounts/user/${userId}`, { token });
      const accs = unwrapArray<Account>(accRaw);
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccount) setSelectedAccount(accs[0].account_id);

      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      const cats = unwrapArray<Category>(catRaw);
      // ✅ Apply stored icons from localStorage
      const catsWithIcons = applyStoredIcons(cats);
      setCategories(catsWithIcons);
      if (catsWithIcons.length > 0 && !selectedCategory) setSelectedCategory(catsWithIcons[0].category_name);

      const txArrays = await Promise.all(
        accs.map(async (acc) => {
          try {
            const raw = await apiRequest<any>(
              `/api/transactions/account/${acc.account_id}`, { token }
            );
            return unwrapArray<Transaction>(raw);
          } catch { return []; }
        })
      );
      setTransactions(
        txArrays.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Re-fetch only categories (used after modal changes)
  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    try {
      const catRaw = await apiRequest<any>(`/api/categories/${userId}`, { token });
      const cats = unwrapArray<Category>(catRaw);
      // ✅ Apply stored icons from localStorage
      const catsWithIcons = applyStoredIcons(cats);
      setCategories(catsWithIcons);
    } catch { /* silently ignore */ }
  }, [userId, token]);

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalIncome   = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // ── Filtered + paginated ──────────────────────────────────────────────────
  const filtered = transactions.filter(t =>
    (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    t.category_id.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Create transaction ────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setAddTouched({ description: true, amount: true });
    if (!isValid(addErrors)) return;
    if (!selectedAccount) { setError("Please select an account."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/api/transactions/create", {
        token,
        method: "POST",
        body: {
          account_id:  selectedAccount,
          category_id: selectedCategory || "Other",
          type:        activeType,
          amount:      parseFloat(amount),
          date:        new Date(date).toISOString(),
          description: description.trim(),
        },
      });
      setDescription("");
      setAmount("");
      setAddTouched({});
      setPage(1);
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete transaction ────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/transactions/${id}`, { token, method: "DELETE" });
      setDeleteConfirmId(null);
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete transaction.");
    }
  };

  // ── Edit transaction ──────────────────────────────────────────────────────
  const startEdit = (tx: Transaction) => {
    setEditingId(tx.transaction_id);
    setEditState({
      description: tx.description ?? "",
      category_id: tx.category_id,
      amount:      String(tx.amount),
      type:        tx.type,
      account_id:  tx.account_id,
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
        token,
        method: "PUT",
        body: {
          description: editState.description.trim(),
          category_id: editState.category_id,
          amount:      parseFloat(editState.amount),
          type:        editState.type,
          account_id:  editState.account_id,
        },
      });
      setEditingId(null);
      setEditState(null);
      setEditTouched({});
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update transaction.");
    }
  };

  const addFormValid  = isValid(addErrors);
  const editFormValid = isValid(editErrors);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="transactions-page">
      <div className="oval" />
      <h1 className="page-title">Transactions</h1>

      {error && (
        <div style={{ background: "#1a0f0f", border: "1px solid #3d1515", color: "#f87171", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div className="transactions-layout">

        {/* ── LEFT: Add Transaction ──────────────────────────────────────── */}
        <div className="left-col">
          <div className="card add-card">
            <div className="add-card-header">
              <h2>Add transaction</h2>
            </div>
            <p className="add-card-sub">Quick add manually</p>

            <div className="type-toggle">
              <button className={`type-btn ${activeType === "income" ? "active-income" : ""}`} onClick={() => setActiveType("income")}>⊕ Income</button>
              <button className={`type-btn ${activeType === "expense" ? "active-expense" : ""}`} onClick={() => setActiveType("expense")}>⊖ Expense</button>
            </div>

            {/* Amount */}
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

            {/* Description */}
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

            {/* Account dropdown */}
            <div className="form-field">
              <select className="field-input" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                {accounts.length === 0
                  ? <option value="">No accounts found</option>
                  : accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)
                }
              </select>
            </div>

            {/* Category dropdown */}
            <div className="form-field">
              <select className="field-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {categories.length === 0
                  ? <option value="">No categories found</option>
                  : categories.map(c => (
                    <option key={c._id} value={c.category_name}>
                      {c.icon || "💳"} {c.category_name}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Date */}
            <div className="form-field">
              <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={submitting || (addTouched.description && addTouched.amount ? !addFormValid : false)}
            >
              {submitting ? "Adding…" : "Confirm"}
            </button>
          </div>

          {/* Monthly Summary */}
          <div className="card summary-card">
            <h2>Monthly summary</h2>
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-amount income">
                  ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="summary-label">Income</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="summary-amount expense">
                  ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="summary-label">Expenses</span>
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* ── Manage Categories ──────────────────────────────────────── */}
          <div className="card categories-card">
            <div className="categories-card-header">
              <div>
                <h2>Categories</h2>
                <p className="categories-card-sub">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
              </div>
              <button
                className="manage-categories-btn"
                onClick={() => setShowCategoryModal(true)}
              >
                ⊕ Manage
              </button>
            </div>

            {/* Mini category chips */}
            <div className="category-chips">
              {categories.slice(0, 6).map(c => (
                <span key={c._id} className="category-chip">
                  {c.icon || "💳"} {c.category_name}
                </span>
              ))}
              {categories.length > 6 && (
                <span className="category-chip category-chip--more">+{categories.length - 6} more</span>
              )}
              {categories.length === 0 && (
                <span className="category-chip category-chip--empty">No categories yet</span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: History ─────────────────────────────────────────────── */}
        <div className="card history-card">
          <div className="history-header">
            <h2>History</h2>
            <div className="history-controls">
              <div className="search-box">
                <span>🔍</span>
                <input
                  placeholder="Search"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <button className="filter-btn">⚙ Filters</button>
            </div>
          </div>
          <p className="history-sub">Showing all transactions</p>

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
                {paginated.map(tx => {
                  const isEditing          = editingId === tx.transaction_id;
                  const isConfirmingDelete = deleteConfirmId === tx.transaction_id;
                  const accountName        = accounts.find(a => a.account_id === tx.account_id)?.account_name ?? "—";
                  const icon = categories.find(c => c.category_name === tx.category_id)?.icon || "💳";
                  const isIncome           = tx.type === "income";

                  return (
                    <tr key={tx.transaction_id} className={isEditing ? "row-editing" : ""}>

                      {/* Description / edit */}
                      <td>
                        {isEditing && editState ? (
                          <div className="edit-name-cell">
                            <input
                              className={`edit-inline-input ${editTouched.description && editErrors.description ? "input-error" : ""}`}
                              value={editState.description} maxLength={50} placeholder="Description"
                              onChange={e => setEditState({ ...editState, description: e.target.value })}
                              onBlur={() => setEditTouched(t => ({ ...t, description: true }))}
                            />
                            {editTouched.description && editErrors.description && (
                              <p className="field-error field-error--inline">{editErrors.description}</p>
                            )}
                            <select
                              className="edit-inline-select"
                              value={editState.category_id}
                              onChange={e => setEditState({ ...editState, category_id: e.target.value })}
                            >
                              {categories.map(c => (
                                <option key={c._id} value={c.category_name}>{c.category_name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="tx-name-cell">
                            <span className="tx-icon" style={{ background: isIncome ? "#10B98122" : "#EF444422", color: isIncome ? "#10B981" : "#EF4444" }}>
                              {icon}
                            </span>
                            <div>
                              <div className="tx-name">{tx.description || (isIncome ? "Income" : "Expense")}</div>
                              <div className="tx-category">{tx.category_id}</div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Account */}
                      <td>
                        {isEditing && editState ? (
                          <select
                            className="edit-inline-select"
                            value={editState.account_id}
                            onChange={e => setEditState({ ...editState, account_id: e.target.value })}
                          >
                            {accounts.map(a => (
                              <option key={a.account_id} value={a.account_id}>{a.account_name}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: 13, color: "#6B7280" }}>{accountName}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="tx-date">{fmtDate(tx.date)}</td>

                      {/* Amount */}
                      <td className={`tx-amount ${isIncome ? "positive" : "negative"}`}>
                        {isEditing && editState ? (
                          <div className="edit-amount-cell">
                            <select
                              className="edit-inline-select edit-type-select"
                              value={editState.type}
                              onChange={e => setEditState({ ...editState, type: e.target.value as TransactionType })}
                            >
                              <option value="income">+ Income</option>
                              <option value="expense">− Expense</option>
                            </select>
                            <input
                              className={`edit-inline-input edit-amount-input ${editTouched.amount && editErrors.amount ? "input-error" : ""}`}
                              type="number" min="0.01" max="999999.99"
                              value={editState.amount}
                              onChange={e => setEditState({ ...editState, amount: e.target.value })}
                              onBlur={() => setEditTouched(t => ({ ...t, amount: true }))}
                            />
                            {editTouched.amount && editErrors.amount && (
                              <p className="field-error field-error--inline">{editErrors.amount}</p>
                            )}
                          </div>
                        ) : (
                          isIncome
                            ? `+$${Number(tx.amount).toFixed(2)}`
                            : `-$${Number(tx.amount).toFixed(2)}`
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        {isConfirmingDelete ? (
                          <div className="action-confirm">
                            <span className="confirm-text">Delete?</span>
                            <button className="action-btn delete-confirm-btn" onClick={() => handleDelete(tx.transaction_id)}>✓</button>
                            <button className="action-btn cancel-btn" onClick={() => setDeleteConfirmId(null)}>✕</button>
                          </div>
                        ) : isEditing ? (
                          <div className="action-group">
                            <button className="action-btn save-btn" onClick={() => saveEdit(tx)} disabled={editTouched.description && editTouched.amount ? !editFormValid : false}>✓</button>
                            <button className="action-btn cancel-btn" onClick={cancelEdit}>✕</button>
                          </div>
                        ) : (
                          <div className="action-group">
                            <button className="action-btn edit-btn" onClick={() => startEdit(tx)} title="Edit">✎</button>
                            <button className="action-btn delete-btn" onClick={() => setDeleteConfirmId(tx.transaction_id)} title="Delete">🗑</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {search ? "No transactions match your search." : "No transactions yet. Add one above!"}
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

      {/* ── Category Manager Modal ──────────────────────────────────────── */}
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
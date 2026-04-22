<<<<<<< Updated upstream
export default function Transactions() {
  return (
    <div>
      <h1>Transactions</h1>
      <p>View and manage your transactions here.</p>
=======
import { useState, useMemo } from "react";
import "../style/Transactions.css";
import { useAuth } from "../api/useAuth";
import { apiRequest } from "../api/axios";
import { useTransactions } from "../hooks/useTransactions";
import CategoryModal from "../components/transactions/CategoryModal";
import AddTransactionForm from "../components/transactions/AddTransactionForm";
import TransactionRow from "../components/transactions/TransactionRow";
import type { EditState, FieldErrors, Transaction, CreateTransactionPayload } from "../types/transactions";
import { validate } from "../utils/transactionUtils";

export default function Transactions() {
  const { user, token } = useAuth();
  const userId = (user as any)?.user_id;

  const { accounts, categories, transactions, loading, error, setError, fetchAll, fetchCategories } =
    useTransactions(userId, token);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Edit state 
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editState, setEditState]     = useState<EditState | null>(null);
  const [editTouched, setEditTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const editErrors = useMemo(
    () => (editState ? validate(editState.description, editState.amount) : {}),
    [editState]
  );

  // Delete state 
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const perPage = 7;

  // Derived totals 
  const totalIncome   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // Filtered
  const filtered = transactions.filter((t) =>
    (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    t.category_id.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  // Create transaction 
  const handleSubmit = async (payload: CreateTransactionPayload) => {
    await apiRequest("/api/transactions/create", {
      token,
      method: "POST",
      body: payload,
    });
    setPage(1);
    await fetchAll();
  };

  // Edit handlers
  const startEdit = (tx: Transaction) => {
    setEditingId(tx.transaction_id);
    setEditState({
      description:   tx.description ?? "",
      category_id:   tx.category_id,
      amount:        String(tx.amount),
      type:          tx.type,
      account_id:    tx.account_id,
      to_account_id: tx.to_account_id ?? "",
    });
    setEditTouched({});
    setDeleteConfirmId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
    setEditTouched({});
  };

  const saveEdit = async (tx: Transaction) => {
    if (!editState) return;
    setEditTouched({ description: true, amount: true });
    if (!editState.description.trim() || !editState.amount) return;
    try {
      await apiRequest(`/api/transactions/${tx.transaction_id}`, {
        token,
        method: "PUT",
        body: {
          description:   editState.description.trim(),
          category_id:   editState.category_id,
          amount:        parseFloat(editState.amount),
          type:          editState.type,
          account_id:    editState.account_id,
          to_account_id: editState.type === "transfer" ? editState.to_account_id : null,
        },
      });
      cancelEdit();
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update transaction.");
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/transactions/${id}`, { token, method: "DELETE" });
      setDeleteConfirmId(null);
      await fetchAll();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete transaction.");
    }
  };


  // create page
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

        {/* ── LEFT: Add form + summary + categories ──────────────────────── */}
        <div className="left-col">
          <AddTransactionForm
            accounts={accounts}
            categories={categories}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            onSubmit={handleSubmit}
            onManageCategories={() => setShowCategoryModal(true)}
          />
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
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                {paginated.map((tx) => (
                  <TransactionRow
                    key={tx.transaction_id}
                    tx={tx}
                    accounts={accounts}
                    categories={categories}
                    isEditing={editingId === tx.transaction_id}
                    editState={editState}
                    editTouched={editTouched}
                    editErrors={editErrors}
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onEditStateChange={setEditState}
                    onEditTouch={(field) => setEditTouched((t) => ({ ...t, [field]: true }))}
                    isConfirmingDelete={deleteConfirmId === tx.transaction_id}
                    onDeleteRequest={setDeleteConfirmId}
                    onDeleteConfirm={handleDelete}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                  />
                ))}
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            <span>{page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
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
>>>>>>> Stashed changes
    </div>
  )
}

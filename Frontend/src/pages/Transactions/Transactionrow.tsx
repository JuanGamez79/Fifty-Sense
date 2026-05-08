import type { Transaction, Account, Category, EditState, FieldErrors, TransactionType } from "./Types";
import { fmtDate } from "./Utils";

interface Props {
  tx: Transaction;
  accounts: Account[];
  categories: Category[];
  isEditing: boolean;
  editState: EditState | null;
  editErrors: FieldErrors;
  editTouched: Partial<Record<keyof FieldErrors, boolean>>;
  isConfirmingDelete: boolean;
  onEdit: (tx: Transaction) => void;
  onCancelEdit: () => void;
  onSaveEdit: (tx: Transaction) => void;
  onEditChange: (state: EditState) => void;
  onEditBlur: (field: keyof FieldErrors) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  editFormValid: boolean;
}

export default function TransactionRow({
  tx, accounts, categories,
  isEditing, editState, editErrors, editTouched,
  isConfirmingDelete,
  onEdit, onCancelEdit, onSaveEdit,
  onEditChange, onEditBlur,
  onDeleteRequest, onDeleteConfirm, onDeleteCancel,
  editFormValid,
}: Props) {
  const accountName = accounts.find(a => a.account_id === tx.account_id)?.account_name ?? "—";
  const cat = categories.find(c => c._id === tx.category_id)
           ?? categories.find(c => c.category_name === tx.category_id);
  const icon    = cat?.icon || "💳";
  const catName = cat?.category_name ?? tx.category_id;
  const isIncome = tx.type === "income";

  // ── Edit mode: filter-panel-style inline form ────────────────────────────
  if (isEditing && editState) {
    return (
      <tr className="row-editing">
        <td colSpan={5} className="edit-panel-cell">
          <div className="edit-panel">
            {/* Row 1: description + category + type */}
            <div className="edit-panel-row">
              <div className="edit-panel-group edit-panel-group--grow">
                <label className="edit-panel-label">Description</label>
                <input
                  className={`edit-panel-input ${editTouched.description && editErrors.description ? "input-error" : ""}`}
                  value={editState.description}
                  maxLength={50}
                  placeholder="Merchant or note"
                  onChange={e => onEditChange({ ...editState, description: e.target.value })}
                  onBlur={() => onEditBlur("description")}
                />
                {editTouched.description && editErrors.description && (
                  <p className="field-error">{editErrors.description}</p>
                )}
              </div>

              <div className="edit-panel-group">
                <label className="edit-panel-label">Category</label>
                <select
                  className="edit-panel-select"
                  value={editState.category_id}
                  onChange={e => onEditChange({ ...editState, category_id: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.icon || "💳"} {c.category_name}</option>
                  ))}
                </select>
              </div>

              <div className="edit-panel-group">
                <label className="edit-panel-label">Type</label>
                <div className="filter-type-btns">
                  {(["income", "expense"] as TransactionType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`filter-type-btn ${editState.type === t ? `filter-type-btn--${t}` : ""}`}
                      onClick={() => onEditChange({ ...editState, type: t })}
                    >
                      {t === "income" ? "+ Income" : "X Expense"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: account + date + amount + actions */}
            <div className="edit-panel-row">
              <div className="edit-panel-group">
                <label className="edit-panel-label">Account</label>
                <select
                  className="edit-panel-select"
                  value={editState.account_id}
                  onChange={e => onEditChange({ ...editState, account_id: e.target.value })}
                >
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>{a.account_name}</option>
                  ))}
                </select>
              </div>

              <div className="edit-panel-group">
                <label className="edit-panel-label">Date</label>
                <input
                  type="date"
                  className="edit-panel-input field-input--date"
                  value={editState.date}
                  onChange={e => onEditChange({ ...editState, date: e.target.value })}
                />
              </div>

              <div className="edit-panel-group">
                <label className="edit-panel-label">Amount ($)</label>
                <input
                  type="number"
                  className={`edit-panel-input ${editTouched.amount && editErrors.amount ? "input-error" : ""}`}
                  min="0.01" max="999999.99"
                  value={editState.amount}
                  onChange={e => onEditChange({ ...editState, amount: e.target.value })}
                  onBlur={() => onEditBlur("amount")}
                />
                {editTouched.amount && editErrors.amount && (
                  <p className="field-error">{editErrors.amount}</p>
                )}
              </div>

              <div className="edit-panel-group edit-panel-group--actions">
                <label className="edit-panel-label">&nbsp;</label>
                <div className="action-group">
                  <button
                    className="action-btn save-btn"
                    onClick={() => onSaveEdit(tx)}
                    disabled={editTouched.description && editTouched.amount ? !editFormValid : false}
                  >✓</button>
                  <button className="action-btn cancel-btn" onClick={onCancelEdit}>✕</button>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // ── View mode ─────────────────────────────────────────────────────────────
  return (
    <tr>
      <td>
        <div className="tx-name-cell">
          <span className="tx-icon" style={{ background: isIncome ? "#10B98122" : "#EF444422", color: isIncome ? "#10B981" : "#EF4444" }}>
            {icon}
          </span>
          <div>
            <div className="tx-name">{tx.description || (isIncome ? "Income" : "Expense")}</div>
            <div className="tx-category">{catName}</div>
          </div>
        </div>
      </td>
      <td><span style={{ fontSize: 12, color: "#6B7280" }}>{accountName}</span></td>
      <td className="tx-date">{fmtDate(tx.date)}</td>
      <td className={`tx-amount ${isIncome ? "positive" : "negative"}`}>
        {isIncome ? `+$${Number(tx.amount).toFixed(2)}` : `-$${Number(tx.amount).toFixed(2)}`}
      </td>
      <td>
        {isConfirmingDelete ? (
          <div className="action-confirm">
            <span className="confirm-text">Delete?</span>
            <button className="action-btn delete-confirm-btn" onClick={() => onDeleteConfirm(tx.transaction_id)}>✓</button>
            <button className="action-btn cancel-btn" onClick={onDeleteCancel}>✕</button>
          </div>
        ) : (
          <div className="action-group">
            <button className="action-btn edit-btn" onClick={() => onEdit(tx)} title="Edit">✎</button>
            <button className="action-btn delete-btn" onClick={() => onDeleteRequest(tx.transaction_id)} title="Delete">🗑</button>
          </div>
        )}
      </td>
    </tr>
  );
}
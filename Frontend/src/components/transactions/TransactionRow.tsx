import type { Account, Category, EditState, FieldErrors, Transaction, TransactionType } from "../../types/transactions";
import { fmtDate, isValid } from "../../utils/transactionUtils";

interface Props {
  tx: Transaction;
  accounts: Account[];
  categories: Category[];
  // Edit
  isEditing: boolean;
  editState: EditState | null;
  editTouched: Partial<Record<keyof FieldErrors, boolean>>;
  editErrors: FieldErrors;
  onStartEdit: (tx: Transaction) => void;
  onCancelEdit: () => void;
  onSaveEdit: (tx: Transaction) => void;
  onEditStateChange: (next: EditState) => void;
  onEditTouch: (field: keyof FieldErrors) => void;
  // Delete
  isConfirmingDelete: boolean;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

export default function TransactionRow({
  tx, accounts, categories,
  isEditing, editState, editTouched, editErrors,
  onStartEdit, onCancelEdit, onSaveEdit, onEditStateChange, onEditTouch,
  isConfirmingDelete, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: Props) {
  const accountName = accounts.find((a) => a.account_id === tx.account_id)?.account_name ?? "—";
  const icon        = categories.find((c) => c.category_name === tx.category_id)?.icon || "💳";
  const isIncome    = tx.type === "income";
  const isTransfer  = tx.type === "transfer";
  const toAccName   = tx.to_account_id
    ? accounts.find((a) => a.account_id === tx.to_account_id)?.account_name
    : null;

  const editFormValid = isValid(editErrors);

  return (
    <tr className={isEditing ? "row-editing" : ""}>

      {/* Description */}
      <td>
        {isEditing && editState ? (
          <div className="edit-name-cell">
            <input
              className={`edit-inline-input ${editTouched.description && editErrors.description ? "input-error" : ""}`}
              value={editState.description} maxLength={50} placeholder="Description"
              onChange={(e) => onEditStateChange({ ...editState, description: e.target.value })}
              onBlur={() => onEditTouch("description")}
            />
            {editTouched.description && editErrors.description && (
              <p className="field-error field-error--inline">{editErrors.description}</p>
            )}
            <select
              className="edit-inline-select"
              value={editState.category_id}
              onChange={(e) => onEditStateChange({ ...editState, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c._id} value={c.category_name}>{c.category_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="tx-name-cell">
            <span className="tx-icon" style={{
              background: isTransfer ? "#1e2a3a" : isIncome ? "#10B98122" : "#EF444422",
              color:      isTransfer ? "#3D8EFF"  : isIncome ? "#10B981"   : "#EF4444",
            }}>
              {isTransfer ? "⇄" : icon}
            </span>
            <div>
              <div className="tx-name">
                {tx.description || (isTransfer ? "Transfer" : isIncome ? "Income" : "Expense")}
              </div>
              <div className="tx-category">
                {isTransfer && toAccName ? `→ ${toAccName}` : tx.category_id}
              </div>
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
            onChange={(e) => onEditStateChange({ ...editState, account_id: e.target.value })}
          >
            {accounts.map((a) => (
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
      <td className={`tx-amount ${isTransfer ? "transfer" : isIncome ? "positive" : "negative"}`}>
        {isEditing && editState ? (
          <div className="edit-amount-cell">
            <select
              className="edit-inline-select edit-type-select"
              value={editState.type}
              onChange={(e) => onEditStateChange({ ...editState, type: e.target.value as TransactionType })}
            >
              <option value="income">+ Income</option>
              <option value="expense">− Expense</option>
              <option value="transfer">⇄ Transfer</option>
            </select>
            {editState.type === "transfer" && (
              <select
                className="edit-inline-select"
                value={editState.to_account_id}
                onChange={(e) => onEditStateChange({ ...editState, to_account_id: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>To: {a.account_name}</option>
                ))}
              </select>
            )}
            <input
              className={`edit-inline-input edit-amount-input ${editTouched.amount && editErrors.amount ? "input-error" : ""}`}
              type="number" min="0.01" max="999999.99"
              value={editState.amount}
              onChange={(e) => onEditStateChange({ ...editState, amount: e.target.value })}
              onBlur={() => onEditTouch("amount")}
            />
            {editTouched.amount && editErrors.amount && (
              <p className="field-error field-error--inline">{editErrors.amount}</p>
            )}
          </div>
        ) : (
          isTransfer
            ? `⇄ $${Number(tx.amount).toFixed(2)}`
            : isIncome
              ? `+$${Number(tx.amount).toFixed(2)}`
              : `-$${Number(tx.amount).toFixed(2)}`
        )}
      </td>

      {/* Actions */}
      <td>
        {isConfirmingDelete ? (
          <div className="action-confirm">
            <span className="confirm-text">Delete?</span>
            <button className="action-btn delete-confirm-btn" onClick={() => onDeleteConfirm(tx.transaction_id)}>✓</button>
            <button className="action-btn cancel-btn" onClick={onDeleteCancel}>✕</button>
          </div>
        ) : isEditing ? (
          <div className="action-group">
            <button
              className="action-btn save-btn"
              onClick={() => onSaveEdit(tx)}
              disabled={editTouched.description && editTouched.amount ? !editFormValid : false}
            >✓</button>
            <button className="action-btn cancel-btn" onClick={onCancelEdit}>✕</button>
          </div>
        ) : (
          <div className="action-group">
            <button className="action-btn edit-btn" onClick={() => onStartEdit(tx)} title="Edit">✎</button>
            <button className="action-btn delete-btn" onClick={() => onDeleteRequest(tx.transaction_id)} title="Delete">🗑</button>
          </div>
        )}
      </td>
    </tr>
  );
}

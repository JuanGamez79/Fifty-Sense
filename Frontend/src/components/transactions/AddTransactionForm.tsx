import { useState, useMemo, useEffect } from "react";
import type { Account, Category, CreateTransactionPayload, TransactionType, FieldErrors } from "../../types/transactions";
import { validate, isValid } from "../../utils/transactionUtils";

interface Props {
  accounts: Account[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
  onManageCategories: () => void;
}

export default function AddTransactionForm({
  accounts,
  categories,
  totalIncome,
  totalExpenses,
  onSubmit,
  onManageCategories,
}: Props) {
  const [activeType, setActiveType]   = useState<TransactionType>("expense");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount]   = useState("");
  const [toAccount, setToAccount]               = useState("");
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Seed dropdowns once data arrives from the parent
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) setSelectedAccount(accounts[0].account_id);
    if (accounts.length > 1 && !toAccount)       setToAccount(accounts[1].account_id);
  }, [accounts]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0].category_name);
  }, [categories]);

  const errors    = useMemo(() => validate(description, amount), [description, amount]);
  const formValid = isValid(errors);

  const handleConfirm = async () => {
    setTouched({ description: true, amount: true });
    if (!formValid) return;
    if (!selectedAccount) { setError("Please select an account."); return; }
    if (activeType === "transfer") {
      if (!toAccount) { setError("Please select a destination account."); return; }
      if (toAccount === selectedAccount) { setError("Source and destination accounts must be different."); return; }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        account_id:    selectedAccount,
        to_account_id: activeType === "transfer" ? toAccount : undefined,
        category_id:   selectedCategory || "Other",
        type:          activeType,
        amount:        parseFloat(amount),
        date:          new Date(date).toISOString(),
        description:   description.trim(),
      });
      setDescription("");
      setAmount("");
      setTouched({});
    } catch (e: any) {
      setError(e?.message ?? "Failed to create transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Add Card ─────────────────────────────────────────────────────── */}
      <div className="card add-card">
        <div className="add-card-header">
          <h2>Add transaction</h2>
        </div>
        <p className="add-card-sub">Quick add manually</p>

        <div className="type-toggle">
          <button className={`type-btn ${activeType === "income"   ? "active-income"   : ""}`} onClick={() => setActiveType("income")}>⊕ Income</button>
          <button className={`type-btn ${activeType === "expense"  ? "active-expense"  : ""}`} onClick={() => setActiveType("expense")}>⊖ Expense</button>
          <button className={`type-btn ${activeType === "transfer" ? "active-transfer" : ""}`} onClick={() => setActiveType("transfer")}>⇄ Transfer</button>
        </div>

        {error && (
          <p style={{ color: "#f87171", fontSize: 13, margin: "4px 0" }}>{error}</p>
        )}

        {/* Amount */}
        <div className="amount-display">
          $<input
            className={`amount-input ${touched.amount && errors.amount ? "input-error" : ""}`}
            type="number" placeholder="0.00" min="0.01" max="999999.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
          />
        </div>
        {touched.amount && errors.amount && <p className="field-error">{errors.amount}</p>}

        {/* Description */}
        <div className="form-field">
          <input
            className={`field-input ${touched.description && errors.description ? "input-error" : ""}`}
            placeholder="Merchant or note" maxLength={50}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
          />
        </div>
        {touched.description && errors.description && <p className="field-error">{errors.description}</p>}

        {/* From Account */}
        <div className="form-field">
          <select className="field-input" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
            {accounts.length === 0
              ? <option value="">No accounts found</option>
              : accounts.map((a) => (
                <option key={a.account_id} value={a.account_id}>
                  {activeType === "transfer" ? `From: ${a.account_name}` : a.account_name}
                </option>
              ))
            }
          </select>
        </div>

        {/* To Account — transfer only */}
        {activeType === "transfer" && (
          <div className="form-field">
            <select
              className={`field-input ${toAccount === selectedAccount ? "input-error" : ""}`}
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
            >
              {accounts.length === 0
                ? <option value="">No accounts found</option>
                : accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>To: {a.account_name}</option>
                ))
              }
            </select>
            {toAccount === selectedAccount && (
              <p className="field-error">Source and destination must be different.</p>
            )}
          </div>
        )}

        {/* Category — hidden for transfers */}
        {activeType !== "transfer" && (
          <div className="form-field">
            <select className="field-input" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.length === 0
                ? <option value="">No categories found</option>
                : categories.map((c) => (
                  <option key={c._id} value={c.category_name}>
                    {c.icon || "💳"} {c.category_name}
                  </option>
                ))
              }
            </select>
          </div>
        )}

        {/* Date */}
        <div className="form-field">
          <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <button
          className="confirm-btn"
          onClick={handleConfirm}
          disabled={submitting || (touched.description && touched.amount ? !formValid : false)}
        >
          {submitting ? "Adding…" : "Confirm"}
        </button>
      </div>

      {/* ── Monthly Summary ──────────────────────────────────────────────── */}
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

      {/* ── Categories Card ──────────────────────────────────────────────── */}
      <div className="card categories-card">
        <div className="categories-card-header">
          <div>
            <h2>Categories</h2>
            <p className="categories-card-sub">
              {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            </p>
          </div>
          <button className="manage-categories-btn" onClick={onManageCategories}>
            ⊕ Manage
          </button>
        </div>
        <div className="category-chips">
          {categories.slice(0, 6).map((c) => (
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
    </>
  );
}
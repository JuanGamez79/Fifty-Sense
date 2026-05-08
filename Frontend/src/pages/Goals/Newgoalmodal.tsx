import { useState } from "react";
import { apiRequest } from "../../api/axios";
import { GOAL_ICONS, pickIcon } from "./goalUtils";

interface NewGoalModalProps {
  userId: string;
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewGoalModal({ userId, token, onClose, onCreated }: NewGoalModalProps) {
  const [goalName,      setGoalName]      = useState("");
  const [targetAmount,  setTargetAmount]  = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline,      setDeadline]      = useState("");
  const [selectedIcon,  setSelectedIcon]  = useState("🎯");
  const [submitting,    setSubmitting]    = useState(false);
  const [err,           setErr]           = useState<string | null>(null);

  const handleCreate = async () => {
    const target  = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    if (!goalName.trim())               return setErr("Goal name is required.");
    if (goalName.trim().length < 2)     return setErr("Name must be at least 2 characters.");
    if (goalName.trim().length > 50)    return setErr("Name must be 50 characters or fewer.");
    if (!targetAmount || isNaN(target)) return setErr("Enter a valid target amount.");
    if (target <= 0)                    return setErr("Target must be greater than 0.");
    if (target >= 1_000_000)            return setErr("Target must be less than 1,000,000.");
    if (current < 0)                    return setErr("Current amount cannot be negative.");
    if (current > target)               return setErr("Current amount cannot exceed target.");
    if (!deadline)                      return setErr("Please set a deadline.");
    if (new Date(deadline) <= new Date()) return setErr("Deadline must be in the future.");

    setSubmitting(true);
    setErr(null);
    try {
      await apiRequest("/api/goals/create", {
        token,
        method: "POST",
        body: {
          goal_id:        `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          user_id:        userId,
          goal_name:      goalName.trim(),
          target_amount:  target,
          current_amount: current,
          deadline:       new Date(deadline).toISOString(),
        },
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="goal-overlay" onClick={onClose}>
      <div className="goal-modal" onClick={e => e.stopPropagation()}>
        <div className="goal-modal-head">
          <div>
            <h2 className="goal-modal-title">New Goal</h2>
            <p className="goal-modal-sub">Set a savings target to work towards</p>
          </div>
          <button className="goal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="goal-field">
          <label className="goal-label">Goal Name</label>
          <input
            className="goal-input"
            placeholder="e.g. Vacation to Bali"
            maxLength={50}
            value={goalName}
            onChange={e => { setGoalName(e.target.value); setSelectedIcon(pickIcon(e.target.value)); }}
          />
        </div>

        <div className="goal-field">
          <label className="goal-label">Icon</label>
          <div className="goal-icon-picker">
            {GOAL_ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                className={`goal-icon-btn${selectedIcon === ic ? " active" : ""}`}
                onClick={() => setSelectedIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="goal-row">
          <div className="goal-field">
            <label className="goal-label">Target Amount ($)</label>
            <input className="goal-input" type="number" placeholder="e.g. 3000" min="1"
              value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
          </div>
          <div className="goal-field">
            <label className="goal-label">Current Savings ($)</label>
            <input className="goal-input" type="number" placeholder="e.g. 500" min="0"
              value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
          </div>
        </div>

        <div className="goal-field">
          <label className="goal-label">Deadline</label>
          <input
            className="goal-input"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        </div>

        {err && <p className="goal-err">{err}</p>}

        <button className="goal-submit-btn" onClick={handleCreate} disabled={submitting}>
          {submitting ? "Creating…" : "Create Goal"}
        </button>
      </div>
    </div>
  );
}
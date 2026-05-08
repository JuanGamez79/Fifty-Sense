import { useState } from "react";
import { apiRequest } from "../../api/axios";
import type { Goal } from "./Types";

interface EditGoalModalProps {
  goal: Goal;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditGoalModal({ goal, token, onClose, onSaved }: EditGoalModalProps) {
  const [goalName,      setGoalName]      = useState(goal.goal_name);
  const [targetAmount,  setTargetAmount]  = useState(String(goal.target_amount));
  const [currentAmount, setCurrentAmount] = useState(String(goal.current_amount));
  const [deadline,      setDeadline]      = useState(goal.deadline.split("T")[0]);
  const [submitting,    setSubmitting]    = useState(false);
  const [err,           setErr]           = useState<string | null>(null);

  const handleSave = async () => {
    console.log("goal object:", goal);
    const target  = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    if (!goalName.trim())               return setErr("Goal name is required.");
    if (!targetAmount || isNaN(target)) return setErr("Enter a valid target amount.");
    if (target <= 0)                    return setErr("Target must be greater than 0.");
    if (current < 0)                    return setErr("Current amount cannot be negative.");
    if (current > target)               return setErr("Current amount cannot exceed target.");
    if (!deadline)                      return setErr("Please set a deadline.");

    setSubmitting(true);
    setErr(null);
    try {
      await apiRequest(`/api/goals/${goal.goal_id}`, {
        token,
        method: "PUT",
        body: {
          goal_name:      goalName.trim(),
          target_amount:  target,
          current_amount: current,
          deadline:       new Date(deadline).toISOString(),
        },
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update goal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="goal-overlay" onClick={onClose}>
      <div className="goal-modal" onClick={e => e.stopPropagation()}>
        <div className="goal-modal-head">
          <div>
            <h2 className="goal-modal-title">Edit Goal</h2>
            <p className="goal-modal-sub">Update your savings target</p>
          </div>
          <button className="goal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="goal-field">
          <label className="goal-label">Goal Name</label>
          <input className="goal-input" placeholder="Goal name" maxLength={50}
            value={goalName} onChange={e => setGoalName(e.target.value)} />
        </div>

        <div className="goal-row">
          <div className="goal-field">
            <label className="goal-label">Target Amount ($)</label>
            <input className="goal-input" type="number" min="1"
              value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
          </div>
          <div className="goal-field">
            <label className="goal-label">Current Savings ($)</label>
            <input className="goal-input" type="number" min="0"
              value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
          </div>
        </div>

        <div className="goal-field">
          <label className="goal-label">Deadline</label>
          <input className="goal-input" type="date"
            value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        {err && <p className="goal-err">{err}</p>}
        
        <button className="goal-submit-btn" onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
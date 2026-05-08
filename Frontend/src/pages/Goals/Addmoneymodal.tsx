import { useState } from "react";
import { apiRequest } from "../../api/axios";
import { fmt, pickIcon } from "./goalUtils";
import type { Goal } from "./Types";

interface AddMoneyModalProps {
  goal: Goal;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const playGoalSound = () => {
  const audio = new Audio("../../public/sounds/50 Cent - In Da Club (Official Music Video).mp3");
  audio.play().catch(() => {});
  setTimeout(() => {
    const fadeInterval = setInterval(() => {
      if (audio.volume > 0.05) {
        audio.volume = Math.max(0, audio.volume - 0.05);
      } else {
        audio.pause();
        audio.currentTime = 0;
        clearInterval(fadeInterval);
      }
    }, 50);
  }, 4000);
};

export default function AddMoneyModal({ goal, token, onClose, onSaved }: AddMoneyModalProps) {
  const [amount,     setAmount]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err,        setErr]        = useState<string | null>(null);

  const remaining = goal.target_amount - goal.current_amount;
  const icon      = pickIcon(goal.goal_name);
  const newPct    = Math.min(
    ((goal.current_amount + (parseFloat(amount) || 0)) / goal.target_amount) * 100,
    100
  );

  const handleAdd = async () => {
    const value = parseFloat(amount);
    if (!amount || isNaN(value)) return setErr("Enter a valid amount.");
    if (value <= 0)              return setErr("Amount must be greater than 0.");
    if (value > remaining)       return setErr(`Max you can add is ${fmt(remaining)}.`);

    setSubmitting(true);
    setErr(null);
    try {
      await apiRequest(`/api/goals/${goal.goal_id}`, {
        token,
        method: "PUT",
        body: {
          goal_name:      goal.goal_name,
          target_amount:  goal.target_amount,
          current_amount: goal.current_amount + value,
          deadline:       goal.deadline,
        },
      });
      onSaved();
      if (goal.current_amount + value >= goal.target_amount) playGoalSound();
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
            <h2 className="goal-modal-title">Add Money</h2>
            <p className="goal-modal-sub">
              <span style={{ marginRight: 6 }}>{icon}</span>
              {goal.goal_name}
            </p>
          </div>
          <button className="goal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Progress preview */}
        <div className="goal-add-progress">
          <div className="goal-add-progress-row">
            <span className="goal-add-saved">{fmt(goal.current_amount)}</span>
            <span className="goal-add-target">of {fmt(goal.target_amount)}</span>
          </div>
          <div className="goal-bar-track" style={{ margin: "8px 0" }}>
            <div
              className="goal-bar-fill"
              style={{
                width: `${newPct}%`,
                background: newPct >= 100
                  ? "linear-gradient(90deg,#10B981,#00E676)"
                  : "linear-gradient(90deg,#10B981,#059669)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div className="goal-add-progress-row">
            <span className="goal-add-pct">{Math.round(newPct)}% complete</span>
            <span className="goal-add-remaining">{fmt(remaining)} remaining</span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="goal-field">
          <label className="goal-label">Quick Add</label>
          <div className="goal-quick-btns">
            {[10, 25, 50, 100].map(q => (
              <button
                key={q}
                type="button"
                className={`goal-quick-btn${amount === String(q) ? " active" : ""}`}
                onClick={() => { setAmount(String(q)); setErr(null); }}
                disabled={q > remaining}
              >
                +{fmt(q)}
              </button>
            ))}
            <button
              type="button"
              className={`goal-quick-btn${parseFloat(amount) === remaining ? " active" : ""}`}
              onClick={() => { setAmount(String(remaining)); setErr(null); }}
            >
              Full ({fmt(remaining)})
            </button>
          </div>
        </div>

        <div className="goal-field">
          <label className="goal-label">Custom Amount ($)</label>
          <input
            className="goal-input"
            type="number"
            placeholder={`e.g. 50 (max ${fmt(remaining)})`}
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErr(null); }}
          />
        </div>

        {err && <p className="goal-err">{err}</p>}

        <button
          className="goal-submit-btn goal-add-btn"
          onClick={handleAdd}
          disabled={submitting || !amount}
        >
          {submitting ? "Adding…" : `Add ${amount && !isNaN(parseFloat(amount)) ? fmt(parseFloat(amount)) : "Money"}`}
        </button>
      </div>
    </div>
  );
}
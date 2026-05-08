import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/Goals.css";
import { useAuth } from "../../api/useAuth";
import { apiRequest } from "../../api/axios";

import DonutChart    from "./Donutchart";
import AddMoneyModal from "./Addmoneymodal";
import NewGoalModal  from "./Newgoalmodal";
import EditGoalModal from "./Editgoalmodal";

import { unwrapArray, fmt, daysLeft, daysLeftLabel, pickIcon, pickColor } from "./goalUtils";
import type { Goal, FilterTab, SortKey } from "./Types";

export default function Goals() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const userId = (user as any)?.user_id;

  const [goals,        setGoals]        = useState<Goal[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showModal,    setShowModal]    = useState(false);
  const [editGoal,     setEditGoal]     = useState<Goal | null>(null);
  const [addMoneyGoal, setAddMoneyGoal] = useState<Goal | null>(null);
  const [confirmId,    setConfirmId]    = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<FilterTab>("All Goals");
  const [sortKey,      setSortKey]      = useState<SortKey>("Progress");
  const [showSort,     setShowSort]     = useState(false);
  const [aiTip,        setAiTip]        = useState("Automate small savings to reach your goals faster.");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const raw = await apiRequest<any>(`/api/goals/user/${userId}`, { token });
      setGoals(unwrapArray<Goal>(raw));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // ── Tip rotation ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (goals.length === 0) {
      setAiTip("Set your first goal to start tracking your savings progress.");
      return;
    }
    const tips = [
      "Automate small savings to reach your goals faster.",
      "Break down large goals into smaller milestones to stay motivated.",
      "Round up purchases and save the difference toward your goals.",
      "Review your goals monthly to track progress and adjust deadlines.",
      "Use the 50/30/20 rule to allocate 20% of income toward goals.",
      "Start with one goal and build from there—compound progress matters.",
      "Set realistic deadlines to keep yourself accountable.",
      "Celebrate goal milestones, even small ones, to maintain momentum.",
    ];
    setAiTip(tips[Math.floor(Math.random() * tips.length)]);
  }, [goals.length]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (goalId: string) => {
    setDeletingId(goalId);
    try {
      await apiRequest(`/api/goals/${goalId}`, { token, method: "DELETE" });
      setConfirmId(null);
      await fetchGoals();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete goal.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalSaved  = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const overallPct  = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const filtered = goals.filter(g => {
    const pct = (g.current_amount / g.target_amount) * 100;
    if (activeTab === "In Progress") return pct < 100;
    if (activeTab === "Completed")   return pct >= 100;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "Progress") return (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount);
    if (sortKey === "Deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (sortKey === "Amount")   return b.target_amount - a.target_amount;
    return 0;
  });

  const upcoming = [...goals]
    .filter(g => daysLeft(g.deadline) >= 0 && (g.current_amount / g.target_amount) < 1)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="goals-page">
      <div className="goals-oval" />

      <div className="goals-header">
        <h1 className="goals-title">Goals</h1>
      </div>

      {error && <div className="goals-error-banner">{error}</div>}

      <div className="goals-layout">

        {/* ── LEFT: Goal List ──────────────────────────────────────────── */}
        <div className="goals-left">
          <div className="goals-tabs-row">
            <div className="goals-tabs">
              {(["All Goals", "In Progress", "Completed"] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  className={`goals-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="goals-tabs-row-right">
              <div className="goals-sort-wrap">
                <button className="goals-sort-btn" onClick={() => setShowSort(s => !s)}>
                  Sort by: {sortKey} ▾
                </button>
                {showSort && (
                  <div className="goals-sort-dropdown">
                    {(["Progress", "Deadline", "Amount"] as SortKey[]).map(s => (
                      <button
                        key={s}
                        className={`goals-sort-opt${sortKey === s ? " active" : ""}`}
                        onClick={() => { setSortKey(s); setShowSort(false); }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="goals-new-btn" onClick={() => setShowModal(true)}>+ New goal</button>
            </div>
          </div>

          {loading ? (
            <p className="goals-empty">Loading…</p>
          ) : sorted.length === 0 ? (
            <div className="goals-empty-state">
              <span>🎯</span>
              <p>
                {activeTab === "All Goals"
                  ? "No goals yet. Create one to start tracking!"
                  : `No ${activeTab.toLowerCase()} goals.`}
              </p>
            </div>
          ) : (
            <div className="goals-list">
              {sorted.map((g, i) => {
                const pct  = Math.min((g.current_amount / g.target_amount) * 100, 100);
                const done = pct >= 100;
                const pal  = pickColor(i);
                const icon = pickIcon(g.goal_name);
                const isC  = confirmId === g.goal_id;

                return (
                  <div key={g.goal_id} className="goal-card">
                    <div className="goal-card-main">
                      <div className="goal-card-icon" style={{ background: pal.bg }}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                      </div>

                      <div className="goal-card-body">
                        <div className="goal-card-top">
                          <span className="goal-card-name">{g.goal_name}</span>
                          <div className="goal-card-right">
                            <div className="goal-card-amounts">
                              <span className="goal-card-current">{fmt(g.current_amount)}</span>
                              <span className="goal-card-target">of {fmt(g.target_amount)}</span>
                            </div>
                            {isC ? (
                              <div className="goal-actions">
                                <span className="goal-confirm-text">Delete?</span>
                                <button
                                  className="goal-action-btn goal-yes-btn"
                                  onClick={() => handleDelete(g.goal_id)}
                                  disabled={deletingId === g.goal_id}
                                >✓</button>
                                <button
                                  className="goal-action-btn goal-no-btn"
                                  onClick={() => setConfirmId(null)}
                                >✕</button>
                              </div>
                            ) : (
                              <div className="goal-actions">
                                {!done && (
                                  <button
                                    className="goal-action-btn goal-add-money-btn"
                                    onClick={() => setAddMoneyGoal(g)}
                                    title="Add money"
                                  >
                                    ＋Add Money
                                  </button>
                                )}
                                <button
                                  className="goal-action-btn goal-edit-btn"
                                  onClick={() => setEditGoal(g)}
                                  title="Edit"
                                >
                                  ✎Edit
                                </button>
                                <button
                                  className="goal-action-btn goal-del-btn"
                                  onClick={() => setConfirmId(g.goal_id)}
                                  title="Delete"
                                >
                                 🗑 Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="goal-bar-track">
                          <div className="goal-bar-fill" style={{
                            width: `${pct}%`,
                            background: done
                              ? "linear-gradient(90deg,#10B981,#00E676)"
                              : `linear-gradient(90deg,${pal.color},${pal.color}cc)`,
                          }} />
                        </div>

                        <div className="goal-card-footer">
                          <span className="goal-pct-label" style={{ color: pal.color }}>
                            {Math.round(pct)}% complete
                          </span>
                          {done ? (
                            <span className="goal-done-badge">✓ Completed</span>
                          ) : (
                            <span className="goal-deadline">
                              {new Date(g.deadline).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sorted.length > 0 && (
            <p className="goals-count">
              Showing {sorted.length} of {goals.length} goal{goals.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── RIGHT: Overview ──────────────────────────────────────────── */}
        <div className="goals-right">

          <div className="goals-overview-card">
            <span className="goals-section-title">Goals Overview</span>
            <div className="goals-overview-stats">
              <span className="goals-total-count">{goals.length}</span>
              <span className="goals-total-label">Total goals</span>
            </div>
            <div className="goals-overview-row">
              <div className="goals-stat-box">
                <span className="goals-stat-val goals-stat-green">{fmt(totalSaved)}</span>
                <span className="goals-stat-label">Total saved</span>
              </div>
              <div className="goals-stat-box">
                <span className="goals-stat-val goals-stat-blue">{fmt(totalTarget)}</span>
                <span className="goals-stat-label">Total target</span>
              </div>
            </div>
            <div className="goals-donut-wrap">
              <DonutChart pct={overallPct} color="#A855F7" />
            </div>
          </div>

          <div className="goals-upcoming-card">
            <span className="goals-section-title">Upcoming Targets</span>
            {upcoming.length === 0 ? (
              <p className="goals-empty" style={{ padding: "12px 0" }}>No upcoming deadlines.</p>
            ) : (
              <div className="goals-upcoming-list">
                {upcoming.map((g, i) => {
                  const pal     = pickColor(i);
                  const icon    = pickIcon(g.goal_name);
                  const days    = daysLeft(g.deadline);
                  const dayInfo = daysLeftLabel(days);
                  return (
                    <div key={g.goal_id} className="goals-upcoming-row">
                      <div className="goals-upcoming-icon" style={{ background: pal.bg }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                      </div>
                      <span className="goals-upcoming-name">{g.goal_name}</span>
                      <span className="goals-upcoming-date">
                        {new Date(g.deadline).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                      <span className="goals-upcoming-days" style={{ color: dayInfo.color }}>
                        {dayInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {goals.filter(g => daysLeft(g.deadline) >= 0).length > 3 && (
              <button className="goals-view-all-btn">View all →</button>
            )}
          </div>

          <div className="goals-tip-card">
            <div className="goals-tip-header">
              <span className="goals-tip-icon">✦</span>
              <span className="goals-section-title" style={{ margin: 0 }}>Tip</span>
            </div>
            <p className="goals-tip-text">{aiTip}</p>
            <button className="goals-tip-btn" onClick={() => navigate("/ai")}>View tips →</button>
          </div>
        </div>
      </div>

      {showModal && userId && (
        <NewGoalModal
          userId={userId}
          token={token ?? null}
          onClose={() => setShowModal(false)}
          onCreated={fetchGoals}
        />
      )}

      {editGoal && (
        <EditGoalModal
          goal={editGoal}
          token={token ?? null}
          onClose={() => setEditGoal(null)}
          onSaved={fetchGoals}
        />
      )}

      {addMoneyGoal && (
        <AddMoneyModal
          goal={addMoneyGoal}
          token={token ?? null}
          onClose={() => setAddMoneyGoal(null)}
          onSaved={fetchGoals}
        />
      )}
    </div>
  );
}
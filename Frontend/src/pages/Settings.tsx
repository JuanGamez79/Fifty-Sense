import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { apiRequest } from "../api/axios";
import "../style/Settings.css";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "profile" | "security" | "danger";

interface FeedbackState {
  msg: string | null;
  err: string | null;
  loading: boolean;
}

const idle: FeedbackState = { msg: null, err: null, loading: false };

// ── Reusable pieces ───────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="st-field">
      <label className="st-label">{label}</label>
      {children}
      {hint && <p className="st-hint">{hint}</p>}
    </div>
  );
}

function Feedback({ state }: { state: FeedbackState }) {
  if (state.err) return <p className="st-feedback st-feedback--err">⚠ {state.err}</p>;
  if (state.msg) return <p className="st-feedback st-feedback--ok">✓ {state.msg}</p>;
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const mongoId = (user as any)?._id ?? (user as any)?.mongo_id;

  const [activeSection, setActiveSection] = useState<Section>("profile");

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
  });
  const [profileFb, setProfileFb] = useState<FeedbackState>(idle);

  // ── Email state ────────────────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ new_email: "", password: "" });
  const [emailFb, setEmailFb] = useState<FeedbackState>(idle);

  // ── Password state ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwFb, setPwFb] = useState<FeedbackState>(idle);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // ── Danger state ───────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── Load fresh profile ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mongoId) return;
    (async () => {
      try {
        const raw = await apiRequest<any>("/api/users/profile", { token });
        const u = Array.isArray(raw?.data) ? raw.data[0] : raw;
        if (u) setProfile({ first_name: u.first_name ?? "", last_name: u.last_name ?? "" });
      } catch { /* fall back to auth context */ }
    })();
  }, [mongoId, token]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      setProfileFb({ ...idle, err: "First and last name are required." }); return;
    }
    setProfileFb({ ...idle, loading: true });
    try {
      await apiRequest(`/api/users/${mongoId}`, {
        token, method: "PUT",
        body: { first_name: profile.first_name.trim(), last_name: profile.last_name.trim() },
      });
      setProfileFb({ ...idle, msg: "Name updated successfully." });
      setTimeout(() => setProfileFb(idle), 3000);
    } catch (e: any) {
      setProfileFb({ ...idle, err: e?.message ?? "Failed to update profile." });
    }
  };

  const saveEmail = async () => {
    const email = emailForm.new_email.trim();
    if (!email)                                   { setEmailFb({ ...idle, err: "New email address is required." }); return; }
    if (!emailForm.password)                      { setEmailFb({ ...idle, err: "Please confirm your current password." }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailFb({ ...idle, err: "Please enter a valid email address." }); return; }
    setEmailFb({ ...idle, loading: true });
    try {
      await apiRequest(`/api/users/${mongoId}/email`, {
        token, method: "PUT",
        body: { email, current_password: emailForm.password },
      });
      setEmailFb({ ...idle, msg: "Email updated. Logging you out…" });
      setEmailForm({ new_email: "", password: "" });
      setTimeout(() => { logout?.(); navigate("/login"); }, 2000);
    } catch (e: any) {
      setEmailFb({ ...idle, err: e?.message ?? "Failed to update email." });
    }
  };

  const savePassword = async () => {
    if (!pwForm.current_password)                          { setPwFb({ ...idle, err: "Current password is required." }); return; }
    if (pwForm.new_password.length < 8)                    { setPwFb({ ...idle, err: "New password must be at least 8 characters." }); return; }
    if (pwForm.new_password !== pwForm.confirm_password)   { setPwFb({ ...idle, err: "New passwords do not match." }); return; }
    if (pwForm.current_password === pwForm.new_password)   { setPwFb({ ...idle, err: "New password must differ from current." }); return; }
    setPwFb({ ...idle, loading: true });
    try {
      await apiRequest(`/api/users/${mongoId}/password`, {
        token, method: "PUT",
        body: { current_password: pwForm.current_password, new_password: pwForm.new_password },
      });
      setPwFb({ ...idle, msg: "Password changed. Logging you out…" });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => { logout?.(); navigate("/login"); }, 2000);
    } catch (e: any) {
      setPwFb({ ...idle, err: e?.message ?? "Failed to change password." });
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await apiRequest(`/api/users/${mongoId}`, { token, method: "DELETE" });
      logout?.(); navigate("/login");
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete account.");
      setDeleting(false);
    }
  };

  // ── Password strength ──────────────────────────────────────────────────────
  function pwStrength(pw: string): { label: string; level: number } {
    if (!pw) return { label: "", level: 0 };
    let s = 0;
    if (pw.length >= 8)          s++;
    if (pw.length >= 12)         s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { label: "Weak",   level: 1 };
    if (s <= 3) return { label: "Fair",   level: 2 };
    if (s === 4) return { label: "Good",  level: 3 };
    return              { label: "Strong", level: 4 };
  }

  const strength = pwStrength(pwForm.new_password);

  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";

  const tabs: { id: Section; label: string; icon: string }[] = [
    { id: "profile",  label: "Profile",      icon: "👤" },
    { id: "security", label: "Security",     icon: "🔐" },
    { id: "danger",   label: "Delete Account",  icon: "🗑" },
  ];

  return (
    <div className="st-page">
      <div className="st-inner">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="st-page-header">
          <div className="st-page-header__left">
            <div className="st-breadcrumb">
              <button className="st-breadcrumb__back" onClick={() => navigate("/account")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 3L5 8l5 5" />
                </svg>
                Account
              </button>
              <span className="st-breadcrumb__sep">/</span>
              <span className="st-breadcrumb__cur">Settings</span>
            </div>
            <h1 className="st-page-title">Settings</h1>
            <p className="st-page-sub">Manage your profile, security and account preferences</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="st-user-chip">
              <div className="st-avatar">{initials}</div>
              <div>
                <div className="st-chip-name">{fullName}</div>
                <div className="st-chip-email">{user?.email ?? ""}</div>
              </div>
            </div>
            <button className="st-logout-btn" onClick={() => { logout?.(); navigate("/login"); }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" />
              </svg>
              Log out
            </button>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="st-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`st-tab ${t.id === "danger" ? "st-tab--danger" : ""} ${activeSection === t.id ? "active" : ""}`}
              onClick={() => setActiveSection(t.id)}
            >
              <span className="st-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ PROFILE ════════════════════════════════════════════════ */}
        {activeSection === "profile" && (
          <div className="st-section">
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-head-icon">👤</div>
                <div className="st-card-head-text">
                  <h3 className="st-card-title">Display Name</h3>
                  <p className="st-card-desc">How your name appears across the app</p>
                </div>
              </div>

              <div className="st-card-row">
                <Field label="First Name">
                  <input
                    className="st-input"
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                </Field>
                <Field label="Last Name">
                  <input
                    className="st-input"
                    type="text"
                    value={profile.last_name}
                    onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                </Field>
              </div>

              <Feedback state={profileFb} />

              <div className="st-actions">
                <button className="st-btn st-btn--primary" onClick={saveProfile} disabled={profileFb.loading}>
                  {profileFb.loading ? "Saving…" : "Save Name"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECURITY ═══════════════════════════════════════════════ */}
        {activeSection === "security" && (
          <div className="st-section">

            {/* Email */}
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-head-icon">✉️</div>
                <div className="st-card-head-text">
                  <h3 className="st-card-title">Email Address</h3>
                  <p className="st-card-desc">
                    Currently <strong>{user?.email}</strong>. Changing your email will log you out.
                  </p>
                </div>
              </div>

              <Field label="New Email Address">
                <input
                  className="st-input"
                  type="email"
                  value={emailForm.new_email}
                  onChange={(e) => setEmailForm((p) => ({ ...p, new_email: e.target.value }))}
                  placeholder="new@email.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Confirm Current Password" hint="We need your password to verify this change.">
                <input
                  className="st-input"
                  type="password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Your current password"
                  autoComplete="current-password"
                />
              </Field>

              <Feedback state={emailFb} />

              <div className="st-actions">
                <button className="st-btn st-btn--primary" onClick={saveEmail} disabled={emailFb.loading}>
                  {emailFb.loading ? "Updating…" : "Update Email"}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="st-card">
              <div className="st-card-head">
                <div className="st-card-head-icon">🔑</div>
                <div className="st-card-head-text">
                  <h3 className="st-card-title">Change Password</h3>
                  <p className="st-card-desc">Use at least 8 characters. You'll be logged out after changing.</p>
                </div>
              </div>

              <Field label="Current Password">
                <div className="st-pw-wrap">
                  <input
                    className="st-input"
                    type={showPw.current ? "text" : "password"}
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                  <button className="st-pw-toggle" type="button" onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}>
                    {showPw.current ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>

              <Field label="New Password">
                <div className="st-pw-wrap">
                  <input
                    className="st-input"
                    type={showPw.new ? "text" : "password"}
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                    placeholder="New password"
                    autoComplete="new-password"
                  />
                  <button className="st-pw-toggle" type="button" onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}>
                    {showPw.new ? "Hide" : "Show"}
                  </button>
                </div>
                {pwForm.new_password && (
                  <div className="st-strength">
                    <div className="st-strength-bar">
                      {[1,2,3,4].map((n) => (
                        <div key={n} className={`st-strength-seg ${n <= strength.level ? `level-${strength.level}` : ""}`} />
                      ))}
                    </div>
                    <span className={`st-strength-label level-${strength.level}`}>{strength.label}</span>
                  </div>
                )}
              </Field>

              <Field label="Confirm New Password">
                <div className="st-pw-wrap">
                  <input
                    className={`st-input ${pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password ? "st-input--err" : ""}`}
                    type={showPw.confirm ? "text" : "password"}
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button className="st-pw-toggle" type="button" onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}>
                    {showPw.confirm ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>

              <Feedback state={pwFb} />

              <div className="st-actions">
                <button className="st-btn st-btn--primary" onClick={savePassword} disabled={pwFb.loading}>
                  {pwFb.loading ? "Changing…" : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ DANGER ZONE ════════════════════════════════════════════ */}
        {activeSection === "danger" && (
          <div className="st-section">
            <div className="st-card st-card--danger">
              <div className="st-card-head">
                <div className="st-card-head-icon st-card-head-icon--danger">⚠️</div>
                <div className="st-card-head-text">
                  <h3 className="st-card-title st-card-title--danger">🗑 Delete Account</h3>
                  <p className="st-card-desc">
                    Permanently deletes your account, all linked bank accounts, and every transaction.{" "}
                    <strong>There is no undo.</strong>
                  </p>
                </div>
              </div>

              <Field label='Type "DELETE" to confirm' hint="This action is permanent and cannot be reversed.">
                <input
                  className={`st-input st-input--danger ${deleteConfirm === "DELETE" ? "st-input--danger-ready" : ""}`}
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  spellCheck={false}
                />
              </Field>

              <div className="st-actions">
                <button
                  className="st-btn st-btn--danger"
                  onClick={handleDeleteUser}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                >
                  {deleting ? "Deleting…" : "Permanently Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
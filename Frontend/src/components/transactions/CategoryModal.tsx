import { useState } from "react";
import { apiRequest } from "../../api/axios";
import type { Category } from "../../types/transactions";
import { ICON_OPTIONS, saveCategoryIcon } from "../../utils/transactionUtils";

interface Props {
  userId: string;
  token: string | null;
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
}

export default function CategoryModal({ userId, token, categories, onClose, onChanged }: Props) {
  const [newName, setNewName]   = useState("");
  const [newIcon, setNewIcon]   = useState("💳");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal]   = useState("");
  const [renameIcon, setRenameIcon] = useState("💳");
  const [renameErr, setRenameErr]   = useState<string | null>(null);
  const [savingId, setSavingId]     = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  // Create
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
        body: { user_id: userId, category_name: name, icon: newIcon },
      });
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

  // Rename 
  const startRename = (cat: Category) => {
    setRenamingId(cat._id);
    setRenameVal(cat.category_name);
    setRenameIcon(cat.icon || "💳");
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
        body: { category_name: name, icon: renameIcon },
      });
      saveCategoryIcon(name, renameIcon);
      setRenamingId(null);
      onChanged();
    } catch (e: any) {
      setRenameErr(e?.message ?? "Failed to rename.");
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (cat: Category) => {
    setDeletingId(cat._id);
    try {
      await apiRequest(`/api/categories/${cat._id}`, { token, method: "DELETE" });
      setConfirmId(null);
      onChanged();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cat-overlay" onClick={onClose}>
      <div className="cat-modal" onClick={(e) => e.stopPropagation()}>

        <div className="cat-modal-header">
          <div>
            <h2>Categories</h2>
            <p className="cat-modal-sub">Manage your transaction categories</p>
          </div>
          <button className="cat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Create */}
        <div className="cat-create">
          <input
            type="text"
            className="cat-name-input"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="cat-icon-picker">
            {ICON_OPTIONS.map((icon) => (
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
          <button className="cat-add-btn" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "+ Add Category"}
          </button>
        </div>

        <div className="cat-divider" />

        {/* List */}
        {categories.length === 0 ? (
          <p className="cat-empty">No categories yet. Create one to get started!</p>
        ) : (
          <div className="cat-list">
            {categories.map((cat) => {
              const isEditing    = renamingId === cat._id;
              const isConfirming = confirmId  === cat._id;

              return (
                <div key={cat._id} className={`cat-row ${isEditing ? "cat-row--editing" : ""}`}>
                  <div className="cat-row-icon">{cat.icon || "💳"}</div>

                  {isEditing ? (
                    <>
                      <div className="cat-rename-group">
                        <input
                          type="text"
                          className="cat-rename-input"
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && saveRename(cat)}
                        />
                        <div className="cat-icon-picker">
                          {ICON_OPTIONS.map((icon) => (
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
                      <div className="cat-row-actions">
                        <button className="cat-action-btn cat-action-btn--save" onClick={() => saveRename(cat)} disabled={savingId === cat._id} type="button">✓</button>
                        <button className="cat-action-btn cat-action-btn--cancel" onClick={() => setRenamingId(null)} type="button">✕</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="cat-row-name">{cat.category_name}</div>
                      <div className="cat-row-actions">
                        <button className="cat-action-btn cat-action-btn--edit" onClick={() => startRename(cat)} type="button" title="Edit">✎</button>
                        <button className="cat-action-btn cat-action-btn--delete" onClick={() => setConfirmId(cat._id)} type="button" title="Delete">🗑</button>
                      </div>
                      {isConfirming && (
                        <div className="cat-row-actions">
                          <span className="cat-confirm-text">Confirm?</span>
                          <button className="cat-action-btn cat-action-btn--confirm" onClick={() => handleDelete(cat)} disabled={deletingId === cat._id} type="button">✓</button>
                          <button className="cat-action-btn cat-action-btn--cancel" onClick={() => setConfirmId(null)} type="button">✕</button>
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

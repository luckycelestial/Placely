"use client";

import { useEffect } from "react";
import { LuX, LuLayers } from "react-icons/lu";

interface CreateGroupModalProps {
  isOpen: boolean;
  groupName: string;
  groupType: "student_selectable" | "admin_assigned";
  onNameChange: (name: string) => void;
  onTypeChange: (type: "student_selectable" | "admin_assigned") => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CreateGroupModal({
  isOpen,
  groupName,
  groupType,
  onNameChange,
  onTypeChange,
  onSubmit,
  onClose,
}: CreateGroupModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        className="relative w-full max-w-md bg-surface rounded-3xl shadow-2xl border border-border-subtle p-6 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <LuLayers size={18} />
            </div>
            <h3 id="create-group-title" className="font-black text-lg">Create Custom Group</h3>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:bg-black/5 transition-colors"
          >
            <LuX size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Group Name</label>
            <input 
              type="text" 
              required
              autoFocus
              placeholder="e.g. Placement Training Batch A"
              value={groupName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Group Assignment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onTypeChange("student_selectable")}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  groupType === "student_selectable"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border-subtle bg-background text-muted hover:text-foreground"
                }`}
              >
                <p className="font-black mb-0.5">Student Selectable</p>
                <p className="text-[10px] opacity-75 font-normal">Students pick during profile setup</p>
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("admin_assigned")}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  groupType === "admin_assigned"
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border-subtle bg-background text-muted hover:text-foreground"
                }`}
              >
                <p className="font-black mb-0.5">Admin Assigned</p>
                <p className="text-[10px] opacity-75 font-normal">Only TPO can assign students</p>
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border-subtle font-bold text-sm text-muted hover:text-foreground hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { LuTrash2, LuTriangleAlert } from "react-icons/lu";

interface DeleteDialogProps {
  isOpen: boolean;
  count: number;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteDialog({ isOpen, count, isDeleting, onCancel, onConfirm }: DeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-3xl shadow-2xl border border-border-subtle max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
        <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 mx-auto mb-4">
          <LuTriangleAlert size={24} />
        </div>
        <h3 className="text-lg font-black text-foreground mb-2">Confirm Deletion</h3>
        <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">
          Deleting {count} record{count > 1 ? "s" : ""}
        </p>
        <p className="text-muted text-[11px] leading-relaxed mb-6 font-medium">
          Are you sure? This action cannot be undone and will permanently remove all associated details from the database.
        </p>
        <div className="flex items-center gap-3">
          <button
            disabled={isDeleting}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-border-subtle text-xs font-black uppercase tracking-wider hover:bg-surface transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-tactile hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LuTrash2 size={14} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

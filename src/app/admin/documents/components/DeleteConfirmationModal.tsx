"use client";

import { LuX } from "react-icons/lu";

interface DeleteConfirmationModalProps {
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmationModal({ title, onClose, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer"
        >
          <LuX size={20} />
        </button>
        <h3 className="font-display text-2xl font-black tracking-tight mb-4">Delete Document Request?</h3>
        <p className="text-xs font-bold text-muted mb-6 leading-relaxed">
          Are you sure you want to delete the request for <span className="text-foreground">"{title}"</span>? This will permanently remove the broadcast upload notice and all student submissions for this document.
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl cursor-pointer shadow-tactile"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

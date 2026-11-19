"use client";

import { useEffect } from "react";
import { LuX } from "react-icons/lu";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { Stage } from "./types";

// ---------- Add Stage Modal ----------
interface AddStageModalProps {
  newStageName: string;
  onNameChange: (name: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

export function AddStageModal({ newStageName, onNameChange, onAdd, onClose }: AddStageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-stage-title"
        className="bg-card w-full max-w-md rounded-3xl border border-border-subtle p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <h3 id="add-stage-title" className="text-xl font-black mb-4">Add New Stage</h3>
        <p className="text-sm text-muted mb-6">Create a new column in your ATS pipeline.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
              Stage Name
            </label>
            <input
              type="text"
              value={newStageName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. Group Discussion"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onAdd();
              }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border-subtle font-bold text-muted hover:text-foreground hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              disabled={!newStageName.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Remove Stage Confirm Modal ----------
interface RemoveStageModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export function RemoveStageModal({ onConfirm, onClose }: RemoveStageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-stage-title"
        className="bg-card w-full max-w-sm rounded-3xl border border-border-subtle p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <h3 id="remove-stage-title" className="text-xl font-black mb-2">Remove Stage?</h3>
        <p className="text-sm text-muted mb-6">
          Are you sure you want to remove this stage column? Any students currently in this stage will
          not be deleted, but the column will be hidden.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-border-subtle font-bold text-muted hover:text-foreground hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:brightness-110 transition-all"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Move Selected Modal ----------
interface MoveSelectedModalProps {
  count: number;
  stages: Stage[];
  targetStage: string;
  isLoading: boolean;
  onTargetChange: (stageId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function MoveSelectedModal({
  count,
  stages,
  targetStage,
  isLoading,
  onTargetChange,
  onConfirm,
  onClose,
}: MoveSelectedModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-candidates-title"
        className="bg-surface w-full max-w-sm p-6 rounded-3xl border border-border-subtle shadow-xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="move-candidates-title" className="text-lg font-black">Move {count} Candidates</h2>
          <button 
            onClick={onClose} 
            aria-label="Close dialog"
            className="text-muted hover:text-foreground p-1 rounded-lg transition-colors"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1">Target Stage</label>
            <SearchableSelect
              options={stages.map((s) => ({ value: s.id, label: s.name }))}
              value={targetStage}
              onChange={onTargetChange}
              placeholder="Select Target Stage"
            />
          </div>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full mt-4 bg-primary text-primary-foreground font-black py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Moving..." : "Confirm Move"}
          </button>
        </div>
      </div>
    </div>
  );
}

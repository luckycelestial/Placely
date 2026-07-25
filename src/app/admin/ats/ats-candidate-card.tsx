"use client";

import { LuBuilding2, LuClock, LuGripVertical, LuMessageSquare } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { toast } from "sonner";
import type { Application } from "./types";

interface AtsCandidateCardProps {
  candidate: Application;
  actualStageName: string;
  isGlobalView: boolean;
  isSelected: boolean;
  editingCtcId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onToggleSelect: (id: string) => void;
  onEditCtcStart: (id: string) => void;
  onEditCtcEnd: (id: string, value: string, prev: string) => void;
}

export function AtsCandidateCard({
  candidate,
  actualStageName,
  isGlobalView,
  isSelected,
  editingCtcId,
  onDragStart,
  onToggleSelect,
  onEditCtcStart,
  onEditCtcEnd,
}: AtsCandidateCardProps) {
  const showCtc =
    actualStageName.toLowerCase().includes("offer") ||
    actualStageName.toLowerCase().includes("select") ||
    actualStageName.toLowerCase().includes("join");

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, candidate.id)}
      className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing group relative"
    >
      {/* Checkbox */}
      <div className="absolute top-4 right-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(candidate.id)}
          className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 cursor-pointer"
        />
      </div>

      {/* Avatar + name */}
      <div className="flex items-start justify-between mb-3 pr-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
            {candidate.avatar}
          </div>
          <div>
            <p className="font-bold text-xs leading-none mb-1 group-hover:text-primary transition-colors">
              {candidate.name}
            </p>
            <p className="text-[9px] font-black text-muted uppercase tracking-tighter">{candidate.regNo}</p>
          </div>
        </div>
      </div>

      {/* Company + role */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-1.5 text-foreground/70">
          <LuBuilding2 size={12} className="text-muted flex-shrink-0" />
          <span className="text-[10px] font-bold truncate max-w-[100px]">{candidate.company}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-muted flex-shrink-0" />
          <span className="text-[10px] font-bold truncate max-w-[150px]">{candidate.role}</span>
        </div>
      </div>

      {/* Global view: current round badge */}
      {isGlobalView && (
        <div className="mb-4">
          <span className="inline-block px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/10">
            Round: {actualStageName}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50">
        <div className="flex items-center gap-1.5">
          <LuClock size={10} className="text-muted" />
          <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">{candidate.updated}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline CTC editor */}
          {showCtc && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              {editingCtcId === candidate.id ? (
                <>
                  <input
                    autoFocus
                    type="number"
                    step="any"
                    defaultValue={candidate.ctc || ""}
                    placeholder="12"
                    className="w-12 bg-background border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 text-[9px] font-bold focus:outline-none"
                    onBlur={(e) => onEditCtcEnd(candidate.id, e.target.value, candidate.ctc || "")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">LPA</span>
                </>
              ) : (
                <div
                  onClick={() => onEditCtcStart(candidate.id)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors border",
                    candidate.ctc
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                  )}
                >
                  {candidate.ctc ? `${candidate.ctc} LPA` : "+ CTC"}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1">
            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
              <LuMessageSquare size={12} className="text-muted" />
            </button>
            <LuGripVertical size={12} className="text-muted cursor-grab" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { DriveFilters } from "./types";

interface FilterDrawerProps {
  stagedFilters: DriveFilters;
  appliedFilters: DriveFilters;
  onChangeStagedFilters: (filters: DriveFilters) => void;
  onApply: (filters: DriveFilters) => void;
  onClose: () => void;
}

export function FilterDrawer({
  stagedFilters,
  appliedFilters,
  onChangeStagedFilters,
  onApply,
  onClose,
}: FilterDrawerProps) {
  const update = (patch: Partial<DriveFilters>) =>
    onChangeStagedFilters({ ...stagedFilters, ...patch });

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-surface border-l border-border-subtle shadow-2xl h-full animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-background/50">
          <div>
            <h2 className="text-xl font-black tracking-tight">Opportunity Filters</h2>
            <p className="text-xs text-muted font-medium">Fine-tune your job opportunities search.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <LuX size={20} />
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* Eligibility */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block">
              Profile Eligibility
            </label>
            <div className="flex flex-wrap gap-2">
              {["All", "Eligible", "Ineligible"].map((elig) => (
                <button
                  key={elig}
                  onClick={() => update({ eligibility: elig })}
                  type="button"
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                    stagedFilters.eligibility === elig
                      ? "bg-primary text-white border-primary shadow-tactile"
                      : "bg-background border-border-subtle text-muted hover:border-primary/30"
                  )}
                >
                  {elig === "All" ? "All Opportunities" : elig}
                </button>
              ))}
            </div>
          </div>

          {/* Drive Status */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block">
              Drive Status
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All Statuses", value: "All" },
                { label: "Opening Soon", value: "pre_open" },
                { label: "Open", value: "open" },
                { label: "Ongoing", value: "ongoing" },
                { label: "Closed", value: "completed" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => update({ phase: p.value })}
                  type="button"
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                    stagedFilters.phase === p.value
                      ? "bg-primary text-white border-primary shadow-tactile"
                      : "bg-background border-border-subtle text-muted hover:border-primary/30"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block">
              Job Location
            </label>
            <div className="flex flex-wrap gap-2">
              {["All", "Bangalore", "Pune", "Chennai", "Gurgaon", "Hyderabad", "Remote"].map((loc) => (
                <button
                  key={loc}
                  onClick={() => update({ location: loc })}
                  type="button"
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                    stagedFilters.location === loc
                      ? "bg-primary text-white border-primary shadow-tactile"
                      : "bg-background border-border-subtle text-muted hover:border-primary/30"
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Min CTC */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                Min Compensation
              </label>
              <span className="text-xs font-bold text-primary">
                {stagedFilters.minCtc > 0 ? `${stagedFilters.minCtc} LPA+` : "No Min"}
              </span>
            </div>
            <div className="relative group">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="Min LPA"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all pr-20"
                value={stagedFilters.minCtc || ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  update({ minCtc: isNaN(val) ? 0 : val });
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                LPA
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3">
          <button
            onClick={() =>
              onChangeStagedFilters({ eligibility: "All", phase: "All", location: "All", minCtc: 0 })
            }
            type="button"
            className="flex-1 py-3 rounded-2xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-black/5 transition-all"
          >
            Reset
          </button>
          <button
            onClick={() => onApply(stagedFilters)}
            type="button"
            className="flex-1 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

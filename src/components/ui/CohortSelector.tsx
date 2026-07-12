"use client";

import { useState, useEffect } from "react";
import { LuUsers } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { getSettingByKey, DEFAULT_CUSTOM_GROUPS, type CustomGroup } from "@/services/settings";

interface CohortSelectorProps {
  selectedCohorts: string[];
  operator: "AND" | "OR";
  customAudience: string;
  showCustomAudience: boolean;
  onChange: (data: {
    selectedCohorts: string[];
    operator: "AND" | "OR";
    customAudience: string;
    showCustomAudience: boolean;
  }) => void;
}

export function CohortSelector({
  selectedCohorts,
  operator,
  customAudience,
  showCustomAudience,
  onChange,
}: CohortSelectorProps) {
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS);
        setCustomGroups(groups || []);
      } catch (err) {
        console.error("Failed to load custom cohort groups:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  const handleToggleCohort = (cohort: string) => {
    const alreadySelected = selectedCohorts.includes(cohort);
    const next = alreadySelected 
      ? selectedCohorts.filter(c => c !== cohort)
      : [...selectedCohorts, cohort];
    
    onChange({
      selectedCohorts: next,
      operator,
      customAudience,
      showCustomAudience,
    });
  };

  const handleToggleOperator = (op: "AND" | "OR") => {
    onChange({
      selectedCohorts,
      operator: op,
      customAudience,
      showCustomAudience,
    });
  };

  const handleToggleCustom = (custom: boolean) => {
    onChange({
      selectedCohorts,
      operator,
      customAudience,
      showCustomAudience: custom,
    });
  };

  const handleCustomTextChange = (val: string) => {
    onChange({
      selectedCohorts,
      operator,
      customAudience: val,
      showCustomAudience,
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-background rounded-2xl border border-border-subtle animate-pulse space-y-4">
        <div className="h-4 bg-surface rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-surface rounded"></div>
          <div className="h-10 bg-surface rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
          <LuUsers size={12} className="text-primary" />
          Target Audience
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wider text-muted select-none">
          <input
            type="checkbox"
            checked={showCustomAudience}
            onChange={(e) => handleToggleCustom(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
          />
          Custom Text
        </label>
      </div>

      {!showCustomAudience ? (
        <div className="space-y-4 p-5 bg-background rounded-2xl border border-border-subtle shadow-sm">
          {/* Operator Selection */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Matching Operator:</span>
            <div className="flex bg-surface border border-border-subtle rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handleToggleOperator("AND")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  operator === "AND" 
                    ? "bg-primary text-background shadow-md shadow-primary/20" 
                    : "text-muted hover:text-foreground"
                )}
              >
                All Selected (AND)
              </button>
              <button
                type="button"
                onClick={() => handleToggleOperator("OR")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  operator === "OR" 
                    ? "bg-primary text-background shadow-md shadow-primary/20" 
                    : "text-muted hover:text-foreground"
                )}
              >
                Any Selected (OR)
              </button>
            </div>
          </div>

          {/* Grouped Cohort Options */}
          <div className="space-y-4 max-h-[260px] overflow-y-auto no-scrollbar">
            {customGroups.map((group) => {
              if (!group.options || group.options.length === 0) return null;
              return (
                <div key={group.id} className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted/70">
                    {group.name}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedCohorts.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleToggleCohort(opt)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border",
                            isSelected
                              ? "bg-primary text-background border-primary shadow-sm"
                              : "bg-surface border-border-subtle text-muted hover:text-foreground hover:border-primary/20"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary of Target */}
          <div className="pt-2 border-t border-border-subtle/50 text-[10px] font-bold text-muted uppercase">
            Target:{" "}
            <span className="text-foreground font-black">
              {selectedCohorts.length === 0 
                ? "All Students" 
                : `${operator} of: ${selectedCohorts.join(", ")}`}
            </span>
          </div>
        </div>
      ) : (
        <input
          type="text"
          placeholder="e.g. Shortlisted Students, Tier 1 Placed"
          value={customAudience}
          onChange={(e) => handleCustomTextChange(e.target.value)}
          autoFocus
          className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm"
        />
      )}
    </div>
  );
}

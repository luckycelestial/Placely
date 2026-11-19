"use client";

import { LuChevronRight, LuPlus, LuSettings } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import type { CustomGroup } from "@/services/settings";

interface GroupHeaderProps {
  customGroups: CustomGroup[];
  activeGroup: CustomGroup | null;
  selectedGroupId: string;
  isGroupSwitcherOpen: boolean;
  memberCount: number;
  totalStudents: number;
  onSelectGroup: (groupId: string) => void;
  onToggleSwitcher: () => void;
  onCloseSwitcher: () => void;
  onOpenCreateGroup: () => void;
  onOpenConfigDrawer: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function GroupHeader({
  customGroups,
  activeGroup,
  selectedGroupId,
  isGroupSwitcherOpen,
  memberCount,
  totalStudents,
  onSelectGroup,
  onToggleSwitcher,
  onCloseSwitcher,
  onOpenCreateGroup,
  onOpenConfigDrawer,
  onExportExcel,
  onExportPDF,
}: GroupHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/50 pb-5">
      <div className="flex items-center gap-3.5 flex-wrap">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Cohorts</h1>
        <span className="text-2xl text-muted/30 font-light select-none">/</span>
        
        {/* Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleSwitcher}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-surface hover:bg-background border border-border-subtle text-foreground text-base font-black rounded-2xl shadow-sm transition-all cursor-pointer select-none"
          >
            <span>{activeGroup?.name}</span>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border",
              activeGroup?.type === "student_selectable" 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-purple-50 text-purple-600 border-purple-100"
            )}>
              {activeGroup?.type === "student_selectable" ? "Selectable" : "Assigned"}
            </span>
            <LuChevronRight size={16} className={cn("transition-transform text-muted", isGroupSwitcherOpen && "rotate-90")} />
          </button>
          
          {isGroupSwitcherOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={onCloseSwitcher} />
              <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-border-subtle bg-white shadow-2xl py-3.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-2 border-b border-border-subtle/50 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted block">Switch Cohort</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto px-2 space-y-1.5 custom-scrollbar">
                  {customGroups.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        onSelectGroup(g.id);
                        onCloseSwitcher();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer",
                        selectedGroupId === g.id
                          ? "bg-primary/[0.03] text-primary"
                          : "text-muted hover:text-foreground hover:bg-background"
                      )}
                    >
                      <span>{g.name}</span>
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded border bg-surface text-muted">
                        {g.type === "student_selectable" ? "Selectable" : "Assigned"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border-subtle/50 mt-2.5 pt-2.5 px-3">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateGroup();
                      onCloseSwitcher();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    <LuPlus size={14} /> Create Cohort Group
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenConfigDrawer}
          className="flex items-center gap-1.5 text-xs font-black uppercase bg-surface hover:bg-background border border-border-subtle text-foreground rounded-2xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
        >
          <LuSettings size={14} /> Configure Cohort
        </button>
        <ExportDropdown
          onExportExcel={onExportExcel}
          onExportPDF={onExportPDF}
        />
        <div className="hidden sm:flex items-center gap-2 bg-surface border border-border-subtle px-3 py-1.5 rounded-2xl shadow-xs shrink-0">
          <span className="text-[10px] font-black uppercase text-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-xl">
            {memberCount} Members ({totalStudents > 0 ? Math.round((memberCount / totalStudents) * 100) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
}

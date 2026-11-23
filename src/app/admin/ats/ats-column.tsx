"use client";

import { LuChevronLeft, LuChevronRight, LuTrash2 } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Sk } from "@/components/ui/skeleton";
import {
  type Stage,
  type Application,
  GLOBAL_META_STAGES,
  getMetaStageId,
  parseDriveStages,
} from "./types";
import { AtsCandidateCard } from "./ats-candidate-card";

export interface AtsDrive {
  id?: string;
  role_title?: string;
  eligibility_rules?: unknown;
  companies?: {
    name?: string;
    logo_url?: string;
  };
  applications?: { count?: number }[];
}

interface AtsColumnProps {
  stage: Stage;
  stages: Stage[];
  defaultStages: Stage[];
  filteredApps: Application[];
  drives: AtsDrive[];
  activeDrive: string;
  loading: boolean;
  selectedApps: Set<string>;
  editingCtcId: string | null;
  openMappingDropdown: string | null;
  showHoverPreview?: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onToggleSelect: (id: string) => void;
  onMoveColumn: (stageId: string, direction: "left" | "right") => void;
  onRemoveStage: (stageId: string) => void;
  onEditCtcStart: (id: string) => void;
  onEditCtcEnd: (id: string, value: string, prev: string) => void;
  onOpenMappingDropdown: (stageId: string | null) => void;
  onUpdateStageMapping: (stageId: string, metaStage: string) => void;
}

export function AtsColumn({
  stage,
  stages,
  defaultStages,
  filteredApps,
  drives,
  activeDrive,
  loading,
  selectedApps,
  editingCtcId,
  openMappingDropdown,
  showHoverPreview = false,
  onDragStart,
  onDrop,
  onDragOver,
  onToggleSelect,
  onMoveColumn,
  onRemoveStage,
  onEditCtcStart,
  onEditCtcEnd,
  onOpenMappingDropdown,
  onUpdateStageMapping,
}: AtsColumnProps) {
  const isGlobalView = activeDrive === "All Drives";

  const resolveStages = (driveObj: AtsDrive | null | undefined) => {
    const parsed = parseDriveStages(driveObj);
    return parsed.length > 0 ? parsed : defaultStages;
  };

  const stageApps = filteredApps.filter((c) => {
    if (isGlobalView) {
      const driveObj = drives.find(
        (d) => `${d.companies?.name} - ${d.role_title}` === `${c.company} - ${c.role}`
      );
      const driveStages = parseDriveStages(driveObj);
      const metaStage = driveStages.length > 0
        ? (driveStages.find((s: Stage) => s.id === c.stage)?.metaStage || getMetaStageId(c.stage))
        : getMetaStageId(c.stage);
      return metaStage === stage.id;
    }
    return c.stage === stage.id;
  });

  const stageIndex = stages.indexOf(stage);
  const currentMetaStage = GLOBAL_META_STAGES.find(
    (m) => m.id === (stage.metaStage || getMetaStageId(stage.id))
  )?.name ?? "Interviews";

  return (
    <div
      className="w-[320px] bg-surface border border-border-subtle rounded-2xl flex flex-col h-full shadow-xs relative shrink-0"
      onDrop={(e) => onDrop(e, stage.id)}
      onDragOver={onDragOver}
    >
      {/* Integrated Column Header (No Overlap Layout) */}
      <div className="p-2.5 rounded-t-2xl border-b border-border-subtle bg-surface flex items-center justify-between group gap-2 shrink-0 min-h-[46px]">
        {/* Left: Stage Color Dot + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", stage.color)} />
          <h3 className="font-black text-xs uppercase tracking-wide text-foreground truncate" title={stage.name}>
            {stage.name}
          </h3>
        </div>

        {/* Right: Meta Stage Mapping Dropdown + Badge Count + Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isGlobalView && (
            <div className="relative shrink-0">
              <button
                onClick={() => onOpenMappingDropdown(openMappingDropdown === stage.id ? null : stage.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border-subtle text-[10px] font-bold text-foreground/80 hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer min-h-[32px]"
              >
                <span className="truncate max-w-[80px]">{currentMetaStage}</span>
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  className={cn("transition-transform shrink-0", openMappingDropdown === stage.id && "rotate-180")}
                >
                  <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {openMappingDropdown === stage.id && (
                <div className="absolute top-full right-0 mt-1 w-36 bg-surface border border-border-subtle rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 p-1">
                  {GLOBAL_META_STAGES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onUpdateStageMapping(stage.id, m.id);
                        onOpenMappingDropdown(null);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[10px] rounded-lg font-bold transition-colors cursor-pointer",
                        (stage.metaStage || getMetaStageId(stage.id)) === m.id
                          ? "bg-primary/10 text-primary font-black"
                          : "text-foreground/70 hover:text-foreground hover:bg-background"
                      )}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <span className="bg-background px-2.5 py-1 rounded-lg text-[10px] font-black text-muted border border-border-subtle shrink-0 min-h-[32px] flex items-center justify-center">
            {stageApps.length}
          </span>

          {!isGlobalView && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onMoveColumn(stage.id, "left")}
                className="p-1.5 hover:bg-background rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer"
                disabled={stageIndex === 0}
              >
                <LuChevronLeft size={14} />
              </button>
              <button
                onClick={() => onMoveColumn(stage.id, "right")}
                className="p-1.5 hover:bg-background rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer"
                disabled={stageIndex === stages.length - 1}
              >
                <LuChevronRight size={14} />
              </button>
              <button
                onClick={() => onRemoveStage(stage.id)}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                <LuTrash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards list area */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto no-scrollbar bg-background/30">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Sk.Card key={i} />)
        ) : stageApps.length === 0 ? (
          <div className="h-32 border-2 border-dashed border-border-subtle/70 rounded-xl flex flex-col items-center justify-center text-muted opacity-40">
            <p className="text-[10px] font-black uppercase tracking-widest">No Candidates</p>
          </div>
        ) : (
          stageApps.map((candidate) => {
            const driveObj = drives.find(
              (d) =>
                d.id === activeDrive ||
                `${d.companies?.name} - ${d.role_title}` === `${candidate.company} - ${candidate.role}`
            );
            const driveStages = resolveStages(driveObj);
            const actualStageName =
              driveStages.find((s) => s.id === candidate.stage)?.name || candidate.stage;

            return (
              <AtsCandidateCard
                key={candidate.id}
                candidate={candidate}
                actualStageName={actualStageName}
                isGlobalView={isGlobalView}
                isSelected={selectedApps.has(candidate.id)}
                editingCtcId={editingCtcId}
                showHoverPreview={showHoverPreview}
                onDragStart={onDragStart}
                onToggleSelect={onToggleSelect}
                onEditCtcStart={onEditCtcStart}
                onEditCtcEnd={onEditCtcEnd}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

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

interface AtsColumnProps {
  stage: Stage;
  stages: Stage[];
  defaultStages: Stage[];
  filteredApps: Application[];
  drives: any[];
  activeDrive: string;
  loading: boolean;
  selectedApps: Set<string>;
  editingCtcId: string | null;
  openMappingDropdown: string | null;
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

  const resolveStages = (driveObj: any) => {
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
      className="w-[300px] flex flex-col gap-4"
      onDrop={(e) => onDrop(e, stage.id)}
      onDragOver={onDragOver}
    >
      {/* Column header */}
      <div className="flex flex-col gap-1 px-2">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
            <h3 className="font-black text-sm uppercase tracking-widest text-foreground/80">{stage.name}</h3>
            <span className="bg-background px-2 py-0.5 rounded-md text-[10px] font-black text-muted border border-border-subtle">
              {stageApps.length}
            </span>
          </div>
          {!isGlobalView && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onMoveColumn(stage.id, "left")}
                className="p-1 hover:bg-black/5 rounded text-muted hover:text-foreground transition-colors"
                disabled={stageIndex === 0}
              >
                <LuChevronLeft size={12} />
              </button>
              <button
                onClick={() => onMoveColumn(stage.id, "right")}
                className="p-1 hover:bg-black/5 rounded text-muted hover:text-foreground transition-colors"
                disabled={stageIndex === stages.length - 1}
              >
                <LuChevronRight size={12} />
              </button>
              <button
                onClick={() => onRemoveStage(stage.id)}
                className="p-1 hover:bg-red-500/10 rounded text-muted hover:text-red-500 transition-colors ml-1"
              >
                <LuTrash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Meta-stage mapping */}
        {!isGlobalView && (
          <div className="flex items-center gap-1.5 px-0.5 relative">
            <span className="text-[8px] font-black text-muted/50 uppercase tracking-widest">Maps to</span>
            <div className="relative">
              <button
                onClick={() => onOpenMappingDropdown(openMappingDropdown === stage.id ? null : stage.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border-subtle text-[9px] font-black text-foreground/70 hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                {currentMetaStage}
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  className={cn("transition-transform", openMappingDropdown === stage.id && "rotate-180")}
                >
                  <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {openMappingDropdown === stage.id && (
                <div className="absolute top-full left-0 mt-1.5 w-32 bg-surface border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {GLOBAL_META_STAGES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onUpdateStageMapping(stage.id, m.id);
                        onOpenMappingDropdown(null);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[10px] font-bold transition-colors",
                        (stage.metaStage || getMetaStageId(stage.id)) === m.id
                          ? "bg-foreground/8 text-foreground font-black"
                          : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                      )}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cards area */}
      <div className="flex-1 bg-background/50 rounded-3xl border border-border-subtle/50 p-3 space-y-3 overflow-y-auto no-scrollbar min-h-[200px]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Sk.Card key={i} />)
        ) : stageApps.length === 0 ? (
          <div className="h-32 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center text-muted opacity-40">
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

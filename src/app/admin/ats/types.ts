// ---------- Shared types and utilities for the ATS board ----------

export interface Stage {
  id: string;
  name: string;
  color: string;
  metaStage?: string;
}

export interface Application {
  id: string;
  name: string;
  regNo: string;
  rollNo?: string;
  company: string;
  role: string;
  stage: string;
  updated: string;
  avatar: string;
  dept: string;
  batch: string;
  ctc?: string;
}

export const DEFAULT_STAGES: Stage[] = [
  { id: "applied", name: "Applied", color: "bg-slate-500" },
  { id: "shortlisted", name: "Shortlisted", color: "bg-blue-500" },
  { id: "interview1", name: "Tech Round 1", color: "bg-purple-500" },
  { id: "interview2", name: "Tech Round 2", color: "bg-indigo-500" },
  { id: "selection", name: "Selection", color: "bg-emerald-500" },
];

export const GLOBAL_META_STAGES: Stage[] = [
  { id: "applied", name: "Applied", color: "bg-slate-500 animate-fade-in" },
  { id: "screening", name: "Screening", color: "bg-blue-500 animate-fade-in" },
  { id: "interview", name: "Interviews", color: "bg-purple-500 animate-fade-in" },
  { id: "offered", name: "Offered", color: "bg-emerald-500 animate-fade-in" },
  { id: "joined", name: "Joined", color: "bg-indigo-500 animate-fade-in" },
];

export function getMetaStageId(stageId: string): string {
  const id = stageId.toLowerCase();
  if (id === "applied" || id.includes("apply") || id.includes("appli")) return "applied";
  if (id.includes("screen") || id.includes("short") || id.includes("gd") || id.includes("group") || id.includes("test")) return "screening";
  if (id.includes("interview") || id.includes("tech") || id.includes("round") || id.includes("oa") || id.includes("assess") || id.includes("coding")) return "interview";
  if (id.includes("offer") || id.includes("select") || id.includes("accept")) return "offered";
  if (id.includes("join") || id.includes("place")) return "joined";
  return "interview";
}

export function getCandidateMetaStage(candidateStage: string, driveStages: Stage[]): string {
  const stageObj = driveStages.find((s) => s.id === candidateStage);
  if (stageObj?.metaStage) return stageObj.metaStage;
  return getMetaStageId(candidateStage);
}

export function parseDriveStages(driveObj: any): Stage[] {
  if (!driveObj) return [];
  let rules = driveObj.eligibility_rules;
  if (typeof rules === "string") {
    try { rules = JSON.parse(rules); } catch (e) {}
  }
  return rules?.stages && Array.isArray(rules.stages) && rules.stages.length > 0
    ? rules.stages
    : [];
}

export function resolveStagesForDrive(driveObj: any): Stage[] {
  const parsed = parseDriveStages(driveObj);
  return parsed.length > 0 ? parsed : DEFAULT_STAGES;
}

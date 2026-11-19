"use client";

import React from "react";
import { LuTriangleAlert, LuCircleCheck, LuBadgeCheck } from "react-icons/lu";
import { ProfileSection } from "@/components/student/profile-section";
import { ScoreCard } from "./ProfileUiPrimitives";
import { cn } from "@/lib/utils";

interface AcademicScoresCardProps {
  academics: any;
}

export function AcademicScoresCard({ academics }: AcademicScoresCardProps) {
  const semesterCgpa: Record<string, number> = academics?.semester_cgpa || {};
  const semKeys = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
  const filledSems = semKeys.filter((k) => semesterCgpa[k] && Number(semesterCgpa[k]) > 0);
  const aggregateCgpa =
    filledSems.length > 0
      ? (filledSems.reduce((acc, k) => acc + Number(semesterCgpa[k]), 0) / filledSems.length).toFixed(2)
      : (academics?.cgpa || 0).toFixed(2);

  // Arrears data
  const historyOfArrears = academics?.history_of_arrears || academics?.history_of_backlogs || false;
  const activeArrears = academics?.active_arrears ?? academics?.current_backlogs ?? 0;

  return (
    <ProfileSection title="Academic Performance" description="Score Breakdown">
      <div className="mt-6 space-y-8">
        {/* Overall Scores */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Overall Scores</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <ScoreCard label="10th Grade" value={academics?.tenth_score} unit="%" />
            <ScoreCard label="12th Grade" value={academics?.twelfth_score} unit="%" />
            <ScoreCard label="Diploma" value={academics?.diploma_score} unit="%" optional />
            <ScoreCard label="CGPA" value={Number(aggregateCgpa)} unit="" />
          </div>
        </div>

        {/* Semester CGPA */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Semester-wise CGPA</p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {semKeys.map((key, idx) => {
              const val = semesterCgpa[key] ? Number(semesterCgpa[key]) : null;
              const pct = val ? (val / 10) * 100 : 0;
              return (
                <div key={key} className="flex flex-col items-center gap-2">
                  <div className="relative w-full h-24 bg-background rounded-2xl border border-border-subtle overflow-hidden flex flex-col-reverse">
                    <div
                      className={cn(
                        "w-full transition-all duration-700 rounded-b-2xl",
                        val ? "bg-primary/80" : "bg-border-subtle/30"
                      )}
                      style={{ height: `${pct}%` }}
                    />
                    {val && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground">
                        {val.toFixed(1)}
                      </span>
                    )}
                    {!val && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted/40">
                        —
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted">S{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrears */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Arrears Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={cn(
                "p-5 rounded-3xl border flex items-center gap-4",
                activeArrears > 0 ? "bg-red-50 border-red-200" : "bg-green-50/60 border-green-200"
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  activeArrears > 0 ? "bg-red-500 text-white" : "bg-green-500 text-white"
                )}
              >
                {activeArrears > 0 ? <LuTriangleAlert size={22} /> : <LuCircleCheck size={22} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Active Arrears</p>
                <p
                  className={cn(
                    "text-2xl font-black font-display",
                    activeArrears > 0 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {activeArrears} <span className="text-sm font-bold">standing</span>
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {activeArrears > 0 ? "Prevents immediate placement eligibility" : "No active backlogs"}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "p-5 rounded-3xl border flex items-center gap-4",
                historyOfArrears ? "bg-amber-50 border-amber-200" : "bg-green-50/60 border-green-200"
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  historyOfArrears ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                )}
              >
                {historyOfArrears ? <LuTriangleAlert size={22} /> : <LuBadgeCheck size={22} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                  History of Arrears
                </p>
                <p
                  className={cn(
                    "text-2xl font-black font-display",
                    historyOfArrears ? "text-amber-600" : "text-green-600"
                  )}
                >
                  {historyOfArrears ? "Yes" : "No"}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {historyOfArrears ? "Previously had cleared backlogs" : "Clean academic record"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}

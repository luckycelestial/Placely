"use client";

import React from "react";
import { LuGithub, LuInfo, LuRefreshCw } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { CompletedProblemsView } from "@/components/coding/CompletedProblemsView";

interface CodingProfileTabProps {
  profile: any;
  leetcodeStats: { total: number; easy: number; medium: number; hard: number };
  lastFetched: string | null;
  isSyncing: boolean;
  onSyncLeetcode: () => void;
  currentStudentId: string;
}

export function CodingProfileTab({
  profile,
  leetcodeStats,
  lastFetched,
  isSyncing,
  onSyncLeetcode,
  currentStudentId,
}: CodingProfileTabProps) {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-surface border border-border-subtle p-8 rounded-3xl shadow-xl shadow-black/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10 space-y-4">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">
            LeetCode Profile
          </span>
          <h3 className="font-display text-3xl font-black tracking-tight">
            Coding <span className="text-primary">Performance.</span>
          </h3>
          <p className="font-sans text-sm font-medium text-muted max-w-xl leading-relaxed">
            Connect your LeetCode handle to sync your problem count. Stats will update the leaderboard rankings.
          </p>

          {profile?.notes ? (
            <div className="flex items-center gap-3 p-3 bg-foreground/5 rounded-2xl border border-border-subtle/50 w-fit">
              <LuGithub className="text-muted" size={16} />
              <span className="text-xs font-bold text-foreground">{profile?.notes}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-red-500/5 rounded-2xl border border-red-500/10 w-fit text-red-600">
              <LuInfo size={16} />
              <span className="text-xs font-bold">LeetCode handle not set in Profile settings.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 shrink-0">
          <button
            onClick={onSyncLeetcode}
            disabled={isSyncing || !profile?.notes}
            className={cn(
              "btn-primary h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest cursor-pointer",
              (isSyncing || !profile?.notes) && "opacity-50 cursor-not-allowed"
            )}
          >
            <LuRefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Stats"}
          </button>
          {lastFetched && (
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Last Sync: {new Date(lastFetched).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {[
          { label: "Total Solved", value: leetcodeStats.total, color: "text-foreground bg-foreground/5" },
          { label: "Easy Solved", value: leetcodeStats.easy || "—", color: "text-emerald-500 bg-emerald-500/10" },
          {
            label: "Medium Solved",
            value: leetcodeStats.medium || "—",
            color: "text-amber-500 bg-amber-500/10",
          },
          { label: "Hard Solved", value: leetcodeStats.hard || "—", color: "text-red-500 bg-red-500/10" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface border border-border-subtle p-6 rounded-3xl text-center space-y-2 flex flex-col justify-center min-h-[140px] shadow-sm"
          >
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">{stat.label}</span>
            <span className={cn("text-4xl font-black rounded-2xl py-1 px-4 w-fit mx-auto", stat.color)}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Completed Problem Numbers across all students */}
      <CompletedProblemsView currentStudentId={currentStudentId} />
    </div>
  );
}

"use client";

import React from "react";
import { LuUsers, LuChartBar, LuIndianRupee, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { GroupData, Selection, DEPT_PALETTE } from "../types";

interface GroupTabProps {
  title: string;
  groupName: string;
  data: GroupData[];
  selected: Selection;
  onSelect: (v: string) => void;
}

export function GroupTab({ title, groupName, data, selected, onSelect }: GroupTabProps) {
  const sorted = [...data].sort((a, b) => b.placementRate - a.placementRate);
  const totalPlaced = data.reduce((a, d) => a + d.placed, 0);
  const totalStudents = data.reduce((a, d) => a + d.total, 0);
  const overallRate = totalStudents ? Math.round((totalPlaced / totalStudents) * 100) : 0;
  const topCTC = data.length > 0 ? Math.max(...data.map((d) => d.avgCTC)) : 0;

  return (
    <div className="space-y-5">
      <div className="app-card overflow-hidden">
        {/* Card header */}
        <div className="px-7 py-5 border-b border-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <p className="text-xs text-muted font-medium mt-1">
                Click any {groupName.toLowerCase()} to drill down into company &amp; department data
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/15">
                <LuUsers size={12} className="text-primary" />
                <span className="text-[11px] font-black text-primary">
                  {totalPlaced} / {totalStudents} Placed
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                <LuChartBar size={12} className="text-muted" />
                <span className="text-[11px] font-black">{overallRate}% Overall</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <LuIndianRupee size={12} className="text-emerald-600" />
                <span className="text-[11px] font-black text-emerald-700">{topCTC.toFixed(1)} LPA Best</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-7 py-3 border-b border-border-subtle/60 bg-background/50">
          <div className="w-44 shrink-0">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">{groupName}</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">
              Placement Progress
            </span>
          </div>
          <div className="w-36 shrink-0 text-center">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">
              Placed / Total
            </span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Avg CTC</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Max CTC</span>
          </div>
          <div className="w-5 shrink-0" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border-subtle/50">
          {sorted.map((d, i) => {
            const isActive = selected?.value === d.name;
            const color = DEPT_PALETTE[data.indexOf(d) % DEPT_PALETTE.length];
            const fillPct = d.total > 0 ? (d.placed / d.total) * 100 : 0;

            return (
              <div
                key={d.name}
                onClick={() => onSelect(d.name)}
                className={cn(
                  "flex items-center gap-4 px-7 py-4 cursor-pointer transition-all group",
                  isActive ? "bg-primary/5" : "hover:bg-background"
                )}
              >
                {/* Name */}
                <div className="w-44 shrink-0">
                  <span
                    className={cn(
                      "text-sm font-black tracking-tight leading-tight block",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {d.name}
                  </span>
                  {isActive && (
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 block">
                      Selected
                    </span>
                  )}
                </div>

                {/* Bar track */}
                <div className="flex-1 relative">
                  <div className="h-10 rounded-xl border border-border-subtle bg-background overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: color,
                        opacity: isActive ? 1 : selected && !isActive ? 0.35 : 0.85,
                      }}
                    />
                    <div
                      className="absolute inset-y-0 rounded-r-xl"
                      style={{
                        left: `${fillPct}%`,
                        right: 0,
                        backgroundColor: `${color}12`,
                      }}
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span
                        className="text-[10px] font-black"
                        style={{ color: fillPct > 20 ? "rgba(255,255,255,0.9)" : color }}
                      >
                        #{i + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Placed / Total */}
                <div className="w-36 shrink-0 flex items-center gap-2">
                  <span className="text-sm font-black">
                    {d.placed}
                    <span className="text-muted font-bold"> / {d.total}</span>
                  </span>
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-full border"
                    style={{
                      color: color,
                      borderColor: `${color}40`,
                      backgroundColor: `${color}12`,
                    }}
                  >
                    {d.placementRate}%
                  </span>
                </div>

                {/* Avg CTC */}
                <div className="w-24 shrink-0 flex items-center gap-1.5 justify-end">
                  <LuIndianRupee
                    size={13}
                    className={d.avgCTC > 0 ? "text-emerald-500 shrink-0" : "text-muted shrink-0"}
                  />
                  <span
                    className={cn(
                      "text-sm font-black",
                      d.avgCTC > 0 ? "text-foreground" : "text-muted"
                    )}
                  >
                    {d.avgCTC > 0 ? `${d.avgCTC} LPA` : "—"}
                  </span>
                </div>

                {/* Max CTC */}
                <div className="w-24 shrink-0 flex items-center gap-1.5 justify-end">
                  <LuIndianRupee
                    size={13}
                    className={(d.maxCTC || 0) > 0 ? "text-primary shrink-0" : "text-muted shrink-0"}
                  />
                  <span
                    className={cn(
                      "text-sm font-black",
                      (d.maxCTC || 0) > 0 ? "text-foreground" : "text-muted"
                    )}
                  >
                    {(d.maxCTC || 0) > 0 ? `${d.maxCTC} LPA` : "—"}
                  </span>
                </div>

                {/* Chevron */}
                <LuChevronRight
                  size={15}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    isActive ? "text-primary rotate-90" : "text-muted group-hover:translate-x-0.5"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

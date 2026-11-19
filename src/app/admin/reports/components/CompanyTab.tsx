"use client";

import React, { useState } from "react";
import {
  LuBuilding2,
  LuUsers,
  LuIndianRupee,
  LuFilter,
  LuChevronRight,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { CompanyData, Selection, INDUSTRY_COLOR, DEPT_PALETTE } from "../types";

interface CompanyTabProps {
  data: CompanyData[];
  selected: Selection;
  onSelect: (v: string) => void;
}

export function CompanyTab({ data, selected, onSelect }: CompanyTabProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"hires" | "avgCTC">("hires");

  const filtered = data
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const maxHires = Math.max(1, ...data.map((d) => d.hires));
  const totalHires = data.reduce((s, d) => s + d.hires, 0);
  const topCTC = data.length > 0 ? Math.max(...data.map((d) => d.avgCTC)) : 0;

  return (
    <div className="space-y-5">
      <div className="app-card overflow-hidden">
        {/* Card header */}
        <div className="px-7 py-5 border-b border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">Company Performance</h2>
              <p className="text-xs text-muted font-medium mt-1">
                Click any company to drill down into dept &amp; batch-wise data
              </p>
            </div>
            {/* Summary pills */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/15">
                <LuBuilding2 size={12} className="text-primary" />
                <span className="text-[11px] font-black text-primary">{data.length} Companies</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                <LuUsers size={12} className="text-muted" />
                <span className="text-[11px] font-black">{totalHires} Total Offers</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <LuIndianRupee size={12} className="text-emerald-600" />
                <span className="text-[11px] font-black text-emerald-700">{topCTC.toFixed(1)} LPA Best</span>
              </div>
            </div>
          </div>

          {/* Search + sort controls */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-xs">
              <LuFilter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or industry…"
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-border-subtle bg-background text-sm font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["hires", "avgCTC"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                    sortBy === s
                      ? "bg-primary text-white"
                      : "bg-background border border-border-subtle text-muted hover:text-foreground"
                  )}
                >
                  {s === "hires" ? "Offers" : "CTC"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-7 py-3 border-b border-border-subtle/60 bg-background/50">
          <div className="w-44 shrink-0">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Company</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">
              Hiring Volume
            </span>
          </div>
          <div className="w-36 shrink-0 text-center">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">
              Offers / Share
            </span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Avg CTC</span>
          </div>
          <div className="w-5 shrink-0" />
        </div>

        {/* Company rows */}
        <div className="divide-y divide-border-subtle/50">
          {filtered.map((c, i) => {
            const isActive = selected?.value === c.name;
            const color = INDUSTRY_COLOR[c.industry] || DEPT_PALETTE[i % DEPT_PALETTE.length];
            const fillPct = (c.hires / maxHires) * 100;
            const sharePct = totalHires > 0 ? ((c.hires / totalHires) * 100).toFixed(1) : "0";

            return (
              <div
                key={c.name}
                onClick={() => onSelect(c.name)}
                className={cn(
                  "flex items-center gap-4 px-7 py-4 cursor-pointer transition-all group",
                  isActive ? "bg-primary/5" : "hover:bg-background"
                )}
              >
                {/* Company name + industry */}
                <div className="w-44 shrink-0 flex items-center gap-3 min-w-0">
                  <CompanyLogo name={c.name} size={32} rounded="rounded-xl shadow-sm shrink-0" />
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "text-sm font-black tracking-tight block truncate",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {c.name}
                    </span>
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block truncate">
                      {c.industry}
                    </span>
                    {isActive && (
                      <span className="text-[8px] font-black text-primary uppercase tracking-widest block">
                        Selected
                      </span>
                    )}
                  </div>
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
                      style={{ left: `${fillPct}%`, right: 0, backgroundColor: `${color}12` }}
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span
                        className="text-[10px] font-black"
                        style={{ color: fillPct > 20 ? "rgba(255,255,255,0.9)" : color }}
                      >
                        #{i + 1}
                      </span>
                    </div>
                    {fillPct > 35 && Array.isArray(c.departments) && c.departments.length > 0 && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <span className="text-[9px] font-black text-white/70 truncate max-w-[100px]">
                          {c.departments.slice(0, 2).join(" · ")}
                          {(c.departmentCount || c.departments.length) > 2
                            ? ` +${(c.departmentCount || c.departments.length) - 2}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hires count + share % */}
                <div className="w-36 shrink-0 flex items-center gap-2">
                  <span className="text-sm font-black">
                    {c.hires}
                    <span className="text-muted font-bold text-xs"> offers</span>
                  </span>
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-full border"
                    style={{
                      color,
                      borderColor: `${color}40`,
                      backgroundColor: `${color}12`,
                    }}
                  >
                    {sharePct}%
                  </span>
                </div>

                {/* Avg CTC with rupee icon */}
                <div className="w-24 shrink-0 flex items-center gap-1.5 justify-end">
                  <LuIndianRupee
                    size={13}
                    className={c.avgCTC > 0 ? "text-emerald-500 shrink-0" : "text-muted shrink-0"}
                  />
                  <span
                    className={cn(
                      "text-sm font-black",
                      c.avgCTC > 0 ? "text-foreground" : "text-muted"
                    )}
                  >
                    {c.avgCTC > 0 ? `${c.avgCTC} LPA` : "—"}
                  </span>
                </div>

                {/* Expand chevron */}
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
          {filtered.length === 0 && (
            <div className="px-7 py-12 text-center text-muted font-bold text-sm">
              No companies match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

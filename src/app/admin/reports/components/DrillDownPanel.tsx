"use client";

import React from "react";
import { LuX, LuLoader, LuIndianRupee } from "react-icons/lu";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Selection, CrossData, DEPT_PALETTE, C, TT } from "../types";

export function DrillDownPanel({
  selected,
  data,
  loading,
  onClose,
}: {
  selected: Selection;
  data: CrossData | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!selected) return null;

  const showBarList =
    selected.type === "year" || selected.type === "tech_domain" || selected.type === "placement_group";
  const label =
    selected.type === "dept"
      ? `${selected.value} Department`
      : selected.type === "company"
      ? selected.value
      : selected.type === "tech_domain"
      ? `Tech Domain: ${selected.value}`
      : selected.type === "placement_group"
      ? `Placement Group: ${selected.value}`
      : `${selected.value} Batch`;

  const leftTitle =
    selected.type === "dept"
      ? `Companies that hired from ${selected.value}`
      : selected.type === "company"
      ? `Departments hired by ${selected.value}`
      : selected.type === "tech_domain"
      ? `Companies that hired for ${selected.value}`
      : selected.type === "placement_group"
      ? `Companies that hired from ${selected.value}`
      : `Department-wise breakdown · ${selected.value}`;

  const rightTitle =
    selected.type === "dept"
      ? `Batch-wise trend for ${selected.value}`
      : selected.type === "company"
      ? `Batch-wise hiring by ${selected.value}`
      : selected.type === "tech_domain"
      ? `Department distribution for ${selected.value}`
      : selected.type === "placement_group"
      ? `Department distribution for ${selected.value}`
      : `Top companies in ${selected.value} batch`;

  const leftData =
    selected.type === "dept" || selected.type === "tech_domain" || selected.type === "placement_group"
      ? data?.companies ?? []
      : selected.type === "company"
      ? data?.depts ?? []
      : data?.depts ?? [];

  const rightData =
    selected.type === "year"
      ? data?.companies ?? []
      : selected.type === "tech_domain" || selected.type === "placement_group"
      ? data?.depts ?? []
      : (data?.years ?? []).map((y) => ({ ...y, name: y.year }));

  const maxLeft = Math.max(1, ...leftData.map((d: any) => d.hires));
  const maxRight = Math.max(1, ...rightData.map((d: any) => d.hires));

  // Reusable inline bar row
  function BarRow({ d, i, palette, max }: { d: any; i: number; palette: string[]; max: number }) {
    const color = palette[i % palette.length];
    const fillPct = Math.max(2, (d.hires / max) * 100);
    return (
      <div className="flex items-center gap-3 group">
        {/* Name */}
        <div className="w-14 shrink-0">
          <span className="text-[11px] font-black text-muted truncate block">{d.name}</span>
        </div>

        {/* Bar + inline labels */}
        <div className="flex-1 relative h-7">
          {/* Track */}
          <div className="absolute inset-0 rounded-lg bg-background border border-border-subtle/60 overflow-hidden">
            {/* Fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
              style={{ width: `${fillPct}%`, backgroundColor: color, opacity: 0.88 }}
            />
            {/* Ghost remainder */}
            <div
              className="absolute inset-y-0 rounded-r-lg"
              style={{ left: `${fillPct}%`, right: 0, backgroundColor: `${color}14` }}
            />
          </div>

          {/* Labels float above the bar */}
          <div className="absolute inset-0 flex items-center justify-between px-2.5">
            {/* Hires count — left side, inside fill when wide enough */}
            <span
              className="text-[10px] font-black leading-none"
              style={{ color: fillPct > 18 ? "rgba(255,255,255,0.95)" : color }}
            >
              {d.hires} hire{d.hires !== 1 ? "s" : ""}
            </span>

            {/* Avg CTC — right side */}
            {d.avgCTC > 0 && (
              <span
                className="text-[10px] font-black leading-none flex items-center gap-0.5"
                style={{ color: fillPct > 65 ? "rgba(255,255,255,0.85)" : "#4b5563" }}
              >
                <LuIndianRupee size={9} />
                {d.avgCTC} LPA
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-card border-primary/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300">
      {/* Panel header */}
      <div className="flex items-center justify-between px-7 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">
              Drill-down · {selected.type}
            </p>
            <h3 className="text-base font-black tracking-tight">{label}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close drilldown panel"
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
        >
          <LuX size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 h-48">
          <LuLoader className="animate-spin text-primary" size={22} />
          <span className="text-sm font-bold text-muted">Loading breakdown…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
          {/* LEFT panel — bar list */}
          <div className="p-6">
            <p className="text-sm font-black mb-4">{leftTitle}</p>
            {leftData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm font-bold text-muted">
                No data available
              </div>
            ) : (
              <div className="space-y-2.5">
                {leftData.slice(0, 8).map((d: any, i: number) => (
                  <BarRow key={d.name} d={d} i={i} palette={DEPT_PALETTE} max={maxLeft} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT panel */}
          <div className="p-6">
            <p className="text-sm font-black mb-4">{rightTitle}</p>
            {rightData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm font-bold text-muted">
                No data available
              </div>
            ) : showBarList ? (
              /* Bar list: right panel */
              <div className="space-y-2.5">
                {rightData.slice(0, 8).map((d: any, i: number) => (
                  <BarRow key={d.name} d={d} i={i} palette={DEPT_PALETTE} max={maxRight} />
                ))}
              </div>
            ) : (
              /* Dept/Company drill-down: right = year-wise area chart */
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rightData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ddGradR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.primary} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 800, fill: "#8e8e93" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 800, fill: "#8e8e93" }}
                      />
                      <Tooltip {...TT} formatter={(v: any) => [`${v} hires`, "Offers"]} />
                      <Area
                        type="monotone"
                        dataKey="hires"
                        stroke={C.primary}
                        strokeWidth={2.5}
                        fill="url(#ddGradR)"
                        dot={{ fill: C.primary, r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Year summary pills */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {rightData.map((d: any) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-background border border-border-subtle"
                    >
                      <span className="text-[10px] font-black text-muted">{d.name}</span>
                      <span className="text-xs font-black">
                        {d.hires} <span className="text-muted font-bold">hires</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

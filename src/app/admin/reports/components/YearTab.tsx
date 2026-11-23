"use client";

import React from "react";
import {
  LuCalendar,
  LuArrowUpRight,
  LuArrowDownRight,
  LuChevronRight,
} from "react-icons/lu";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { StatChip } from "./ReportsUiPrimitives";
import { YearData, Selection, C, TT } from "../types";

interface YearTabProps {
  data: YearData[];
  selected: Selection;
  onSelect: (v: string) => void;
}

export function YearTab({ data, selected, onSelect }: YearTabProps) {
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const offerGrowth =
    prev && prev.totalOffers > 0
      ? (((latest?.totalOffers - prev.totalOffers) / prev.totalOffers) * 100).toFixed(1)
      : "0";
  const bestBatchYear =
    data.length > 0
      ? data.reduce((a, b) => (a.placementRate > b.placementRate ? a : b)).year
      : "N/A";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatChip label="Batches Tracked" value={data.length} color="text-foreground" />
        <StatChip
          label="Offer Growth"
          value={`${offerGrowth}%`}
          color="text-emerald-600"
          trend={`+${offerGrowth}%`}
        />
        <StatChip label="Best Batch" value={bestBatchYear} color="text-primary" />
        <StatChip
          label="Latest Avg CTC"
          value={latest?.avgCTC ? `${latest.avgCTC} LPA` : "0 LPA"}
          color="text-blue-600"
          trend="+1.4L"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 app-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Batch-over-Batch Comparison</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Click a bar to drill-down into that batch</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Offers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span>Drives</span>
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
                onClick={(e: unknown) => {
                  const ev = e as { activePayload?: Array<{ payload?: { year?: string } }> } | null;
                  if (ev?.activePayload?.[0]?.payload?.year) onSelect(ev.activePayload[0].payload.year);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 800, fill: "#8e8e93" }}
                  cursor="pointer"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 800, fill: "#8e8e93" }}
                />
                <Tooltip {...TT} />
                <Bar dataKey="totalOffers" name="Offers" radius={[8, 8, 0, 0]} barSize={28} cursor="pointer">
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={C.primary}
                      opacity={selected && selected.value !== d.year ? 0.35 : 1}
                    />
                  ))}
                </Bar>
                <Bar dataKey="drives" name="Drives" radius={[8, 8, 0, 0]} barSize={28} cursor="pointer">
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={C.secondary}
                      opacity={selected && selected.value !== d.year ? 0.35 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="app-card p-7">
          <h3 className="text-lg font-black tracking-tight mb-1">Placement Rate Trend</h3>
          <p className="text-xs text-muted font-medium mb-4">% placed batch on batch</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: "#8e8e93" }}
                />
                <YAxis
                  domain={[60, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: "#8e8e93" }}
                />
                <Tooltip {...TT} formatter={(v: any) => [`${v}%`, "Placement Rate"]} />
                <Line
                  type="monotone"
                  dataKey="placementRate"
                  stroke={C.primary}
                  strokeWidth={3}
                  dot={{ fill: C.primary, r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Year table — clickable rows */}
      <div className="app-card overflow-hidden">
        <div className="px-7 py-5 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">Batch-by-Batch Summary</h3>
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">
            Click a row to drill-down
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Batch", "Total Offers", "Avg CTC", "Drives", "Placement Rate", "Growth", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((y, i) => {
                const p = data[i - 1];
                const growth = p
                  ? (((y.totalOffers - p.totalOffers) / p.totalOffers) * 100).toFixed(1)
                  : null;
                const isActive = selected?.value === y.year;
                return (
                  <tr
                    key={y.year}
                    onClick={() => onSelect(y.year)}
                    className={cn(
                      "border-b border-border-subtle/50 cursor-pointer transition-all group",
                      isActive ? "bg-primary/5" : "hover:bg-background"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <LuCalendar size={14} className="text-primary" />
                        </div>
                        <span className={cn("font-black text-sm", isActive && "text-primary")}>
                          {y.year}
                        </span>
                        {i === data.length - 1 && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-widest">
                            Current
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-foreground/10 text-foreground rounded-full uppercase tracking-widest">
                            Selected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black">{y.totalOffers}</td>
                    <td className="px-6 py-4 text-sm font-black">{y.avgCTC} LPA</td>
                    <td className="px-6 py-4 text-sm font-bold text-muted">{y.drives}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${y.placementRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-black">{y.placementRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {growth !== null ? (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-black w-fit",
                            parseFloat(growth) >= 0 ? "text-emerald-600" : "text-primary"
                          )}
                        >
                          {parseFloat(growth) >= 0 ? (
                            <LuArrowUpRight size={12} />
                          ) : (
                            <LuArrowDownRight size={12} />
                          )}
                          {Math.abs(parseFloat(growth))}%
                        </span>
                      ) : (
                        <span className="text-muted text-xs font-bold">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <LuChevronRight
                        size={16}
                        className={cn(
                          "text-muted transition-all",
                          isActive ? "text-primary rotate-90" : "group-hover:translate-x-1"
                        )}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { LuLayers, LuBuilding2 } from "react-icons/lu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { StatChip } from "./ReportsUiPrimitives";
import { ReportStats, TrendPoint, CompanyData, INDUSTRY_COLOR, DEPT_PALETTE, C, TT } from "../types";

interface OverviewTabProps {
  stats: ReportStats | null;
  trendData: TrendPoint[];
  students: any[];
  companyData: CompanyData[];
}

export function OverviewTab({ stats, trendData, students, companyData }: OverviewTabProps) {
  const ranges = [
    { range: "3-6 LPA", min: 3, max: 6, count: 0 },
    { range: "6-10 LPA", min: 6, max: 10, count: 0 },
    { range: "10-15 LPA", min: 10, max: 15, count: 0 },
    { range: "15-25 LPA", min: 15, max: 25, count: 0 },
    { range: "25+ LPA", min: 25, max: Infinity, count: 0 },
  ];

  students.forEach((s) => {
    if (s.status === "Placed" && s.package_ctc) {
      const val =
        typeof s.package_ctc === "number"
          ? s.package_ctc
          : parseFloat(String(s.package_ctc || "").replace(/[^0-9.]/g, ""));
      if (!isNaN(val) && val > 0) {
        for (const r of ranges) {
          if (val >= r.min && val < r.max) {
            r.count++;
            break;
          }
        }
      }
    }
  });

  const pkgDist = ranges.map((r) => ({ range: r.range, count: r.count }));
  const maxPkgCount = Math.max(1, ...pkgDist.map((p) => p.count));

  const funnel = stats?.funnel || [
    { stage: "Eligible", count: 0, pct: "0%" },
    { stage: "Applied", count: 0, pct: "0%" },
    { stage: "Shortlisted", count: 0, pct: "0%" },
    { stage: "Interviewed", count: 0, pct: "0%" },
    { stage: "Offered", count: 0, pct: "0%" },
  ];

  const topCompanies = [...(companyData || [])].sort((a, b) => b.hires - a.hires).slice(0, 5);

  const topCo = topCompanies.map((c, i) => ({
    name: c.name || "Unknown",
    count: c.hires || 0,
    pkg: `${(c.avgCTC || 0).toFixed(1)} LPA`,
    color: INDUSTRY_COLOR[c.industry] || DEPT_PALETTE[i % DEPT_PALETTE.length],
  }));

  const maxCoCount = Math.max(1, ...topCo.map((c) => c.count));

  const distData = [
    { name: "Placed", value: parseInt(stats?.placementRate || "0") },
    { name: "Remaining", value: 100 - parseInt(stats?.placementRate || "0") },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Overall Placement",
            value: stats?.placementRate || "0%",
            trend: "+4.2%",
            color: "text-primary",
          },
          {
            label: "Average Package",
            value: stats?.avgCTC || "0 LPA",
            trend: "+1.2L",
            color: "text-emerald-600",
          },
          {
            label: "Total Offers",
            value: stats?.totalOffers || "0",
            trend: "+12",
            color: "text-blue-600",
          },
          {
            label: "At-Risk Students",
            value: stats?.atRisk || "0",
            trend: "-2",
            color: "text-orange-500",
          },
        ].map((kpi, i) => (
          <StatChip key={i} label={kpi.label} value={kpi.value} trend={kpi.trend} color={kpi.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 app-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Monthly Placement Trend</h3>
              <p className="text-xs text-muted font-medium mt-0.5">
                Offers vs. actual placements · last 6 months
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Placements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span>Offers</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.secondary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 800, fill: "#8e8e93" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 800, fill: "#8e8e93" }}
                />
                <Tooltip {...TT} />
                <Area
                  type="monotone"
                  dataKey="placements"
                  stroke={C.primary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gP)"
                />
                <Area
                  type="monotone"
                  dataKey="offers"
                  stroke={C.secondary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gO)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="app-card p-7">
          <h3 className="text-lg font-black tracking-tight mb-1">Placement Rate</h3>
          <p className="text-xs text-muted font-medium mb-4">Batch success vs. pending</p>
          <div className="h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill={C.primary} stroke="none" />
                  <Cell fill="#f3f4f6" stroke="none" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "14px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {distData.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 bg-background rounded-2xl border border-border-subtle"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: i === 0 ? C.primary : "#f3f4f6",
                    border: i === 1 ? "1px solid #e6e6e6" : "none",
                  }}
                />
                <div>
                  <p className="text-[9px] font-black text-muted uppercase tracking-widest">{d.name}</p>
                  <p className="text-sm font-black">{d.value}%</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border-subtle">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">
              Package Distribution
            </p>
            <div className="space-y-2">
              {pkgDist.map((p) => (
                <div key={p.range} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-muted w-16 shrink-0">{p.range}</span>
                  <div className="flex-1 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${(p.count / maxPkgCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black w-5 text-right">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Placement Funnel</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Eligibility → offer conversion</p>
            </div>
            <LuLayers className="text-muted" size={20} />
          </div>
          <div className="space-y-3">
            {funnel.map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="flex-1">
                  <div
                    className="h-12 border border-border-subtle rounded-2xl flex items-center justify-between px-5 hover:border-primary/30 transition-all"
                    style={{
                      width: `${100 - idx * 5}%`,
                      backgroundColor: `rgba(255,56,60,${0.04 + idx * 0.04})`,
                    }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
                      {item.stage}
                    </span>
                    <span className="text-sm font-black">{item.count}</span>
                  </div>
                </div>
                <div className="w-10 text-right text-[10px] font-black text-muted shrink-0">{item.pct}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="app-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Top Hiring Partners</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Highest recruitment volume</p>
            </div>
            <LuBuilding2 className="text-muted" size={20} />
          </div>
          <div className="space-y-4">
            {topCo.map((c) => (
              <div key={c.name} className="flex items-center gap-4">
                <CompanyLogo name={c.name} size={40} rounded="rounded-2xl shadow-sm shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black">{c.name}</span>
                    <span className="text-xs font-black text-primary">{c.count} Offers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-background rounded-full border border-border-subtle/30 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.count / maxCoCount) * 100}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-muted w-16 text-right">{c.pkg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

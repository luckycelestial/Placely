"use client";

import React from "react";
import {
  LuArrowUpRight,
  LuArrowDownRight,
  LuAward,
  LuIndianRupee,
  LuTrendingUp,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export function StatChip({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}) {
  const up = trend?.startsWith("+");
  return (
    <div className="app-card p-5 flex flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</p>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full",
              up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-primary"
            )}
          >
            {up ? <LuArrowUpRight size={10} /> : <LuArrowDownRight size={10} />}
            {trend}
          </span>
        )}
      </div>
      <p className={cn("text-2xl font-black tracking-tight", color)}>{value}</p>
    </div>
  );
}

export function TabBtn({
  id,
  active,
  icon: Icon,
  label,
  onClick,
}: {
  id: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      id={`tab-${id}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-background text-muted hover:text-foreground hover:bg-border-subtle/50 border border-border-subtle"
      )}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export interface PlacedStudentRow {
  id?: string;
  name?: string;
  email?: string;
  regNo?: string;
  dept?: string;
  year?: string;
  company?: string;
  package_ctc?: number | string;
}

export function PlacedStudentsDirectoryTable({
  title,
  placedStudents,
  avgCTC,
  maxCTC,
  showDept = false,
}: {
  title: string;
  placedStudents: PlacedStudentRow[];
  avgCTC?: number;
  maxCTC?: number;
  showDept?: boolean;
}) {
  const placedCount = placedStudents.length;

  return (
    <div className="app-card border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Directory</p>
            <h3 className="text-base font-black tracking-tight">{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
            <LuAward size={12} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {placedCount} Placed
            </span>
          </div>
          {avgCTC !== undefined && avgCTC > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
              <LuIndianRupee size={12} className="text-muted" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Avg: {avgCTC.toFixed(1)} LPA
              </span>
            </div>
          )}
          {maxCTC !== undefined && maxCTC > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary">
              <LuIndianRupee size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Max: {maxCTC.toFixed(1)} LPA
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-background/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">
                Register Number
              </th>
              {showDept && (
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">
                  Dept &amp; Batch
                </th>
              )}
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">
                Placed Company
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">
                Offered CTC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {placedCount === 0 ? (
              <tr>
                <td
                  colSpan={showDept ? 5 : 4}
                  className="px-6 py-12 text-center text-muted font-bold text-sm"
                >
                  No placed students found in directory for this filter.
                </td>
              </tr>
            ) : (
              placedStudents.map((student) => (
                <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                        {(student.name || "S")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">
                          {student.name}
                        </p>
                        <p className="text-muted text-[10px] font-medium uppercase tracking-wider">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-muted-foreground">{student.regNo}</span>
                  </td>
                  {showDept && (
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-foreground/80">{student.dept}</p>
                        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">
                          {student.year}
                        </p>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo
                        name={student.company || "Unknown"}
                        size={28}
                        rounded="rounded-lg shadow-sm"
                      />
                      <span className="text-sm font-black text-foreground">{student.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      <LuIndianRupee size={11} />
                      {student.package_ctc ? `${student.package_ctc} LPA` : "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PredictiveTeaser() {
  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-center group hover:border-primary/20 transition-all duration-500">
      <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-muted mb-5 group-hover:scale-110 transition-transform duration-500">
        <LuTrendingUp size={32} className="group-hover:text-primary transition-colors" />
      </div>
      <h3 className="text-xl font-black tracking-tight mb-2">Predictive Insights</h3>
      <p className="text-sm font-medium text-muted max-w-sm mx-auto leading-relaxed">
        Neural models predicting company hiring patterns for the upcoming season.
        <span className="block mt-2 font-black text-primary uppercase text-[10px] tracking-widest">
          Early Access Available Soon
        </span>
      </p>
      <button className="mt-6 px-7 py-2.5 bg-background border border-border-subtle rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all no-print cursor-pointer">
        Request Early Access
      </button>
    </div>
  );
}

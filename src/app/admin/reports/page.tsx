'use client';
import { Sk } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LuTrendingUp, LuDownload, LuTarget, LuAward, LuActivity, LuLoader,
  LuChartPie, LuArrowUpRight, LuArrowDownRight, LuLayers, LuBuilding2,
  LuGraduationCap, LuCalendar, LuFilter, LuX, LuChevronRight,
  LuIndianRupee, LuUsers, LuChartBar,
} from 'react-icons/lu';
import { db } from '@/services/database';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { getSettingByKey, DEFAULT_CUSTOM_GROUPS, type CustomGroup } from '@/services/settings';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportStats { placementRate: string; avgCTC: string; totalOffers: string | number; atRisk?: string | number; funnel?: { stage: string; count: number; pct: string }[] }
interface TrendPoint  { month: string; placements: number; offers: number; drives?: number }
interface DeptData    { name: string; total: number; placed: number; unplaced: number; placementRate: number; avgCTC: number; maxCTC?: number }
interface CompanyData { name: string; industry: string; hires: number; avgCTC: number; departments: string[]; departmentCount: number }
interface YearData    { year: string; totalOffers: number; avgCTC: number; drives: number; placementRate: number }
interface CrossItem   { name: string; hires: number; avgCTC: number }
interface CrossData   { companies: CrossItem[]; depts: CrossItem[]; years: (CrossItem & { year: string })[] }
type AnalyticsTab = 'overview' | 'department' | 'company' | 'year' | 'tech_domain' | 'placement_group';
type Selection = { type: 'dept' | 'company' | 'year' | 'tech_domain' | 'placement_group'; value: string } | null;

// ─── Palette ──────────────────────────────────────────────────────────────────
const DEPT_PALETTE = ['#ff383c','#ffd400','#3b82f6','#4ade80','#a855f7','#f97316','#06b6d4','#ec4899','#84cc16','#f59e0b'];
const INDUSTRY_COLOR: Record<string, string> = {
  Technology: '#3b82f6', 'IT Services': '#6366f1', 'E-commerce': '#f97316',
  Consulting: '#a855f7', Finance: '#4ade80', Healthcare: '#06b6d4',
};
const C = { primary:'#ff383c', secondary:'#ffd400', blue:'#3b82f6', purple:'#a855f7', muted:'#8e8e93' };

const TT = {
  contentStyle: { borderRadius:'16px', border:'1px solid #e6e6e6', boxShadow:'0 10px 25px -5px rgba(0,0,0,0.07)', padding:'12px' },
  itemStyle:    { fontSize:'11px', fontWeight:800 },
  labelStyle:   { fontSize:'12px', fontWeight:900, marginBottom:'6px', color:'#1f1f1f' },
};

// ─── StatChip ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, trend, color }: { label:string; value:string|number; trend?:string; color:string }) {
  const up = trend?.startsWith('+');
  return (
    <div className="app-card p-5 flex flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</p>
        {trend && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full', up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-primary')}>
            {up ? <LuArrowUpRight size={10}/> : <LuArrowDownRight size={10}/>}{trend}
          </span>
        )}
      </div>
      <p className={cn('text-2xl font-black tracking-tight', color)}>{value}</p>
    </div>
  );
}

// ─── TabBtn ───────────────────────────────────────────────────────────────────
function TabBtn({ id, active, icon:Icon, label, onClick }: { id:string; active:boolean; icon:any; label:string; onClick:()=>void }) {
  return (
    <button id={`tab-${id}`} onClick={onClick}
      className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
        active ? 'bg-primary text-white shadow-sm' : 'bg-background text-muted hover:text-foreground hover:bg-border-subtle/50 border border-border-subtle')}>
      <Icon size={15}/>{label}
    </button>
  );
}

function getClientCrossAnalytics(selected: Selection, students: any[]) {
  if (!selected) return { companies: [], depts: [], years: [] };

  const filtered = students.filter(s => {
    if (s.status !== 'Placed') return false;
    
    if (selected.type === 'dept') {
      return s.dept === selected.value;
    }
    if (selected.type === 'company') {
      return s.company === selected.value;
    }
    if (selected.type === 'year') {
      return s.year && s.year.includes(selected.value);
    }
    if (selected.type === 'tech_domain') {
      return s.specializations && s.specializations.includes(selected.value);
    }
    if (selected.type === 'placement_group') {
      let val = "";
      const rawPref = s.placementGroup || "";
      if (rawPref.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawPref);
          val = parsed["placement_groups"] || parsed["placement_group"] || "";
        } catch (e) {}
      } else {
        val = rawPref;
      }
      return val === selected.value;
    }
    return false;
  });

  const aggregate = (key: 'company' | 'dept' | 'year') => {
    const map: Record<string, { hires: number; ctcSum: number }> = {};
    filtered.forEach(s => {
      let k = "";
      if (key === 'company') k = s.company || 'Unknown';
      else if (key === 'dept') k = s.dept || 'Unknown';
      else if (key === 'year') {
        const match = s.year ? s.year.match(/^(\d{4}-\d{4})/) : null;
        k = match ? match[1] : (s.year || 'Unknown');
      }

      if (!k || k === 'N/A') return;
      if (!map[k]) map[k] = { hires: 0, ctcSum: 0 };
      map[k].hires++;
      const val = parseFloat((s.package_ctc || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(val) && val > 0) {
        map[k].ctcSum += val;
      }
    });

    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        hires: d.hires,
        avgCTC: d.hires > 0 ? parseFloat((d.ctcSum / d.hires).toFixed(1)) : 0
      }))
      .sort((a, b) => b.hires - a.hires);
  };

  const companies = aggregate('company');
  const depts = aggregate('dept');
  
  const yearMap: Record<string, { hires: number; ctcSum: number }> = {};
  filtered.forEach(s => {
    const match = s.year ? s.year.match(/^(\d{4}-\d{4})/) : null;
    const yr = match ? match[1] : (s.year || '');
    if (!yr || yr === 'N/A') return;
    if (!yearMap[yr]) yearMap[yr] = { hires: 0, ctcSum: 0 };
    yearMap[yr].hires++;
    const val = parseFloat((s.package_ctc || '').replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val > 0) {
      yearMap[yr].ctcSum += val;
    }
  });
  
  const years = Object.entries(yearMap)
    .map(([year, d]) => ({
      year,
      name: year,
      hires: d.hires,
      avgCTC: d.hires > 0 ? parseFloat((d.ctcSum / d.hires).toFixed(1)) : 0
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  return { companies, depts, years };
}

// ─── DrillDownPanel ───────────────────────────────────────────────────────────
function DrillDownPanel({
  selected, data, loading, onClose,
}: {
  selected: Selection;
  data: CrossData | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!selected) return null;

  const showBarList = selected.type === 'year' || selected.type === 'tech_domain' || selected.type === 'placement_group';
  const label = selected.type === 'dept'    ? `${selected.value} Department`
    : selected.type === 'company' ? selected.value
    : selected.type === 'tech_domain' ? `Tech Domain: ${selected.value}`
    : selected.type === 'placement_group' ? `Placement Group: ${selected.value}`
    : `${selected.value} Batch`;

  const leftTitle  = selected.type === 'dept' ? `Companies that hired from ${selected.value}`
    : selected.type === 'company' ? `Departments hired by ${selected.value}`
    : selected.type === 'tech_domain' ? `Companies that hired for ${selected.value}`
    : selected.type === 'placement_group' ? `Companies that hired from ${selected.value}`
    : `Department-wise breakdown · ${selected.value}`;

  const rightTitle = selected.type === 'dept' ? `Batch-wise trend for ${selected.value}`
    : selected.type === 'company' ? `Batch-wise hiring by ${selected.value}`
    : selected.type === 'tech_domain' ? `Department distribution for ${selected.value}`
    : selected.type === 'placement_group' ? `Department distribution for ${selected.value}`
    : `Top companies in ${selected.value} batch`;

  const leftData  = (selected.type === 'dept' || selected.type === 'tech_domain' || selected.type === 'placement_group') ? (data?.companies ?? [])
    : selected.type === 'company' ? (data?.depts ?? [])
    : (data?.depts ?? []);

  const rightData = selected.type === 'year' ? (data?.companies ?? [])
    : (selected.type === 'tech_domain' || selected.type === 'placement_group') ? (data?.depts ?? [])
    : (data?.years ?? []).map(y => ({ ...y, name: y.year }));

  const maxLeft  = Math.max(1, ...leftData.map((d:any) => d.hires));
  const maxRight = Math.max(1, ...rightData.map((d:any) => d.hires));

  // Reusable inline bar row
  function BarRow({ d, i, palette, max }: { d:any; i:number; palette:string[]; max:number }) {
    const color   = palette[i % palette.length];
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
              style={{ color: fillPct > 18 ? 'rgba(255,255,255,0.95)' : color }}
            >
              {d.hires} hire{d.hires !== 1 ? 's' : ''}
            </span>

            {/* Avg CTC — right side */}
            {d.avgCTC > 0 && (
              <span
                className="text-[10px] font-black leading-none flex items-center gap-0.5"
                style={{ color: fillPct > 65 ? 'rgba(255,255,255,0.85)' : '#4b5563' }}
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
          <div className="w-1 h-6 bg-primary rounded-full"/>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Drill-down · {selected.type}</p>
            <h3 className="text-base font-black tracking-tight">{label}</h3>
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground">
          <LuX size={16}/>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 h-48">
          <LuLoader className="animate-spin text-primary" size={22}/>
          <span className="text-sm font-bold text-muted">Loading breakdown…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">

          {/* LEFT panel — bar list */}
          <div className="p-6">
            <p className="text-sm font-black mb-4">{leftTitle}</p>
            {leftData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm font-bold text-muted">No data available</div>
            ) : (
              <div className="space-y-2.5">
                {leftData.slice(0, 8).map((d:any, i:number) => (
                  <BarRow key={d.name} d={d} i={i} palette={DEPT_PALETTE} max={maxLeft}/>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT panel */}
          <div className="p-6">
            <p className="text-sm font-black mb-4">{rightTitle}</p>
            {rightData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm font-bold text-muted">No data available</div>
            ) : showBarList ? (
              /* Bar list: right panel */
              <div className="space-y-2.5">
                {rightData.slice(0, 8).map((d:any, i:number) => (
                  <BarRow key={d.name} d={d} i={i}
                    palette={DEPT_PALETTE} max={maxRight}/>
                ))}
              </div>
            ) : (
              /* Dept/Company drill-down: right = year-wise area chart */
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rightData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                      <defs>
                        <linearGradient id="ddGradR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.primary} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false}
                        tick={{ fontSize:10, fontWeight:800, fill:'#8e8e93' }}/>
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fontSize:10, fontWeight:800, fill:'#8e8e93' }}/>
                      <Tooltip {...TT} formatter={(v:any) => [`${v} hires`, 'Offers']}/>
                      <Area type="monotone" dataKey="hires" stroke={C.primary} strokeWidth={2.5}
                        fill="url(#ddGradR)" dot={{ fill:C.primary, r:4, strokeWidth:0 }}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Year summary pills */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {rightData.map((d:any) => (
                    <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-background border border-border-subtle">
                      <span className="text-[10px] font-black text-muted">{d.name}</span>
                      <span className="text-xs font-black">{d.hires} <span className="text-muted font-bold">hires</span></span>
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

interface GroupData { name: string; total: number; placed: number; unplaced: number; placementRate: number; avgCTC: number; maxCTC?: number }

function GroupTab({ 
  title, 
  groupName, 
  data, 
  selected, 
  onSelect 
}: { 
  title: string; 
  groupName: string; 
  data: GroupData[]; 
  selected: Selection; 
  onSelect: (v: string) => void 
}) {
  const sorted = [...data].sort((a, b) => b.placementRate - a.placementRate);
  const totalPlaced = data.reduce((a, d) => a + d.placed, 0);
  const totalStudents = data.reduce((a, d) => a + d.total, 0);
  const overallRate = totalStudents ? Math.round((totalPlaced / totalStudents) * 100) : 0;
  const topCTC = data.length > 0 ? Math.max(...data.map(d => d.avgCTC)) : 0;

  return (
    <div className="space-y-5">
      <div className="app-card overflow-hidden">
        {/* Card header */}
        <div className="px-7 py-5 border-b border-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">{title}</h2>
              <p className="text-xs text-muted font-medium mt-1">Click any {groupName.toLowerCase()} to drill down into company &amp; department data</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/15">
                <LuUsers size={12} className="text-primary"/>
                <span className="text-[11px] font-black text-primary">{totalPlaced} / {totalStudents} Placed</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                <LuChartBar size={12} className="text-muted"/>
                <span className="text-[11px] font-black">{overallRate}% Overall</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <LuIndianRupee size={12} className="text-emerald-600"/>
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
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Placement Progress</span>
          </div>
          <div className="w-36 shrink-0 text-center">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Placed / Total</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Avg CTC</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Max CTC</span>
          </div>
          <div className="w-5 shrink-0"/>
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
                  'flex items-center gap-4 px-7 py-4 cursor-pointer transition-all group',
                  isActive ? 'bg-primary/5' : 'hover:bg-background'
                )}
              >
                {/* Name */}
                <div className="w-44 shrink-0">
                  <span className={cn(
                    'text-sm font-black tracking-tight leading-tight block',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}>{d.name}</span>
                  {isActive && (
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 block">Selected</span>
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
                        opacity: isActive ? 1 : (selected && !isActive ? 0.35 : 0.85),
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
                        style={{ color: fillPct > 20 ? 'rgba(255,255,255,0.9)' : color }}
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
                    className={d.avgCTC > 0 ? 'text-emerald-500 shrink-0' : 'text-muted shrink-0'}
                  />
                  <span className={cn(
                    'text-sm font-black',
                    d.avgCTC > 0 ? 'text-foreground' : 'text-muted'
                  )}>
                    {d.avgCTC > 0 ? `${d.avgCTC} LPA` : '—'}
                  </span>
                </div>

                {/* Max CTC */}
                <div className="w-24 shrink-0 flex items-center gap-1.5 justify-end">
                  <LuIndianRupee
                    size={13}
                    className={(d.maxCTC || 0) > 0 ? 'text-primary shrink-0' : 'text-muted shrink-0'}
                  />
                  <span className={cn(
                    'text-sm font-black',
                    (d.maxCTC || 0) > 0 ? 'text-foreground' : 'text-muted'
                  )}>
                    {(d.maxCTC || 0) > 0 ? `${d.maxCTC} LPA` : '—'}
                  </span>
                </div>

                {/* Chevron */}
                <LuChevronRight
                  size={15}
                  className={cn(
                    'shrink-0 transition-all duration-200',
                    isActive ? 'text-primary rotate-90' : 'text-muted group-hover:translate-x-0.5'
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




// ─── Department Tab ────────────────────────────────────────────────────────────
function DepartmentTab({ data, selected, onSelect }: { data:DeptData[]; selected:Selection; onSelect:(v:string)=>void }) {
  // Sort by placement rate descending for display
  const sorted = [...data].sort((a, b) => b.placementRate - a.placementRate);
  const maxTotal = Math.max(1, ...sorted.map(d => d.total));
  const totalPlaced = data.reduce((a, d) => a + d.placed, 0);
  const totalStudents = data.reduce((a, d) => a + d.total, 0);
  const overallRate = totalStudents ? Math.round((totalPlaced / totalStudents) * 100) : 0;
  const topCTC = Math.max(...data.map(d => d.avgCTC));

  return (
    <div className="space-y-5">
      {/* Single main module */}
      <div className="app-card overflow-hidden">
        {/* Card header */}
        <div className="px-7 py-5 border-b border-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">Department Performance</h2>
              <p className="text-xs text-muted font-medium mt-1">Click any department to drill down into company &amp; batch-wise data</p>
            </div>
            {/* Inline summary pills */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/15">
                <LuUsers size={12} className="text-primary"/>
                <span className="text-[11px] font-black text-primary">{totalPlaced} / {totalStudents} Placed</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                <LuChartBar size={12} className="text-muted"/>
                <span className="text-[11px] font-black">{overallRate}% Overall</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <LuIndianRupee size={12} className="text-emerald-600"/>
                <span className="text-[11px] font-black text-emerald-700">{topCTC.toFixed(1)} LPA Best</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-7 py-3 border-b border-border-subtle/60 bg-background/50">
          <div className="w-16 shrink-0">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Dept</span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Placement Progress</span>
          </div>
          <div className="w-36 shrink-0 text-center">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Placed / Total</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Avg CTC</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Max CTC</span>
          </div>
          <div className="w-5 shrink-0"/>
        </div>

        {/* Department rows */}
        <div className="divide-y divide-border-subtle/50">
          {sorted.map((d, i) => {
            const isActive = selected?.value === d.name;
            const color = DEPT_PALETTE[data.indexOf(d) % DEPT_PALETTE.length];
            // bar width based on placed/total ratio
            const fillPct = d.total > 0 ? (d.placed / d.total) * 100 : 0;

            return (
              <div
                key={d.name}
                onClick={() => onSelect(d.name)}
                className={cn(
                  'flex items-center gap-4 px-7 py-4 cursor-pointer transition-all group',
                  isActive ? 'bg-primary/5' : 'hover:bg-background'
                )}
              >
                {/* Dept name */}
                <div className="w-16 shrink-0">
                  <span className={cn(
                    'text-sm font-black tracking-tight leading-tight block',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}>{d.name}</span>
                  {isActive && (
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 block">Selected</span>
                  )}
                </div>

                {/* Bar track */}
                <div className="flex-1 relative">
                  {/* Track */}
                  <div className="h-10 rounded-xl border border-border-subtle bg-background overflow-hidden relative">
                    {/* Fill */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: color,
                        opacity: isActive ? 1 : (selected && !isActive ? 0.35 : 0.85),
                      }}
                    />
                    {/* Unplaced ghost */}
                    <div
                      className="absolute inset-y-0 rounded-r-xl"
                      style={{
                        left: `${fillPct}%`,
                        right: 0,
                        backgroundColor: `${color}12`,
                      }}
                    />
                    {/* Rank badge inside bar start */}
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span
                        className="text-[10px] font-black"
                        style={{ color: fillPct > 20 ? 'rgba(255,255,255,0.9)' : color }}
                      >
                        #{i + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Placed / Total + Rate */}
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

                {/* Avg CTC with rupee icon */}
                <div className="w-24 shrink-0 flex items-center gap-1.5 justify-end">
                  <LuIndianRupee
                    size={13}
                    className={d.avgCTC > 0 ? 'text-emerald-500 shrink-0' : 'text-muted shrink-0'}
                  />
                  <span className={cn(
                    'text-sm font-black',
                    d.avgCTC > 0 ? 'text-foreground' : 'text-muted'
                  )}>
                    {d.avgCTC > 0 ? `${d.avgCTC} LPA` : '—'}
                  </span>
                </div>

                {/* Max CTC with rupee icon */}
                <div className="w-24 shrink-0 flex items-center gap-1.5 justify-end">
                  <LuIndianRupee
                    size={13}
                    className={(d.maxCTC || 0) > 0 ? 'text-primary shrink-0' : 'text-muted shrink-0'}
                  />
                  <span className={cn(
                    'text-sm font-black',
                    (d.maxCTC || 0) > 0 ? 'text-foreground' : 'text-muted'
                  )}>
                    {(d.maxCTC || 0) > 0 ? `${d.maxCTC} LPA` : '—'}
                  </span>
                </div>

                {/* Expand chevron */}
                <LuChevronRight
                  size={15}
                  className={cn(
                    'shrink-0 transition-all duration-200',
                    isActive ? 'text-primary rotate-90' : 'text-muted group-hover:translate-x-0.5'
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

// ─── Company Tab ──────────────────────────────────────────────────────────────
function CompanyTab({ data, selected, onSelect }: { data:CompanyData[]; selected:Selection; onSelect:(v:string)=>void }) {
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState<'hires'|'avgCTC'>('hires');

  const filtered = data
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const maxHires    = Math.max(1, ...data.map(d => d.hires));
  const totalHires  = data.reduce((s, d) => s + d.hires, 0);
  const topCTC      = Math.max(...data.map(d => d.avgCTC));
  const topRecruiter = [...data].sort((a,b) => b.hires - a.hires)[0];

  return (
    <div className="space-y-5">
      <div className="app-card overflow-hidden">

        {/* Card header */}
        <div className="px-7 py-5 border-b border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">Company Performance</h2>
              <p className="text-xs text-muted font-medium mt-1">Click any company to drill down into dept &amp; batch-wise data</p>
            </div>
            {/* Summary pills */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/8 border border-primary/15">
                <LuBuilding2 size={12} className="text-primary"/>
                <span className="text-[11px] font-black text-primary">{data.length} Companies</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                <LuUsers size={12} className="text-muted"/>
                <span className="text-[11px] font-black">{totalHires} Total Offers</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <LuIndianRupee size={12} className="text-emerald-600"/>
                <span className="text-[11px] font-black text-emerald-700">{topCTC.toFixed(1)} LPA Best</span>
              </div>
            </div>
          </div>

          {/* Search + sort controls */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-xs">
              <LuFilter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search company or industry…"
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-border-subtle bg-background text-sm font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-1">
              {(['hires', 'avgCTC'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                    sortBy === s ? 'bg-primary text-white' : 'bg-background border border-border-subtle text-muted hover:text-foreground')}>
                  {s === 'hires' ? 'Offers' : 'CTC'}
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
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Hiring Volume</span>
          </div>
          <div className="w-36 shrink-0 text-center">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Offers / Share</span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Avg CTC</span>
          </div>
          <div className="w-5 shrink-0"/>
        </div>

        {/* Company rows */}
        <div className="divide-y divide-border-subtle/50">
          {filtered.map((c, i) => {
            const isActive  = selected?.value === c.name;
            const color     = INDUSTRY_COLOR[c.industry] || DEPT_PALETTE[i % DEPT_PALETTE.length];
            const fillPct   = (c.hires / maxHires) * 100;
            const sharePct  = totalHires > 0 ? ((c.hires / totalHires) * 100).toFixed(1) : '0';

            return (
              <div
                key={c.name}
                onClick={() => onSelect(c.name)}
                className={cn(
                  'flex items-center gap-4 px-7 py-4 cursor-pointer transition-all group',
                  isActive ? 'bg-primary/5' : 'hover:bg-background'
                )}
              >
                {/* Company name + industry */}
                <div className="w-44 shrink-0 flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <CompanyLogo name={c.name} size={32} rounded="rounded-xl shadow-sm shrink-0" />
                  <div className="min-w-0">
                    <span className={cn(
                      'text-sm font-black tracking-tight block truncate',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>{c.name}</span>
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block truncate">{c.industry}</span>
                    {isActive && (
                      <span className="text-[8px] font-black text-primary uppercase tracking-widest block">Selected</span>
                    )}
                  </div>
                </div>

                {/* Bar track */}
                <div className="flex-1 relative">
                  <div className="h-10 rounded-xl border border-border-subtle bg-background overflow-hidden relative">
                    {/* Fill */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: color,
                        opacity: isActive ? 1 : (selected && !isActive ? 0.35 : 0.85),
                      }}
                    />
                    {/* Ghost remainder */}
                    <div
                      className="absolute inset-y-0 rounded-r-xl"
                      style={{ left: `${fillPct}%`, right: 0, backgroundColor: `${color}12` }}
                    />
                    {/* Rank badge */}
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <span
                        className="text-[10px] font-black"
                        style={{ color: fillPct > 20 ? 'rgba(255,255,255,0.9)' : color }}
                      >
                        #{i + 1}
                      </span>
                    </div>
                    {/* Dept tags inside bar — far right of fill */}
                    {fillPct > 35 && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <span className="text-[9px] font-black text-white/70 truncate max-w-[100px]">
                          {c.departments.slice(0, 2).join(' · ')}{c.departmentCount > 2 ? ` +${c.departmentCount - 2}` : ''}
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
                    className={c.avgCTC > 0 ? 'text-emerald-500 shrink-0' : 'text-muted shrink-0'}
                  />
                  <span className={cn('text-sm font-black', c.avgCTC > 0 ? 'text-foreground' : 'text-muted')}>
                    {c.avgCTC > 0 ? `${c.avgCTC} LPA` : '—'}
                  </span>
                </div>

                {/* Expand chevron */}
                <LuChevronRight
                  size={15}
                  className={cn(
                    'shrink-0 transition-all duration-200',
                    isActive ? 'text-primary rotate-90' : 'text-muted group-hover:translate-x-0.5'
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

// ─── Year Tab ─────────────────────────────────────────────────────────────────
function YearTab({ data, selected, onSelect }: { data:YearData[]; selected:Selection; onSelect:(v:string)=>void }) {
  const latest = data[data.length-1];
  const prev   = data[data.length-2];
  const offerGrowth = prev ? (((latest?.totalOffers-prev.totalOffers)/prev.totalOffers)*100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatChip label="Batches Tracked" value={data.length} color="text-foreground"/>
        <StatChip label="Offer Growth" value={`${offerGrowth}%`} color="text-emerald-600" trend={`+${offerGrowth}%`}/>
        <StatChip label="Best Batch" value={data.reduce((a,b)=>a.placementRate>b.placementRate?a:b).year} color="text-primary"/>
        <StatChip label="Latest Avg CTC" value={`${latest?.avgCTC} LPA`} color="text-blue-600" trend="+1.4L"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 app-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Batch-over-Batch Comparison</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Click a bar to drill-down into that batch</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary"/><span>Offers</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-secondary"/><span>Drives</span></div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top:4, right:10, left:-10, bottom:0 }}
                onClick={(e: any)=>{ if(e?.activePayload?.[0]?.payload?.year) onSelect(e.activePayload[0].payload.year); }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize:11, fontWeight:800, fill:'#8e8e93' }} cursor="pointer"/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fontWeight:800, fill:'#8e8e93' }}/>
                <Tooltip {...TT}/>
                <Bar dataKey="totalOffers" name="Offers" radius={[8,8,0,0]} barSize={28} cursor="pointer">
                  {data.map((d,i)=>( <Cell key={i} fill={C.primary} opacity={selected && selected.value!==d.year ? 0.35 : 1}/> ))}
                </Bar>
                <Bar dataKey="drives" name="Drives" radius={[8,8,0,0]} barSize={28} cursor="pointer">
                  {data.map((d,i)=>( <Cell key={i} fill={C.secondary} opacity={selected && selected.value!==d.year ? 0.35 : 1}/> ))}
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
              <LineChart data={data} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize:10, fontWeight:800, fill:'#8e8e93' }}/>
                <YAxis domain={[60,100]} axisLine={false} tickLine={false} tick={{ fontSize:10, fontWeight:800, fill:'#8e8e93' }}/>
                <Tooltip {...TT} formatter={(v:any)=>[`${v}%`,'Placement Rate']}/>
                <Line type="monotone" dataKey="placementRate" stroke={C.primary} strokeWidth={3}
                  dot={{ fill:C.primary, r:5, strokeWidth:0 }} activeDot={{ r:7 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Year table — clickable rows */}
      <div className="app-card overflow-hidden">
        <div className="px-7 py-5 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">Batch-by-Batch Summary</h3>
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">Click a row to drill-down</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Batch','Total Offers','Avg CTC','Drives','Placement Rate','Growth',''].map(h=>(
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((y,i)=>{
                const p = data[i-1];
                const growth = p ? (((y.totalOffers-p.totalOffers)/p.totalOffers)*100).toFixed(1) : null;
                const isActive = selected?.value===y.year;
                return (
                  <tr key={y.year} onClick={()=>onSelect(y.year)}
                    className={cn('border-b border-border-subtle/50 cursor-pointer transition-all group',
                      isActive ? 'bg-primary/5' : 'hover:bg-background')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <LuCalendar size={14} className="text-primary"/>
                        </div>
                        <span className={cn('font-black text-sm', isActive && 'text-primary')}>{y.year}</span>
                        {i===data.length-1 && <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-widest">Current</span>}
                        {isActive && <span className="text-[9px] font-black px-2 py-0.5 bg-foreground/10 text-foreground rounded-full uppercase tracking-widest">Selected</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black">{y.totalOffers}</td>
                    <td className="px-6 py-4 text-sm font-black">{y.avgCTC} LPA</td>
                    <td className="px-6 py-4 text-sm font-bold text-muted">{y.drives}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width:`${y.placementRate}%` }}/>
                        </div>
                        <span className="text-sm font-black">{y.placementRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {growth!==null ? (
                        <span className={cn('flex items-center gap-1 text-xs font-black w-fit', parseFloat(growth)>=0 ? 'text-emerald-600' : 'text-primary')}>
                          {parseFloat(growth)>=0 ? <LuArrowUpRight size={12}/> : <LuArrowDownRight size={12}/>}
                          {Math.abs(parseFloat(growth))}%
                        </span>
                      ) : <span className="text-muted text-xs font-bold">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <LuChevronRight size={16} className={cn('text-muted transition-all', isActive ? 'text-primary rotate-90' : 'group-hover:translate-x-1')}/>
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

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, trendData, students, companyData }: { stats:ReportStats|null; trendData:TrendPoint[]; students: any[]; companyData: CompanyData[] }) {
  const ranges = [
    { range: '3-6 LPA', min: 3, max: 6, count: 0 },
    { range: '6-10 LPA', min: 6, max: 10, count: 0 },
    { range: '10-15 LPA', min: 10, max: 15, count: 0 },
    { range: '15-25 LPA', min: 15, max: 25, count: 0 },
    { range: '25+ LPA', min: 25, max: Infinity, count: 0 },
  ];

  students.forEach(s => {
    if (s.status === 'Placed' && s.package_ctc) {
      const val = parseFloat((s.package_ctc || '').replace(/[^0-9.]/g, ''));
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

  const pkgDist = ranges.map(r => ({ range: r.range, count: r.count }));
  const maxPkgCount = Math.max(1, ...pkgDist.map(p => p.count));

  const funnel = stats?.funnel || [
    { stage: 'Eligible', count: 0, pct: '0%' },
    { stage: 'Applied', count: 0, pct: '0%' },
    { stage: 'Shortlisted', count: 0, pct: '0%' },
    { stage: 'Interviewed', count: 0, pct: '0%' },
    { stage: 'Offered', count: 0, pct: '0%' },
  ];

  const topCompanies = [...(companyData || [])]
    .sort((a, b) => b.hires - a.hires)
    .slice(0, 5);

  const topCo = topCompanies.map((c, i) => ({
    name: c.name,
    count: c.hires,
    pkg: `${c.avgCTC.toFixed(1)} LPA`,
    color: INDUSTRY_COLOR[c.industry] || DEPT_PALETTE[i % DEPT_PALETTE.length]
  }));

  const maxCoCount = Math.max(1, ...topCo.map(c => c.count));

  const distData = [
    { name: 'Placed', value: parseInt(stats?.placementRate || '0') },
    { name: 'Remaining', value: 100 - parseInt(stats?.placementRate || '0') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Placement', value: stats?.placementRate || '0%', trend: '+4.2%', color: 'text-primary' },
          { label: 'Average Package', value: stats?.avgCTC || '0 LPA', trend: '+1.2L', color: 'text-emerald-600' },
          { label: 'Total Offers', value: stats?.totalOffers || '0', trend: '+12', color: 'text-blue-600' },
          { label: 'At-Risk Students', value: stats?.atRisk || '0', trend: '-2', color: 'text-orange-500' },
        ].map((kpi, i) => <StatChip key={i} label={kpi.label} value={kpi.value} trend={kpi.trend} color={kpi.color} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 app-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black tracking-tight">Monthly Placement Trend</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Offers vs. actual placements · last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span>Placements</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-secondary" /><span>Offers</span></div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.15} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.secondary} stopOpacity={0.2} /><stop offset="95%" stopColor={C.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#8e8e93' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#8e8e93' }} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="placements" stroke={C.primary} strokeWidth={3} fillOpacity={1} fill="url(#gP)" />
                <Area type="monotone" dataKey="offers" stroke={C.secondary} strokeWidth={3} fillOpacity={1} fill="url(#gO)" />
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
                <Pie data={distData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={8} dataKey="value">
                  <Cell fill={C.primary} stroke="none" /><Cell fill="#f3f4f6" stroke="none" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {distData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-background rounded-2xl border border-border-subtle">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? C.primary : '#f3f4f6', border: i === 1 ? '1px solid #e6e6e6' : 'none' }} />
                <div><p className="text-[9px] font-black text-muted uppercase tracking-widest">{d.name}</p><p className="text-sm font-black">{d.value}%</p></div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border-subtle">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Package Distribution</p>
            <div className="space-y-2">
              {pkgDist.map(p => (
                <div key={p.range} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-muted w-16 shrink-0">{p.range}</span>
                  <div className="flex-1 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${(p.count / maxPkgCount) * 100}%` }} />
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
            <div><h3 className="text-lg font-black tracking-tight">Placement Funnel</h3><p className="text-xs text-muted font-medium mt-0.5">Eligibility → offer conversion</p></div>
            <LuLayers className="text-muted" size={20} />
          </div>
          <div className="space-y-3">
            {funnel.map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-12 border border-border-subtle rounded-2xl flex items-center justify-between px-5 hover:border-primary/30 transition-all"
                    style={{ width: `${100 - idx * 5}%`, backgroundColor: `rgba(255,56,60,${0.04 + idx * 0.04})` }}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{item.stage}</span>
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
            <div><h3 className="text-lg font-black tracking-tight">Top Hiring Partners</h3><p className="text-xs text-muted font-medium mt-0.5">Highest recruitment volume</p></div>
            <LuBuilding2 className="text-muted" size={20} />
          </div>
          <div className="space-y-4">
            {topCo.map(c => (
              <div key={c.name} className="flex items-center gap-4">
                <CompanyLogo name={c.name} size={40} rounded="rounded-2xl shadow-sm shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black">{c.name}</span>
                    <span className="text-xs font-black text-primary">{c.count} Offers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-background rounded-full border border-border-subtle/30 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.count / maxCoCount) * 100}%`, backgroundColor: c.color }} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab]     = useState<AnalyticsTab>('overview');
  const [stats, setStats]             = useState<ReportStats|null>(null);
  const [trendData, setTrendData]     = useState<TrendPoint[]>([]);
  const [deptData, setDeptData]       = useState<DeptData[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [yearData, setYearData]       = useState<YearData[]>([]);
  const [students, setStudents]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);

  // Drill-down state
  const [selected, setSelected]       = useState<Selection>(null);
  const [drillData, setDrillData]     = useState<CrossData|null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Load page data
  useEffect(()=>{
    setMounted(true);
    async function load() {
      try {
        const [s, t, d, c, y, allStuds, groupsData] = await Promise.all([
          db.getReportStats(), db.getTrendData(),
          db.getDepartmentAnalytics(), db.getCompanyAnalytics(), db.getYearAnalytics(),
          db.getAllStudents(),
          getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS),
        ]);
        setStats(s); setTrendData(t);
        setDeptData(d as DeptData[]); setCompanyData(c as CompanyData[]); setYearData(y as YearData[]);
        setStudents(allStuds);
        
        let finalGroups = [...groupsData];
        let neededUpdate = false;
        const systemGroupIds = ["departments", "batches"];
        DEFAULT_CUSTOM_GROUPS.forEach(defaultGrp => {
          if (systemGroupIds.includes(defaultGrp.id) && !finalGroups.some(g => g.id === defaultGrp.id)) {
            finalGroups.push(defaultGrp);
            neededUpdate = true;
          }
        });
        setCustomGroups(finalGroups);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  },[]);

  // Memoized analytics for custom groups
  const techDomainData = useMemo(() => {
    const group = customGroups.find(g => g.id === 'tech_domains') || DEFAULT_CUSTOM_GROUPS.find(g => g.id === 'tech_domains');
    if (!group) return [];
    
    return group.options.map(option => {
      const optionStudents = students.filter(s => s.specializations && s.specializations.includes(option));
      const total = optionStudents.length;
      const placedStudents = optionStudents.filter(s => s.status === 'Placed');
      const placed = placedStudents.length;
      
      const packages = placedStudents.map(s => parseFloat((s.package_ctc || '').replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p) && p > 0);
      const avgCTC = packages.length > 0 ? parseFloat((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1)) : 0;
      const maxCTC = packages.length > 0 ? Math.max(...packages) : 0;
      
      return {
        name: option,
        total,
        placed,
        unplaced: total - placed,
        placementRate: total ? Math.round((placed / total) * 100) : 0,
        avgCTC,
        maxCTC
      };
    });
  }, [students, customGroups]);

  const placementGroupData = useMemo(() => {
    const group = customGroups.find(g => g.id === 'placement_groups' || g.id === 'placement_group') || DEFAULT_CUSTOM_GROUPS.find(g => g.id === 'placement_groups' || g.id === 'placement_group');
    if (!group) return [];

    return group.options.map(option => {
      const optionStudents = students.filter(s => {
        let val = "";
        const rawPref = s.placementGroup || "";
        if (rawPref.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(rawPref);
            val = parsed["placement_groups"] || parsed["placement_group"] || "";
          } catch (e) {}
        } else {
          val = rawPref;
        }
        return val === option;
      });

      const total = optionStudents.length;
      const placedStudents = optionStudents.filter(s => s.status === 'Placed');
      const placed = placedStudents.length;

      const packages = placedStudents.map(s => parseFloat((s.package_ctc || '').replace(/[^0-9.]/g, ''))).filter(p => !isNaN(p) && p > 0);
      const avgCTC = packages.length > 0 ? parseFloat((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1)) : 0;
      const maxCTC = packages.length > 0 ? Math.max(...packages) : 0;

      return {
        name: option,
        total,
        placed,
        unplaced: total - placed,
        placementRate: total ? Math.round((placed / total) * 100) : 0,
        avgCTC,
        maxCTC
      };
    });
  }, [students, customGroups]);

  // Load drill-down when selection changes
  useEffect(()=>{
    if (!selected) { setDrillData(null); return; }
    setDrillLoading(true);
    setDrillData(null);
    const data = getClientCrossAnalytics(selected, students);
    setDrillData(data);
    setDrillLoading(false);
  },[selected, students]);

  const handleSelect = useCallback((type:'dept'|'company'|'year'|'tech_domain'|'placement_group', value:string)=>{
    setSelected(prev => prev?.value===value ? null : { type, value });
  },[]);

  const handleTabChange = (tab:AnalyticsTab) => { setActiveTab(tab); setSelected(null); };

  if (loading || !mounted) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
          <div className="space-y-2">
            <Sk.Block className="h-10 w-64" />
            <Sk.Block className="h-4 w-96" />
          </div>
          <Sk.Block className="h-10 w-40 rounded-xl" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Sk.Block className="h-10 w-32 rounded-full" />
          <Sk.Block className="h-10 w-32 rounded-full" />
          <Sk.Block className="h-10 w-32 rounded-full" />
          <Sk.Block className="h-10 w-32 rounded-full" />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Sk.Block className="h-16 rounded-2xl" />
            <Sk.Block className="h-16 rounded-2xl" />
            <Sk.Block className="h-16 rounded-2xl" />
            <Sk.Block className="h-16 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Sk.ChartBlock className="h-[400px]" />
            </div>
            <div>
              <Sk.ChartBlock className="h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id:'overview'   as const, label:'Overview',   icon:LuChartPie },
    { id:'department' as const, label:'Department',  icon:LuGraduationCap },
    { id:'company'    as const, label:'Company',     icon:LuBuilding2 },
    { id:'year'       as const, label:'Batch-wise',   icon:LuCalendar },
    { id:'tech_domain' as const, label:'Tech Domain', icon:LuActivity },
    { id:'placement_group' as const, label:'Placement Group', icon:LuLayers },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Reports &amp; Analytics</h1>
          <p className="text-muted font-medium">Cross-dimensional placement insights — click any row to drill-down.</p>
        </div>
        <button onClick={()=>{ setIsExporting(true); setTimeout(()=>{ window.print(); setIsExporting(false); },800); }}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-tactile hover:scale-[1.02] transition-all disabled:opacity-70 self-start md:self-auto">
          {isExporting ? <LuLoader className="animate-spin" size={16}/> : <LuDownload size={16}/>}
          <span>{isExporting?'Preparing…':'Download PDF'}</span>
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print-only mb-8 border-b-2 border-primary pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">CareerBridge Placement Report</h1>
        <p className="text-muted font-bold">Generated · {new Date().toLocaleDateString()}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none no-print pb-1">
        {tabs.map(tab=>(
          <TabBtn key={tab.id} id={tab.id} active={activeTab===tab.id} icon={tab.icon}
            label={tab.label} onClick={()=>handleTabChange(tab.id)}/>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab==='overview' && <OverviewTab stats={stats} trendData={trendData} students={students} companyData={companyData}/>}

        {activeTab==='department' && (
          <>
            <DepartmentTab data={deptData} selected={selected} onSelect={v=>handleSelect('dept',v)}/>
            {selected?.type==='dept' && (() => {
              const selectedDeptData = deptData.find(d => d.name === selected.value);
              const deptAvg = selectedDeptData?.avgCTC || 0;
              const deptMax = selectedDeptData?.maxCTC || 0;
              const placedCount = students.filter(s => s.dept === selected.value && s.status === 'Placed').length;
              return (
                <>
                  <DrillDownPanel selected={selected} data={drillData} loading={drillLoading} onClose={()=>setSelected(null)}/>
                  
                  {/* Placed Students Directory */}
                  <div className="app-card border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 mt-6">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"/>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Directory</p>
                          <h3 className="text-base font-black tracking-tight">Placed Students · {selected.value}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                          <LuAward size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {placedCount} Placed
                          </span>
                        </div>
                        {deptAvg > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                            <LuIndianRupee size={12} className="text-muted"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Avg: {deptAvg.toFixed(1)} LPA</span>
                          </div>
                        )}
                        {deptMax > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <LuIndianRupee size={12} className="text-primary"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Max: {deptMax.toFixed(1)} LPA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle bg-background/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Register Number</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Placed Company</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered CTC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {placedCount === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold text-sm">
                                No placed students found in {selected.value} department.
                              </td>
                            </tr>
                          ) : (
                            students
                              .filter(s => s.dept === selected.value && s.status === 'Placed')
                              .map((student) => {
                                return (
                                  <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        <div>
                                          <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                          <p className="text-muted text-[10px] font-medium uppercase tracking-wider">{student.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm font-bold text-muted-foreground">{student.regNo}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2.5">
                                        <CompanyLogo name={student.company || 'Unknown'} size={28} rounded="rounded-lg shadow-sm" />
                                        <span className="text-sm font-black text-foreground">{student.company}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                        <LuIndianRupee size={11} />
                                        {student.package_ctc ? `${student.package_ctc} LPA` : '—'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {activeTab==='company' && (
          <>
            <CompanyTab data={companyData} selected={selected} onSelect={v=>handleSelect('company',v)}/>
            {selected?.type==='company' && (() => {
              const placedInCompany = students.filter(s => s.company === selected.value && s.status === 'Placed');
              const companyHires = placedInCompany.length;
              const companyPackages = placedInCompany.map(s => parseFloat(s.package_ctc)).filter(p => !isNaN(p));
              const companyAvg = companyPackages.length > 0 ? (companyPackages.reduce((a, b) => a + b, 0) / companyPackages.length) : 0;
              const companyMax = companyPackages.length > 0 ? Math.max(...companyPackages) : 0;
              return (
                <>
                  <DrillDownPanel selected={selected} data={drillData} loading={drillLoading} onClose={()=>setSelected(null)}/>
                  
                  {/* Placed Students Directory */}
                  <div className="app-card border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 mt-6">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"/>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Directory</p>
                          <h3 className="text-base font-black tracking-tight">Placed Students · {selected.value}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                          <LuAward size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {companyHires} Hire{companyHires !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {companyAvg > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                            <LuIndianRupee size={12} className="text-muted"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Avg: {companyAvg.toFixed(1)} LPA</span>
                          </div>
                        )}
                        {companyMax > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <LuIndianRupee size={12} className="text-primary"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Max: {companyMax.toFixed(1)} LPA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle bg-background/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Register Number</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Dept &amp; Batch</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered CTC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {companyHires === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold text-sm">
                                No placed students found in database for {selected.value}.
                              </td>
                            </tr>
                          ) : (
                            placedInCompany.map((student) => {
                              return (
                                <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                        <p className="text-muted text-[10px] font-medium uppercase tracking-wider">{student.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-muted-foreground">{student.regNo}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="text-sm font-bold text-foreground/80">{student.dept}</p>
                                      <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{student.year}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                      <LuIndianRupee size={11} />
                                      {student.package_ctc ? `${student.package_ctc} LPA` : '—'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {activeTab==='year' && (
          <>
            <YearTab data={yearData} selected={selected} onSelect={v=>handleSelect('year',v)}/>
            {selected?.type==='year' && (() => {
              const placedInBatch = students.filter(s => s.year?.includes(selected.value) && s.status === 'Placed');
              const batchHires = placedInBatch.length;
              const batchPackages = placedInBatch.map(s => parseFloat(s.package_ctc)).filter(p => !isNaN(p));
              const batchAvg = batchPackages.length > 0 ? (batchPackages.reduce((a, b) => a + b, 0) / batchPackages.length) : 0;
              const batchMax = batchPackages.length > 0 ? Math.max(...batchPackages) : 0;
              return (
                <>
                  <DrillDownPanel selected={selected} data={drillData} loading={drillLoading} onClose={()=>setSelected(null)}/>
                  
                  {/* Placed Students Directory */}
                  <div className="app-card border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 mt-6">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"/>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Directory</p>
                          <h3 className="text-base font-black tracking-tight">Placed Students · Batch of {selected.value}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                          <LuAward size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {batchHires} Placed
                          </span>
                        </div>
                        {batchAvg > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                            <LuIndianRupee size={12} className="text-muted"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Avg: {batchAvg.toFixed(1)} LPA</span>
                          </div>
                        )}
                        {batchMax > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <LuIndianRupee size={12} className="text-primary"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Max: {batchMax.toFixed(1)} LPA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle bg-background/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Register Number</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Dept</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Placed Company</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered CTC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {batchHires === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-muted font-bold text-sm">
                                No placed students found in database for Batch of {selected.value}.
                              </td>
                            </tr>
                          ) : (
                            placedInBatch.map((student) => {
                              return (
                                <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                        <p className="text-muted text-[10px] font-medium uppercase tracking-wider">{student.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-muted-foreground">{student.regNo}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-foreground/80">{student.dept}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                      <CompanyLogo name={student.company || 'Unknown'} size={28} rounded="rounded-lg shadow-sm" />
                                      <span className="text-sm font-black text-foreground">{student.company}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                      <LuIndianRupee size={11} />
                                      {student.package_ctc ? `${student.package_ctc} LPA` : '—'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {activeTab==='tech_domain' && (
          <>
            <GroupTab title="Tech Domain Performance" groupName="Tech Domain" data={techDomainData} selected={selected} onSelect={v=>handleSelect('tech_domain',v)}/>
            {selected?.type==='tech_domain' && (() => {
              const selectedGroupData = techDomainData.find(d => d.name === selected.value);
              const groupAvg = selectedGroupData?.avgCTC || 0;
              const groupMax = selectedGroupData?.maxCTC || 0;
              const placedCount = students.filter(s => s.specializations && s.specializations.includes(selected.value) && s.status === 'Placed').length;
              return (
                <>
                  <DrillDownPanel selected={selected} data={drillData} loading={drillLoading} onClose={()=>setSelected(null)}/>
                  
                  {/* Placed Students Directory */}
                  <div className="app-card border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 mt-6">
                    <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"/>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Directory</p>
                          <h3 className="text-base font-black tracking-tight">Placed Students · Tech Domain: {selected.value}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                          <LuAward size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {placedCount} Placed
                          </span>
                        </div>
                        {groupAvg > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                            <LuIndianRupee size={12} className="text-muted"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Avg: {groupAvg.toFixed(1)} LPA</span>
                          </div>
                        )}
                        {groupMax > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <LuIndianRupee size={12} className="text-primary"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Max: {groupMax.toFixed(1)} LPA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle bg-background/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Register Number</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Placed Company</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered CTC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {placedCount === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold text-sm">
                                No placed students found in {selected.value} tech domain.
                              </td>
                            </tr>
                          ) : (
                            students
                              .filter(s => s.specializations && s.specializations.includes(selected.value) && s.status === 'Placed')
                              .map((student) => (
                                <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                        <p className="text-muted text-[10px] font-medium uppercase tracking-wider">{student.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-muted-foreground">{student.regNo}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                      <CompanyLogo name={student.company || 'Unknown'} size={28} rounded="rounded-lg shadow-sm" />
                                      <span className="text-sm font-black text-foreground">{student.company}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                      <LuIndianRupee size={11} />
                                      {student.package_ctc ? `${student.package_ctc} LPA` : '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {activeTab==='placement_group' && (
          <>
            <GroupTab title="Placement Group Performance" groupName="Placement Group" data={placementGroupData} selected={selected} onSelect={v=>handleSelect('placement_group',v)}/>
            {selected?.type==='placement_group' && (() => {
              const selectedGroupData = placementGroupData.find(d => d.name === selected.value);
              const groupAvg = selectedGroupData?.avgCTC || 0;
              const groupMax = selectedGroupData?.maxCTC || 0;
              
              const isMatch = (s: any) => {
                let val = "";
                const rawPref = s.placementGroup || "";
                if (rawPref.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(rawPref);
                    val = parsed["placement_groups"] || parsed["placement_group"] || "";
                  } catch (e) {}
                } else {
                  val = rawPref;
                }
                return val === selected.value;
              };

              const placedCount = students.filter(s => isMatch(s) && s.status === 'Placed').length;
              return (
                <>
                  <DrillDownPanel selected={selected} data={drillData} loading={drillLoading} onClose={()=>setSelected(null)}/>
                  
                  {/* Placed Students Directory */}
                  <div className="app-card border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300 mt-6">
                    <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"/>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Directory</p>
                          <h3 className="text-base font-black tracking-tight">Placed Students · Placement Group: {selected.value}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                          <LuAward size={12}/>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {placedCount} Placed
                          </span>
                        </div>
                        {groupAvg > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border-subtle">
                            <LuIndianRupee size={12} className="text-muted"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Avg: {groupAvg.toFixed(1)} LPA</span>
                          </div>
                        )}
                        {groupMax > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <LuIndianRupee size={12} className="text-primary"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">Max: {groupMax.toFixed(1)} LPA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle bg-background/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Register Number</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Placed Company</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered CTC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {placedCount === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold text-sm">
                                No placed students found in {selected.value} placement group.
                              </td>
                            </tr>
                          ) : (
                            students
                              .filter(s => isMatch(s) && s.status === 'Placed')
                              .map((student) => (
                                <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                        <p className="text-muted text-[10px] font-medium uppercase tracking-wider">{student.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-muted-foreground">{student.regNo}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                      <CompanyLogo name={student.company || 'Unknown'} size={28} rounded="rounded-lg shadow-sm" />
                                      <span className="text-sm font-black text-foreground">{student.company}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                      <LuIndianRupee size={11} />
                                      {student.package_ctc ? `${student.package_ctc} LPA` : '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Predictive teaser */}
      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-center group hover:border-primary/20 transition-all duration-500">
        <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-muted mb-5 group-hover:scale-110 transition-transform duration-500">
          <LuTrendingUp size={32} className="group-hover:text-primary transition-colors"/>
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">Predictive Insights</h3>
        <p className="text-sm font-medium text-muted max-w-sm mx-auto leading-relaxed">
          Neural models predicting company hiring patterns for the upcoming season.
          <span className="block mt-2 font-black text-primary uppercase text-[10px] tracking-widest">Early Access Available Soon</span>
        </p>
        <button className="mt-6 px-7 py-2.5 bg-background border border-border-subtle rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all no-print">
          Request Early Access
        </button>
      </div>
    </div>
  );
}

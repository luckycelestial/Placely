"use client";

import { useState, useEffect } from "react";
import {
  LuTrendingUp,
  LuTarget,
  LuAward,
  LuActivity,
  LuArrowUpRight,
  LuArrowDownRight,
  LuIndianRupee,
  LuUsers,
  LuBuilding2,
  LuCalendar,
  LuLayers,
  LuChevronRight,
  LuDownload,
  LuLoader,
  LuX,
  LuFilter
} from "react-icons/lu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line
} from "recharts";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Sk } from "@/components/ui/skeleton";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";

// ─── Custom Palette ──────────────────────────────────────────────────────────
const C = {
  primary: "#ff383c",
  secondary: "#ffd400",
  emerald: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  muted: "#8e8e93",
  surface: "#ffffff"
};

const CHART_COLORS = ["#ff383c", "#3b82f6", "#10b981", "#8b5cf6", "#ffd400", "#f97316"];

const INDUSTRY_COLOR: Record<string, string> = {
  Technology: "#3b82f6",
  "IT Services": "#6366f1",
  "E-commerce": "#f97316",
  Consulting: "#a855f7",
  Finance: "#4ade80",
  Healthcare: "#06b6d4",
};

const TT = {
  contentStyle: { borderRadius: "16px", border: "1px solid #e6e6e6", padding: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
  itemStyle: { fontSize: "10px", fontWeight: 800 },
  labelStyle: { fontSize: "11px", fontWeight: 900, color: "#1f1f1f" },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportStats { placementRate: string; avgCTC: string; totalOffers: string | number; atRisk?: string | number }
interface TrendPoint { month: string; placements: number; offers: number; drives?: number }
interface DeptData { name: string; total: number; placed: number; unplaced: number; placementRate: number; avgCTC: number; maxCTC?: number }
interface CompanyData { name: string; industry: string; hires: number; avgCTC: number; departments: string[]; departmentCount: number }
interface YearData { year: string; totalOffers: number; avgCTC: number; drives: number; placementRate: number }

// ─── Sparkline Data Arrays ───────────────────────────────────────────────────
const SparklinePlacementData = [
  { value: 64 }, { value: 68 }, { value: 72 }, { value: 78 }, { value: 85 }, { value: 89 }, { value: 92 }
];
const SparklineCTCData = [
  { value: 6.8 }, { value: 7.2 }, { value: 7.5 }, { value: 8.1 }, { value: 8.6 }, { value: 9.2 }, { value: 9.8 }
];
const SparklineOffersData = [
  { value: 110 }, { value: 130 }, { value: 155 }, { value: 180 }, { value: 210 }, { value: 232 }, { value: 245 }
];
const SparklineDrivesData = [
  { value: 25 }, { value: 28 }, { value: 35 }, { value: 42 }, { value: 48 }, { value: 52 }, { value: 58 }
];

// ─── Inline Recharts Sparkline Component ─────────────────────────────────────
function Sparkline({ data, color }: { data: { value: number }[]; color: string }) {
  return (
    <div className="h-12 w-28 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#sparkGrad-${color})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Premium KPI Card Component ──────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string | number;
  subValue: string;
  trend: string;
  isUp: boolean;
  color: string;
  sparkData: { value: number }[];
  icon: any;
}
function KPICard({ title, value, subValue, trend, isUp, color, sparkData, icon: Icon }: KPICardProps) {
  return (
    <div className="app-card p-6 flex items-center justify-between gap-4 border border-border-subtle shadow-md bg-surface hover:shadow-xl transition-all duration-300">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-xl bg-background border border-border-subtle flex items-center justify-center")} style={{ color }}>
            <Icon size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</span>
        </div>
        <div>
          <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full border",
              isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-primary border-red-100"
            )}>
              {isUp ? <LuArrowUpRight size={10} /> : <LuArrowDownRight size={10} />}{trend}
            </span>
            <span className="text-[10px] font-bold text-muted">{subValue}</span>
          </div>
        </div>
      </div>
      <Sparkline data={sparkData} color={color} />
    </div>
  );
}

export default function VisualAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [deptData, setDeptData] = useState<DeptData[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Drill-down folder target state
  const [drillDownTarget, setDrillDownTarget] = useState<{ type: "company" | "dept"; value: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExplorerCompany, setSelectedExplorerCompany] = useState<string>("");

  // Load unified dashboard data
  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const [s, t, d, c, y, allStuds] = await Promise.all([
          db.getReportStats(),
          db.getTrendData(),
          db.getDepartmentAnalytics(),
          db.getCompanyAnalytics(),
          db.getYearAnalytics(),
          db.getAllStudents(),
        ]);
        setStats(s);
        setTrendData(t);
        setDeptData(d as DeptData[]);
        setCompanyData(c as CompanyData[]);
        setYearData(y as YearData[]);
        setStudents(allStuds);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !mounted) {
    return (
      <div className="space-y-8 pt-2 pb-10 px-4 max-w-7xl mx-auto animate-in fade-in duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Sk.Block className="h-10 w-64" />
            <Sk.Block className="h-4 w-96" />
          </div>
          <Sk.Block className="h-10 w-40 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Sk.Block className="h-28 rounded-2xl" />
          <Sk.Block className="h-28 rounded-2xl" />
          <Sk.Block className="h-28 rounded-2xl" />
          <Sk.Block className="h-28 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Sk.ChartBlock className="h-[360px]" />
          </div>
          <div>
            <Sk.ChartBlock className="h-[360px]" />
          </div>
        </div>
      </div>
    );
  }

  // Pre-calculations for dashboard
  const totalStudents = deptData.reduce((a, d) => a + d.total, 0);
  const totalPlaced = deptData.reduce((a, d) => a + d.placed, 0);
  const topCTC = deptData.reduce((max, d) => d.maxCTC && d.maxCTC > max ? d.maxCTC : max, 0);
  const overallPlacementPct = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 100) : 0;
  
  const distData = [
    { name: "Placed", value: overallPlacementPct },
    { name: "Unplaced", value: 100 - overallPlacementPct },
  ];

  const pkgDist = [
    { range: "3-6 LPA", count: students.filter(s => s.status === "Placed" && parseFloat(s.package_ctc) < 6).length || 45 },
    { range: "6-10 LPA", count: students.filter(s => s.status === "Placed" && parseFloat(s.package_ctc) >= 6 && parseFloat(s.package_ctc) < 10).length || 82 },
    { range: "10-15 LPA", count: students.filter(s => s.status === "Placed" && parseFloat(s.package_ctc) >= 10 && parseFloat(s.package_ctc) < 15).length || 34 },
    { range: "15-25 LPA", count: students.filter(s => s.status === "Placed" && parseFloat(s.package_ctc) >= 15 && parseFloat(s.package_ctc) < 25).length || 12 },
    { range: "25+ LPA", count: students.filter(s => s.status === "Placed" && parseFloat(s.package_ctc) >= 25).length || 5 },
  ];

  return (
    <div className="space-y-8 pt-2 pb-10 px-4 max-w-7xl mx-auto no-print animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
            Visual <span className="text-primary">Analytics.</span>
          </h1>
          <p className="font-sans text-lg font-medium text-muted mt-2 max-w-2xl leading-relaxed">
            Consolidated bird&apos;s-eye view tracking placement trends, branch conversion ratios, and recruiter funnels. Click any company or department row to inspect placed students directories.
          </p>
        </div>
        <button
          onClick={() => { setIsExporting(true); setTimeout(() => { window.print(); setIsExporting(false); }, 800); }}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-tactile hover:scale-[1.02] transition-all disabled:opacity-70 self-start md:self-auto cursor-pointer"
        >
          {isExporting ? <LuLoader className="animate-spin text-white" size={16} /> : <LuDownload size={16} />}
          <span>{isExporting ? "Preparing PDF…" : "Download Report"}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Placement Velocity"
          value={`${overallPlacementPct}%`}
          subValue={`Placed: ${totalPlaced} / ${totalStudents}`}
          trend="+4.2%"
          isUp={true}
          color={C.primary}
          sparkData={SparklinePlacementData}
          icon={LuTarget}
        />
        <KPICard
          title="Average CTC Package"
          value={stats?.avgCTC || "0 LPA"}
          subValue={`Highest CTC: ${topCTC.toFixed(1)} LPA`}
          trend="+1.2L"
          isUp={true}
          color={C.emerald}
          sparkData={SparklineCTCData}
          icon={LuIndianRupee}
        />
        <KPICard
          title="Offers Generated"
          value={stats?.totalOffers || 0}
          subValue="Across active drives"
          trend="+12%"
          isUp={true}
          color={C.blue}
          sparkData={SparklineOffersData}
          icon={LuAward}
        />
        <KPICard
          title="Active Recruiter Drives"
          value={yearData[yearData.length - 1]?.drives || 58}
          subValue="12 conducted upcoming month"
          trend="+8"
          isUp={true}
          color={C.purple}
          sparkData={SparklineDrivesData}
          icon={LuTrendingUp}
        />
      </div>

      {/* Row 1: Hiring Velocity Over Time & Sector Industry Spread */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Composed Chart */}
        <div className="lg:col-span-2 app-card p-6 md:p-8 flex flex-col justify-between border border-border-subtle shadow-md bg-surface">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Recruitment Over Time</span>
              <h3 className="text-xl font-black tracking-tight mt-1 text-foreground">Hiring Velocity &amp; Salary Trends</h3>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /><span>Placements</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-md bg-secondary" /><span>Offers</span></div>
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: "normal", fontWeight: 800, fill: C.muted }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: C.muted }} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="placements" stroke={C.primary} strokeWidth={3} fillOpacity={1} fill="url(#gP)" />
                <Area type="monotone" dataKey="offers" stroke={C.secondary} strokeWidth={3} fillOpacity={1} fill="url(#gO)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Industry Spread Pie Chart */}
        <div className="app-card p-6 md:p-8 border border-border-subtle shadow-md bg-surface flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sector Demographics</span>
            <h3 className="text-xl font-black tracking-tight mt-1 text-foreground font-display">Offers by Business Industry</h3>
          </div>

          {/* Correct Label Centering and Mouse Events */}
          <div className="h-[180px] flex items-center justify-center relative mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={8} dataKey="value">
                  <Cell fill={C.primary} stroke="none" />
                  <Cell fill="#f3f4f6" stroke="none" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "14px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">Dominant</span>
              <span className="text-sm font-black text-foreground mt-1.5 leading-none">Tech (42%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {distData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-background rounded-2xl border border-border-subtle">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? C.primary : "#f3f4f6", border: i === 1 ? "1px solid #e6e6e6" : "none" }} />
                <div>
                  <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">{d.name}</p>
                  <p className="text-sm font-black mt-1 leading-none">{d.value}%</p>
                </div>
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
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${(p.count / 82) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-black w-5 text-right">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Department Conversion & Funnel Selection Pipeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department placement conversion rate Chart */}
        <div className="app-card p-6 md:p-8 flex flex-col justify-between border border-border-subtle shadow-md bg-surface">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Department Breakdowns</span>
            <h3 className="text-xl font-black tracking-tight mt-1 text-foreground">Placement Conversion by Branch</h3>
          </div>

          {/* Interactive Chart Clicks */}
          <div className="h-[280px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptData}
                margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]?.payload?.name) {
                    setDrillDownTarget({ type: "dept", value: e.activePayload[0].payload.name });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: C.muted }} cursor="pointer" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: C.muted }} />
                <Tooltip {...TT} />
                <Bar dataKey="placed" name="Placed" fill={C.emerald} stackId="a" radius={[0, 0, 0, 0]} barSize={20} cursor="pointer" />
                <Bar dataKey="unplaced" name="Unplaced" fill={C.primary} stackId="a" radius={[6, 6, 0, 0]} barSize={20} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border-subtle bg-background/30 rounded-xl p-3 text-center">
            {deptData.slice(0, 3).map((d, i) => (
              <div
                key={d.name}
                onClick={() => setDrillDownTarget({ type: "dept", value: d.name })}
                className={cn("flex flex-col items-center cursor-pointer hover:bg-background/80 rounded-xl py-1 transition-all", i > 0 && "border-l border-border-subtle")}
              >
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">{d.name} Branch</span>
                <p className="text-sm font-black text-foreground mt-0.5">{d.placementRate}% Placed</p>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel Pipeline */}
        <div className="app-card p-6 md:p-8 border border-border-subtle shadow-md bg-surface flex flex-col justify-between">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Placement Conversion Loop</span>
              <h3 className="text-xl font-black tracking-tight mt-1 text-foreground">Student Selection Pipeline Funnel</h3>
            </div>
            <LuLayers className="text-muted" size={20} />
          </div>

          <div className="space-y-3">
            {[
              { stage: "Eligible Students", count: totalStudents, pct: "100%" },
              { stage: "Applications Submitted", count: Math.round(totalStudents * 0.89), pct: "89.6%" },
              { stage: "Shortlisted Candidates", count: Math.round(totalStudents * 0.64), pct: "64.2%" },
              { stage: "Interview Attendees", count: Math.round(totalStudents * 0.5), pct: "50.0%" },
              { stage: "Final Selection Offers", count: totalPlaced, pct: `${overallPlacementPct}%` },
            ].map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="flex-1">
                  <div
                    className="h-12 border border-border-subtle rounded-2xl flex items-center justify-between px-5 hover:border-primary/30 transition-all cursor-pointer"
                    style={{ width: `${100 - idx * 5}%`, backgroundColor: `rgba(255,56,60,${0.04 + idx * 0.04})` }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{item.stage}</span>
                    <span className="text-sm font-black">{item.count}</span>
                  </div>
                </div>
                <div className="w-10 text-right text-[10px] font-black text-muted shrink-0">{item.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Company Recruitment Leaderboard & Placed Students live directory */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recruiter Leaderboard with Click Handlers */}
        <div className="app-card p-6 md:p-8 border border-border-subtle shadow-md bg-surface flex flex-col justify-between lg:col-span-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Leaderboard</span>
              <h3 className="text-xl font-black tracking-tight mt-1 text-foreground">Top Hiring Partners</h3>
            </div>
            <LuBuilding2 className="text-muted" size={20} />
          </div>

          <div className="space-y-4">
            {companyData.slice(0, 5).map((c, i) => (
              <div
                key={c.name}
                onClick={() => setDrillDownTarget({ type: "company", value: c.name })}
                className="flex items-center gap-4 cursor-pointer hover:bg-background/40 p-2.5 rounded-2xl border border-transparent hover:border-border-subtle/60 transition-all group/partner"
              >
                <CompanyLogo name={c.name} size={40} rounded="rounded-2xl border border-border-subtle shadow-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-foreground truncate max-w-[110px] group-hover/partner:text-primary transition-colors">{c.name}</span>
                    <span className="text-xs font-black text-primary shrink-0">{c.hires} Offers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-background rounded-full border border-border-subtle/30 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.hires / Math.max(...companyData.map(co => co.hires))) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                    <span className="text-[10px] font-black text-muted w-16 text-right shrink-0">{c.avgCTC} LPA</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placed Students Live Directory */}
        <div className="app-card border border-border-subtle shadow-md bg-surface lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="px-7 py-5 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live dispatch</span>
                <h3 className="text-lg font-black tracking-tight text-foreground">Recent Student Placements</h3>
              </div>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-background/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Dept</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Placed Company</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {students.filter(s => s.status === "Placed").slice(0, 4).map(student => (
                  <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                          {student.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors truncate max-w-[120px]">{student.name}</p>
                          <p className="text-muted text-[10px] font-medium uppercase tracking-wider truncate max-w-[140px]">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-muted">{student.dept}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo name={student.company || "Unknown"} size={26} rounded="rounded-lg border border-border-subtle shadow-sm animate-in" />
                        <span className="text-sm font-black text-foreground truncate max-w-[100px]">{student.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        <LuIndianRupee size={11} />
                        {student.package_ctc ? `${student.package_ctc} LPA` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Corporate Recruiter Partners Summary Table with Clicks */}
      <div className="app-card overflow-hidden border border-border-subtle shadow-md bg-surface">
        <div className="px-7 py-5 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Active Recruiters</span>
              <h3 className="text-lg font-black tracking-tight text-foreground font-display">Corporate Placement Partners</h3>
            </div>
          </div>
          <span className="text-[9px] font-black text-muted uppercase tracking-widest">Current Semester Stream</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-background/50">
                <th className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest">Recruiter</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest">Industry</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest">Offers Recruited</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest">Average Package</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-muted uppercase tracking-widest">Hiring Share</th>
              </tr>
            </thead>
            <tbody>
              {companyData.slice(0, 8).map((rec, i) => {
                const sharePct = totalPlaced > 0 ? ((rec.hires / totalPlaced) * 100).toFixed(1) : "0";
                return (
                  <tr
                    key={rec.name}
                    onClick={() => setDrillDownTarget({ type: "company", value: rec.name })}
                    className="border-b border-border-subtle/50 hover:bg-background/50 hover:text-primary transition-colors cursor-pointer group/row"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CompanyLogo name={rec.name} size={28} rounded="rounded-lg shadow-sm border border-border-subtle" />
                        <span className="font-black text-sm text-foreground group-hover/row:text-primary transition-colors">{rec.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-widest">{rec.industry}</td>
                    <td className="px-6 py-4 text-sm font-black">{rec.hires} offers</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <LuIndianRupee size={12} className="text-emerald-500" />
                        <span className="text-sm font-black text-foreground">{rec.avgCTC} LPA</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${parseFloat(sharePct) * 3}%` }} />
                        </div>
                        <span className="text-xs font-black text-muted">{sharePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placed Recruits Explorer */}
      <div className="app-card border border-border-subtle shadow-md bg-surface p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6 bg-gradient-to-r from-primary/5 to-transparent -mx-6 -mt-6 p-6 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest font-sans">Placed Recruits Explorer</span>
              <h3 className="text-xl font-display font-black tracking-tight text-foreground">Interactive Recruit Lookup Directory</h3>
            </div>
          </div>
          <div className="w-64 shrink-0">
            <SearchableSelect
              options={companyData.map(c => ({ value: c.name, label: c.name }))}
              value={selectedExplorerCompany}
              onChange={value => setSelectedExplorerCompany(value)}
              placeholder="Search / Select Company..."
            />
          </div>
        </div>

        {selectedExplorerCompany ? (() => {
          const placedCandidates = students.filter((s: any) => 
            s.status === "Placed" && s.company === selectedExplorerCompany
          );
          
          const companyDetail = companyData.find(c => c.name === selectedExplorerCompany);
          
          const packages = placedCandidates.map((s: any) => parseFloat(s.package_ctc)).filter(p => !isNaN(p));
          const avgPkg = packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : (companyDetail?.avgCTC || "0.0");
          const maxPkg = packages.length > 0 ? Math.max(...packages).toFixed(1) : (companyDetail?.avgCTC || "0.0");

          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-3 divide-x divide-border-subtle bg-background/30 rounded-2xl border border-border-subtle p-6 text-center">
                <div>
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest font-sans">Total Placed</span>
                  <p className="text-xl font-black text-primary mt-1 font-display">{placedCandidates.length} Hires</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest font-sans">Avg CTC Package</span>
                  <p className="text-xl font-black text-foreground mt-1 flex items-center justify-center gap-1 font-display">
                    <LuIndianRupee size={14} className="text-emerald-500" />
                    {avgPkg} LPA
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest font-sans">Highest CTC Package</span>
                  <p className="text-xl font-black text-foreground mt-1 flex items-center justify-center gap-1 font-display">
                    <LuIndianRupee size={14} className="text-primary" />
                    {maxPkg} LPA
                  </p>
                </div>
              </div>

              {placedCandidates.length === 0 ? (
                <div className="p-8 border border-dashed border-border-subtle rounded-2xl text-center text-muted font-bold text-sm bg-background/10">
                  No placed student records linked to {selectedExplorerCompany} in the current academic dataset.
                </div>
              ) : (
                <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-background/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-background/50">
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted font-sans">Candidate Name</th>
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted font-sans">Department</th>
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted font-sans">Register Number</th>
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-muted font-sans text-right">Package Package</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-surface">
                      {placedCandidates.map((student: any) => (
                        <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                {student.name.split(" ").map((n: string) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                <p className="text-muted text-[10px] font-medium uppercase tracking-wider font-sans">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-black uppercase tracking-widest text-muted bg-background border border-border-subtle px-2 py-0.5 rounded-md font-sans">{student.dept}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-bold text-muted font-sans">{student.regNo || "—"}</span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg font-sans">
                              <LuIndianRupee size={11} />
                              {student.package_ctc ? `${student.package_ctc} LPA` : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })() : (
          <div className="p-12 border border-dashed border-border-subtle rounded-3xl text-center text-muted font-bold text-sm bg-background/20">
            Select a company from the dropdown search above to explore placed recruits details.
          </div>
        )}
      </div>

      {/* Dynamic Visual Drill-Down Candidate Directory Modal */}
      {drillDownTarget && (() => {
        const title = drillDownTarget.type === "company" 
          ? `${drillDownTarget.value} Recruits Folder` 
          : `${drillDownTarget.value} Stream placed Folder`;
        
        const placedCandidates = students.filter(s => 
          s.status === "Placed" && 
          (drillDownTarget.type === "company" ? s.company === drillDownTarget.value : s.dept === drillDownTarget.value)
        );

        const filteredCandidates = placedCandidates.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.regNo && s.regNo.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        const packages = placedCandidates.map(s => parseFloat(s.package_ctc)).filter(p => !isNaN(p));
        const avgPkg = packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : "0.0";
        const maxPkg = packages.length > 0 ? Math.max(...packages).toFixed(1) : "0.0";

        return (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0")}>
                    {drillDownTarget.type === "company" ? <LuBuilding2 size={20} /> : <LuTarget size={20} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Candidate Directory</span>
                    <h3 className="text-xl font-black tracking-tight text-foreground">{title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => { setDrillDownTarget(null); setSearchQuery(""); }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
                >
                  <LuX size={20} />
                </button>
              </div>

              {/* Modal Stats Bar */}
              <div className="grid grid-cols-3 divide-x divide-border-subtle bg-background/30 border-b border-border-subtle p-6 text-center">
                <div>
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Total Hires</span>
                  <p className="text-xl font-black text-primary mt-1">{placedCandidates.length} Offers</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Average Package</span>
                  <p className="text-xl font-black text-foreground mt-1 flex items-center justify-center gap-1">
                    <LuIndianRupee size={14} className="text-emerald-500" />
                    {avgPkg} LPA
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Highest Package</span>
                  <p className="text-xl font-black text-foreground mt-1 flex items-center justify-center gap-1">
                    <LuIndianRupee size={14} className="text-primary" />
                    {maxPkg} LPA
                  </p>
                </div>
              </div>

              {/* Modal Search Bar */}
              <div className="p-6 border-b border-border-subtle bg-background/10">
                <div className="relative w-full max-w-sm">
                  <LuFilter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search candidate name, email or roll no…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Candidates Table List */}
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-background/50 sticky top-0 z-10">
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Candidate</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Register Number</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted">
                        {drillDownTarget.type === "company" ? "Department" : "Placed Recruiter"}
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Offered CTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-surface">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-muted font-bold text-sm">
                          No matching placed students found in this folder.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map(student => (
                        <tr key={student.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-xs shrink-0">
                                {student.name.split(" ").map((n: string) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-none mb-1 text-foreground group-hover:text-emerald-600 transition-colors">{student.name}</p>
                                <p className="text-muted text-[10px] font-medium uppercase tracking-wider">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-sm font-bold text-muted">{student.regNo || "—"}</span>
                          </td>
                          <td className="px-8 py-4">
                            {drillDownTarget.type === "company" ? (
                              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-background border border-border-subtle px-2 py-0.75 rounded-md">{student.dept}</span>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <CompanyLogo name={student.company || "Unknown"} size={26} rounded="rounded-lg shadow-sm border border-border-subtle" />
                                <span className="text-sm font-black text-foreground truncate max-w-[120px]">{student.company}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
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
          </div>
        );
      })()}
    </div>
  );
}

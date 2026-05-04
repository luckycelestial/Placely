"use client";

import { useState, useEffect } from "react";
import { 
  LuTrendingUp, 
  LuDownload, 
  LuFilter, 
  LuCalendar, 
  LuChartPie, 
  LuChartColumn, 
  LuUsers, 
  LuAward, 
  LuActivity, 
  LuChevronDown, 
  LuArrowUpRight, 
  LuArrowDownRight,
  LuLayers,
  LuTarget
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";

const DEPARTMENT_PERFORMANCE = [
  { dept: "Comp. Science", placed: 92, avgPackage: "18.5 LPA", offers: 450 },
  { dept: "Electronics", placed: 78, avgPackage: "12.2 LPA", offers: 320 },
  { dept: "Information Tech.", placed: 88, avgPackage: "15.8 LPA", offers: 280 },
  { dept: "Mechanical", placed: 64, avgPackage: "8.5 LPA", offers: 150 },
  { dept: "Electrical", placed: 72, avgPackage: "9.2 LPA", offers: 180 }
];

const FUNNEL_DATA = [
  { stage: "Registered", count: 2400, percentage: "100%" },
  { stage: "Profile Verified", count: 2150, percentage: "89%" },
  { stage: "Appeared for Tests", count: 1850, percentage: "77%" },
  { stage: "Shortlisted", count: 840, percentage: "35%" },
  { stage: "Interviews", count: 420, percentage: "17%" },
  { stage: "Selected", count: 310, percentage: "13%" }
];

export default function ReportsPage() {
  const [batch, setBatch] = useState("2024 Batch");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    placementRate: "0%",
    avgCTC: "0 LPA",
    totalOffers: 0,
    atRisk: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await db.getReportStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load report stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const KPI_STATS = [
    { label: "Overall Placement", value: stats.placementRate, trend: "+5.4%", trendUp: true, icon: LuTarget, color: "text-primary" },
    { label: "Average CTC", value: stats.avgCTC, trend: "+1.2 LPA", trendUp: true, icon: LuTrendingUp, color: "text-emerald-600" },
    { label: "Total Offers", value: stats.totalOffers.toLocaleString(), trend: "+12%", trendUp: true, icon: LuAward, color: "text-blue-600" },
    { label: "Students at Risk", value: stats.atRisk.toString(), trend: "-8", trendUp: true, icon: LuActivity, color: "text-red-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Reports & Analytics</h1>
          <p className="text-muted text-sm font-medium">Strategic insights and placement performance trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option>2024 Batch</option>
            <option>2023 Batch</option>
            <option>2022 Batch</option>
          </select>
          <button className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuDownload size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_STATS.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-border-subtle shadow-soft hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center text-primary">
                <stat.icon size={20} />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                stat.trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
              )}>
                {stat.trendUp ? <LuArrowUpRight size={10} /> : <LuArrowDownRight size={10} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Placement Funnel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-border-subtle shadow-soft flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">Placement Funnel</h3>
            <LuLayers className="text-muted" size={16} />
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-between py-2">
            {FUNNEL_DATA.map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-2">
                <div className="flex-1">
                  <div 
                    className="h-10 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between px-4 group hover:bg-primary hover:border-primary transition-all cursor-default"
                    style={{ width: `${100 - (idx * 5)}%` }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{item.stage}</span>
                    <span className="text-xs font-black group-hover:text-white transition-colors">{item.count}</span>
                  </div>
                </div>
                <div className="w-12 text-right text-[10px] font-black text-muted shrink-0">
                  {item.percentage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dept Wise Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-border-subtle shadow-soft h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">Dept-wise Performance</h3>
            <LuChartColumn className="text-muted" size={16} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Department</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Placed %</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Avg Package</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted">Offers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {DEPARTMENT_PERFORMANCE.map((item) => (
                  <tr key={item.dept} className="group hover:bg-background/50 transition-colors">
                    <td className="py-4">
                      <p className="text-sm font-bold text-foreground/80">{item.dept}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${item.placed}%` }}
                          />
                        </div>
                        <span className="text-xs font-black shrink-0">{item.placed}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-sm font-black text-emerald-600">{item.avgPackage}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm font-bold text-muted">{item.offers}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Company Yield & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-border-subtle shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">Top Hiring Partners</h3>
            <LuChartPie className="text-muted" size={16} />
          </div>
          <div className="space-y-4">
            {[
              { company: "Google", count: 12, color: "bg-blue-500" },
              { company: "Microsoft", count: 8, color: "bg-emerald-500" },
              { company: "Amazon", count: 15, color: "bg-orange-500" },
              { company: "Zomato", count: 22, color: "bg-red-500" },
              { company: "TCS", count: 45, color: "bg-purple-500" }
            ].map((item) => (
              <div key={item.company} className="flex items-center gap-4">
                <div className={cn("w-2 h-2 rounded-full", item.color)} />
                <span className="text-sm font-bold flex-1">{item.company}</span>
                <span className="text-sm font-black">{item.count} Offers</span>
                <div className="w-32 h-1 bg-background rounded-full overflow-hidden">
                   <div className={cn("h-full", item.color)} style={{ width: `${(item.count/50)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-muted mb-4">
            <LuTrendingUp size={32} />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2">Detailed Trends Coming Soon</h3>
          <p className="text-sm font-medium text-muted max-w-xs mx-auto">We are building advanced year-over-year comparison charts for strategic planning.</p>
          <button className="mt-6 px-6 py-2.5 bg-background border border-border-subtle rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black/5 transition-all">
            Enable Beta Access
          </button>
        </div>
      </div>
    </div>
  );
}

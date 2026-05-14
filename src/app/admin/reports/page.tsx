'use client';

import { useState, useEffect } from 'react';
import { 
  LuTrendingUp, 
  LuDownload, 
  LuTarget, 
  LuAward, 
  LuActivity, 
  LuLoader,
  LuChartPie,
  LuArrowUpRight,
  LuLayers,
  LuBuilding2
} from 'react-icons/lu';
import { db } from '@/services/database';
import { cn } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface ReportStats {
  placementRate: string;
  avgCTC: string;
  totalOffers: string | number;
  atRisk?: string | number;
}

interface TrendPoint {
  month: string;
  placements: number;
  offers: number;
}

export default function ReportsPage() {
  const [batch, setBatch] = useState("2024 Batch");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportStats, trends] = await Promise.all([
          db.getReportStats(),
          db.getTrendData()
        ]);
        setStats(reportStats);
        setTrendData(trends);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadPDF = () => {
    setIsExporting(true);
    // Add a slight delay to allow UI to settle before printing
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LuLoader className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const chartColors = {
    primary: '#ff383c',
    secondary: '#ffd400',
    accent: '#4ade80',
    muted: '#8e8e93',
    placements: '#ff383c',
    offers: '#ffd400',
    drives: '#1f1f1f'
  };

  const departmentData = [
    { name: 'AI&DS', placements: 65, offers: 90, avg: 14.5 },
    { name: 'AI&ML', placements: 60, offers: 85, avg: 14.0 },
    { name: 'CSE', placements: 85, offers: 124, avg: 12.5 },
    { name: 'CYS', placements: 55, offers: 75, avg: 11.8 },
    { name: 'CSBS', placements: 50, offers: 70, avg: 11.0 },
    { name: 'CCE', placements: 48, offers: 65, avg: 10.5 },
    { name: 'ECE', placements: 72, offers: 98, avg: 9.2 },
    { name: 'EEE', placements: 60, offers: 80, avg: 8.5 },
    { name: 'MECH', placements: 45, offers: 56, avg: 6.8 },
    { name: 'IT', placements: 80, offers: 110, avg: 12.0 }
  ];

  const packageDistribution = [
    { range: '3-6 LPA', count: 45 },
    { range: '6-10 LPA', count: 82 },
    { range: '10-15 LPA', count: 34 },
    { range: '15-25 LPA', count: 12 },
    { range: '25+ LPA', count: 5 }
  ];

  const distributionData = [
    { name: 'Placed', value: parseInt(stats?.placementRate || '0') },
    { name: 'Remaining', value: 100 - parseInt(stats?.placementRate || '0') }
  ];

  const funnelData = [
    { stage: 'Eligible', count: 542, percentage: '100%', color: 'bg-primary/5' },
    { stage: 'Applied', count: 486, percentage: '89.6%', color: 'bg-primary/10' },
    { stage: 'Shortlisted', count: 312, percentage: '64.2%', color: 'bg-primary/20' },
    { stage: 'Interviewed', count: 156, percentage: '50%', color: 'bg-primary/30' },
    { stage: 'Offered', count: 124, percentage: '79.4%', color: 'bg-primary/40' }
  ];

  const topCompanies = [
    { name: "Google", count: 12, color: "bg-blue-500", avgPackage: "24.5 LPA" },
    { name: "Microsoft", count: 8, color: "bg-emerald-500", avgPackage: "18.2 LPA" },
    { name: "Amazon", count: 15, color: "bg-orange-500", avgPackage: "32.0 LPA" },
    { name: "Zomato", count: 22, color: "bg-red-500", avgPackage: "14.5 LPA" },
    { name: "TCS", count: 45, color: "bg-purple-500", avgPackage: "7.2 LPA" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Reports & Analytics</h1>
          <p className="text-muted font-medium">Strategic insights and placement performance trends for the 2024-25 batch.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option>2024 Batch</option>
            <option>2023 Batch</option>
            <option>2022 Batch</option>
          </select>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-tactile hover:scale-[1.02] transition-all disabled:opacity-70"
          >
            {isExporting ? <LuLoader className="animate-spin" size={18} /> : <LuDownload size={18} />}
            <span>{isExporting ? 'Preparing...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print-only mb-8 border-b-2 border-primary pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Placely Placement Report</h1>
        <p className="text-muted font-bold">Academic Year 2024-25 • Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Placement', value: stats?.placementRate || '0%', trend: '+4.2%', icon: LuTarget, color: 'text-primary bg-primary/10' },
          { label: 'Average Package', value: stats?.avgCTC || '0 LPA', trend: '+1.2L', icon: LuTrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Offers', value: stats?.totalOffers || '0', trend: '+12', icon: LuAward, color: 'text-blue-600 bg-blue-50' },
          { label: 'At-Risk Students', value: stats?.atRisk || '0', trend: '-2', icon: LuActivity, color: 'text-orange-600 bg-orange-50' },
        ].map((kpi, i) => (
          <div key={i} className="app-card p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black px-3 py-1 bg-green-500/10 text-green-600 rounded-full uppercase tracking-tight whitespace-nowrap">
                <LuArrowUpRight size={10} className="shrink-0" />
                {kpi.trend}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-black tracking-tight">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Visualization */}
        <div className="lg:col-span-2 app-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Monthly Placement Trend</h3>
              <p className="text-sm text-muted font-medium">Growth in offers and actual placements over time.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                <span>Placements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <span>Offers</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 800, fill: '#8e8e93' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 800, fill: '#8e8e93' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #e6e6e6', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 800 }}
                  labelStyle={{ fontSize: '12px', fontWeight: 900, marginBottom: '8px', color: '#1f1f1f' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="placements" 
                  stroke={chartColors.primary} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPlacements)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="offers" 
                  stroke={chartColors.secondary} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorOffers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Distribution */}
        <div className="app-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Package Distribution</h3>
              <p className="text-sm text-muted font-medium">Offers by CTC bracket.</p>
            </div>
            <LuAward className="text-muted" size={20} />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageDistribution}>
                <XAxis 
                  dataKey="range" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#8e8e93' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 800 }}
                />
                <Bar 
                  dataKey="count" 
                  fill={chartColors.secondary} 
                  radius={[10, 10, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="p-3 bg-background rounded-xl border border-border-subtle">
              <p className="text-[9px] font-black text-muted uppercase tracking-widest">Modal Bracket</p>
              <p className="text-sm font-black">6-10 LPA</p>
            </div>
            <div className="p-3 bg-background rounded-xl border border-border-subtle">
              <p className="text-[9px] font-black text-muted uppercase tracking-widest">Dream Offers</p>
              <p className="text-sm font-black text-primary">17 Students</p>
            </div>
          </div>
        </div>

        {/* Dept Wise Performance */}
        <div className="app-card p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Dept. Success</h3>
              <p className="text-sm text-muted font-medium">Placement % by branch.</p>
            </div>
            <LuActivity className="text-muted" size={20} />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={departmentData} margin={{ left: -10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 900, fill: '#1f1f1f' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 800 }}
                />
                <Bar 
                  dataKey="placements" 
                  fill={chartColors.primary} 
                  radius={[0, 10, 10, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border-subtle group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Highest</span>
              </div>
              <span className="text-xs font-black">AI&DS (92%)</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border-subtle group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,56,60,0.4)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Most Volume</span>
              </div>
              <span className="text-xs font-black">CSE (124)</span>
            </div>
          </div>
        </div>

        {/* Placement Distribution */}
        <div className="app-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Placement Distribution</h3>
              <p className="text-sm text-muted font-medium">Batch success vs. pending.</p>
            </div>
            <LuChartPie className="text-muted" size={20} />
          </div>
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill={chartColors.primary} stroke="none" />
                    <Cell fill="#f3f4f6" stroke="none" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              {distributionData.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-2xl border border-border-subtle">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? chartColors.primary : '#f3f4f6' }} />
                  <div>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">{d.name}</p>
                    <p className="text-sm font-black">{d.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placement Funnel */}
        <div className="app-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Placement Funnel</h3>
              <p className="text-sm text-muted font-medium">Conversion from eligibility to final offer.</p>
            </div>
            <LuLayers className="text-muted" size={20} />
          </div>
          <div className="space-y-4">
            {funnelData.map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="flex-1">
                  <div 
                    className={cn(
                      "h-12 border border-border-subtle rounded-2xl flex items-center justify-between px-6 group hover:border-primary/30 transition-all cursor-default",
                      item.color
                    )}
                    style={{ width: `${100 - (idx * 5)}%` }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{item.stage}</span>
                    <span className="text-sm font-black">{item.count}</span>
                  </div>
                </div>
                <div className="w-12 text-right text-[10px] font-black text-muted shrink-0 uppercase tracking-tighter">
                  {item.percentage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Hiring Partners */}
        <div className="app-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Top Hiring Partners</h3>
              <p className="text-sm text-muted font-medium">Companies with highest recruitment volume.</p>
            </div>
            <LuBuilding2 className="text-muted" size={20} />
          </div>
          <div className="space-y-4">
            {topCompanies.map((item) => (
              <div key={item.name} className="flex items-center gap-4 group">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-sm", item.color)}>
                  {item.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black tracking-tight">{item.name}</span>
                    <span className="text-xs font-black text-primary uppercase tracking-widest">{item.count} Offers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border-subtle/30">
                      <div 
                        className={cn("h-full transition-all duration-1000", item.color)} 
                        style={{ width: `${(item.count/50)*100}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-black text-muted w-16 text-right uppercase tracking-tighter">{item.avgPackage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-center group hover:border-primary/20 transition-all duration-500">
        <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center text-muted mb-6 group-hover:scale-110 transition-transform duration-500">
          <LuTrendingUp size={40} className="group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-2xl font-black tracking-tight mb-3">Predictive Insights</h3>
        <p className="text-sm font-medium text-muted max-w-sm mx-auto leading-relaxed">
          We are leveraging neural models to predict company hiring patterns for the upcoming season. 
          <span className="block mt-2 font-black text-primary uppercase text-[10px] tracking-widest">Early Access Available Soon</span>
        </p>
        <button className="mt-8 px-8 py-3 bg-background border border-border-subtle rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all no-print">
          Request Early Access
        </button>
      </div>
    </div>
  );
}


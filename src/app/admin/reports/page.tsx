'use client';

import { useState, useEffect } from 'react';
import { 
  LuTrendingUp, 
  LuDownload, 
  LuFilter, 
  LuCalendar, 
  LuTarget, 
  LuAward, 
  LuActivity, 
  LuLoader,
  LuChartPie,
  LuChartBar,
  LuArrowUpRight,
  LuArrowDownRight
} from 'react-icons/lu';
import { db } from '@/services/database';
import { cn } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
  const [batch, setBatch] = useState("2024 Batch");
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
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
    { name: 'CSE', placements: 85, offers: 124, avg: 12.5 },
    { name: 'ECE', placements: 72, offers: 98, avg: 9.2 },
    { name: 'MECH', placements: 45, offers: 56, avg: 6.8 },
    { name: 'IT', placements: 92, offers: 110, avg: 11.4 },
    { name: 'CIVIL', placements: 38, offers: 42, avg: 5.5 }
  ];

  const packageDistribution = [
    { range: '3-6 LPA', count: 45 },
    { range: '6-10 LPA', count: 82 },
    { range: '10-15 LPA', count: 34 },
    { range: '15-25 LPA', count: 12 },
    { range: '25+ LPA', count: 5 }
  ];

  const distributionData = [
    { name: 'Placed', value: parseInt(stats.placementRate) },
    { name: 'Remaining', value: 100 - parseInt(stats.placementRate) }
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
          { label: 'Overall Placement', value: stats.placementRate, trend: '+4.2%', icon: LuTarget, color: 'text-primary bg-primary/10' },
          { label: 'Average Package', value: stats.avgCTC, trend: '+1.2L', icon: LuTrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Offers', value: stats.totalOffers, trend: '+12', icon: LuAward, color: 'text-blue-600 bg-blue-50' },
          { label: 'Upcoming Drives', value: '18', trend: 'Next 30d', icon: LuCalendar, color: 'text-orange-600 bg-orange-50' },
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
                  tick={{ fontSize: 10, fontBold: 900, fill: '#8e8e93' }}
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
      </div>

        {/* Dept Wise Performance */}
        <div className="app-card p-8">
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
              <span className="text-xs font-black">Information Technology (92%)</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border-subtle group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,56,60,0.4)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Most Volume</span>
              </div>
              <span className="text-xs font-black">Computer Science (124)</span>
            </div>
          </div>
        </div>

        <div className="app-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Placement Distribution</h3>
              <p className="text-sm text-muted font-medium">Batch success vs. pending.</p>
            </div>
            <LuChartPie className="text-muted" size={20} />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-[250px]">
            <div className="w-full h-full max-w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
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
            <div className="space-y-4">
              {distributionData.map((d, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-md" style={{ backgroundColor: i === 0 ? chartColors.primary : '#f3f4f6' }} />
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">{d.name}</p>
                    <p className="text-lg font-black">{d.value}%</p>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}

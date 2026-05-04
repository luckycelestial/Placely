"use client";

import { useState, useEffect } from "react";
import { 
  LuUsers, 
  LuBriefcase, 
  LuFileText, 
  LuAward,
  LuTrendingUp,
  LuTriangleAlert,
  LuClock,
  LuCircleCheck,
  LuChevronRight,
  LuPlus
} from "react-icons/lu";
import Link from "next/link";
import { db } from "@/services/database";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalDrives: 0,
    totalOffers: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, approvalsData, activityData] = await Promise.all([
          db.getDashboardStats(),
          db.getPendingApprovals(),
          db.getRecentActivity()
        ]);
        setStats(statsData);
        setPendingApprovals(approvalsData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Welcome back, Admin</h2>
          <p className="text-muted text-sm mt-1">Here's what's happening in the placement cell today.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <LuPlus size={16} />
            New Drive
          </button>
          <button className="flex items-center gap-2 bg-surface border border-border-subtle text-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hidden sm:flex">
            <LuFileText size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Urgent Alerts / Inbox */}
      {pendingApprovals.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <LuTriangleAlert size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-800 font-bold text-sm">Action Required: {pendingApprovals.length} Pending Verifications</h3>
            <p className="text-red-700/80 text-xs mt-1 leading-relaxed">
              There are student profiles and offer letters awaiting verification.
            </p>
          </div>
          <Link href="/admin/offers" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 whitespace-nowrap">
            Review Now
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <LuUsers size={20} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
              <LuTrendingUp size={12} />
              +5%
            </div>
          </div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Total Students</p>
          <h3 className="text-3xl font-display font-black text-foreground">{loading ? "..." : stats.totalStudents}</h3>
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Eligible View</span>
            <Link href="/admin/students" className="text-primary font-bold hover:underline">View All</Link>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <LuBriefcase size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Active Drives</p>
          <h3 className="text-3xl font-display font-black text-foreground">{loading ? "..." : stats.totalDrives}</h3>
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Ongoing</span>
            <Link href="/admin/drives" className="text-primary font-bold hover:underline">Manage</Link>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <LuFileText size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Total Companies</p>
          <h3 className="text-3xl font-display font-black text-foreground">{loading ? "..." : stats.totalCompanies}</h3>
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Registered</span>
            <Link href="/admin/companies" className="text-primary font-bold hover:underline">View</Link>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <LuAward size={20} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Total Offers</p>
          <h3 className="text-3xl font-display font-black text-foreground">{loading ? "..." : stats.totalOffers}</h3>
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Accepted</span>
            <Link href="/admin/offers" className="text-primary font-bold hover:underline">Verify</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Approvals Queue */}
        <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <LuClock className="text-amber-500" />
              Pending Approvals
            </h3>
            <Link href="/admin/offers" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-muted font-medium py-4">Loading approvals...</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-sm text-muted font-medium py-4">All clear! No pending approvals.</div>
            ) : (
              pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 transition-colors border border-transparent hover:border-border-subtle group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <LuFileText size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{item.type}</h4>
                      <p className="text-xs text-muted font-medium mt-0.5">
                        {item.target} • {item.company !== 'N/A' && <span className="text-primary">{item.company} • </span>}{item.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">
                      <LuCircleCheck size={16} />
                    </button>
                    <button className="h-8 w-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center hover:bg-black/5 transition-colors">
                      <LuChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-foreground">Recent Activity</h3>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border-subtle before:to-transparent">
            {loading ? (
              <div className="text-sm text-muted font-medium py-4">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-muted font-medium py-4">No recent activity.</div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className="h-3 w-3 mt-1.5 rounded-full bg-primary border-2 border-surface shadow-sm z-10" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{activity.title}</h4>
                    <p className="text-xs text-muted mt-0.5 font-medium">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

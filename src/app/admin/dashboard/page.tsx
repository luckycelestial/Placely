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
  LuPlus,
  LuX,
  LuLoader
} from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";

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
  const [isNewDriveModalOpen, setIsNewDriveModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const router = useRouter();

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
          <button 
            onClick={() => setIsNewDriveModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <LuPlus size={16} />
            New Drive
          </button>
          <button 
            onClick={() => {
              setIsGeneratingReport(true);
              // Simulate report generation process
              setTimeout(() => {
                setIsGeneratingReport(false);
                router.push('/admin/reports?generated=true');
              }, 2000);
            }}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 bg-surface border border-border-subtle text-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hidden sm:flex disabled:opacity-50"
          >
            {isGeneratingReport ? <LuLoader size={16} className="animate-spin" /> : <LuFileText size={16} />}
            {isGeneratingReport ? "Generating..." : "Generate Report"}
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

      {/* New Drive Modal */}
      {isNewDriveModalOpen && (
        <NewDriveModal 
          onClose={() => setIsNewDriveModalOpen(false)} 
          onSuccess={() => {
            setIsNewDriveModalOpen(false);
            // Refresh stats
            db.getDashboardStats().then(setStats);
          }}
        />
      )}
    </div>
  );
}

function NewDriveModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    companyId: "",
    roleTitle: "",
    driveType: "On-Campus",
    package: "",
    location: "Remote",
    deadline: "",
    eligibility: ""
  });

  useEffect(() => {
    db.getCompanies().then(setCompanies);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.createDrive(formData);
      onSuccess();
    } catch (error) {
      console.error("Failed to create drive:", error);
      alert("Failed to create drive. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-background/50">
          <div>
            <h2 className="text-xl font-black tracking-tight">Create New Drive</h2>
            <p className="text-xs text-muted font-medium">Set up a new recruitment cycle.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Company</label>
              <select 
                required
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              >
                <option value="">Select Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Role Title</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Software Engineer"
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Drive Type</label>
              <select 
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.driveType}
                onChange={(e) => setFormData({ ...formData, driveType: e.target.value })}
              >
                <option>On-Campus</option>
                <option>Off-Campus</option>
                <option>Pool Drive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Package (CTC)</label>
              <input 
                required
                type="text" 
                placeholder="e.g. 12 LPA"
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Location</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Bangalore / Remote"
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Deadline</label>
              <input 
                required
                type="date" 
                className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Eligibility Rules</label>
            <textarea 
              required
              rows={3}
              placeholder="e.g. CSE/IT, 7.5+ CGPA, No active backlogs"
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-surface border border-border-subtle text-sm font-bold hover:bg-black/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 rounded-2xl bg-primary text-white text-sm font-bold shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <LuLoader size={18} className="animate-spin" /> : <LuPlus size={18} />}
              Create Drive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

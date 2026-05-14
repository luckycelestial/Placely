"use client";

import { useState, useEffect } from "react";
import { 
  LuFileText, 
  LuTimer, 
  LuSend, 
  LuAward,
  LuArrowRight,
  LuBell
} from "react-icons/lu";
import Link from "next/link";
import { 
  SiMeta, 
  SiNetflix 
} from "react-icons/si";
import { FaAmazon } from "react-icons/fa";
import { StatCard } from "@/components/ui/stat-card";
import { ProfileCompleteness } from "@/components/student/profile-completeness";
import { ActiveDrives } from "@/components/student/active-drives";
import { TaskInbox } from "@/components/student/task-inbox";
import { db } from "@/services/database";
import { DEV_STUDENT_ID } from "@/lib/dev-config";



interface StudentProfile {
  users?: {
    name?: string;
  };
  profile_completion?: number;
}

interface Activity {
  job_drives?: {
    companies?: {
      name?: string;
    };
    role_title?: string;
  };
  applied_at: string;
  status: string;
}

interface Notice {
  id: string;
  title: string;
  created_at: string;
  category?: string;
}

interface Event {
  id: string;
  event_date: string;
  title: string;
  location?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    applicationsCount: 0,
    offersCount: 0,
    interviewsCount: 0,
    tasksCount: 0
  });
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bulletin, setBulletin] = useState<{notices: Notice[], events: Event[]}>({notices: [], events: []});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const studentId = DEV_STUDENT_ID;
        
        const [statsData, profileData, activityData, noticesData, eventsData] = await Promise.all([
          db.getStudentDashboardStats(studentId),
          db.getStudentProfile(studentId),
          db.getStudentActivity(studentId),
          db.getNotices(),
          db.getEvents()
        ]);

        setStats(statsData);
        setProfile(profileData);
        setActivities(activityData);
        setBulletin({ notices: noticesData, events: eventsData });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted">Syncing with Command...</p>
      </div>
    </div>
  );

  const firstName = profile?.users?.name?.split(' ')[0] || 'Student';

  return (
    <div className="space-y-8 py-6 px-4 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-10 rounded-full bg-primary" />
              <span className="section-label text-primary">Personnel Command</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
              Welcome back, <span className="text-primary italic">{firstName}.</span>
            </h2>
            <p className="font-sans text-lg md:text-xl font-medium mt-2 text-muted max-w-2xl leading-relaxed">
              Your placement journey is <span className="highlight font-bold text-foreground">{profile?.profile_completion || 0}% complete.</span> You&apos;re making incredible progress!
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="h-12 w-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-muted relative cursor-pointer hover:bg-background transition-colors group">
              <LuBell size={20} />
              {stats.tasksCount > 0 && (
                <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface animate-bounce" />
              )}
            </Link>
            <Link href="/progress" className="btn-primary py-3 px-6 text-sm">
              View Roadmap
              <LuArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/applications" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Applications" 
            value={stats.applicationsCount} 
            icon={LuFileText} 
            trend={{ value: "Active Stream", isUp: true }}
          />
        </Link>
        <Link href="/notifications" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Pending Tasks" 
            value={stats.tasksCount} 
            icon={LuTimer} 
            description="Due by end of week"
          />
        </Link>
        <Link href="/progress" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Interviews" 
            value={stats.interviewsCount} 
            icon={LuSend} 
            description="Across stages"
          />
        </Link>
        <Link href="/offers" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Offers" 
            value={stats.offersCount} 
            icon={LuAward} 
            trend={{ value: stats.offersCount > 0 ? "New!" : "Ongoing", isUp: true }}
          />
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Mission Control - Action Inbox */}
          <TaskInbox />
          
          {/* Active Drives */}
          <ActiveDrives />
          
          {/* Recent Activity */}
          <div className="app-card overflow-hidden">
            <div className="px-8 py-6 border-b border-border-subtle bg-background/30 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold tracking-tight">Live Dispatch</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Real-time Stream</span>
                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
              </div>
            </div>
            <div className="divide-y border-border-subtle">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-5 p-6 hover:bg-background/50 transition-colors group">
                  <div className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center transition-all group-hover:scale-110 text-primary">
                    <LuFileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                      Applied to {activity.job_drives?.companies?.name} for {activity.job_drives?.role_title}
                    </p>
                    <p className="font-sans text-[10px] font-bold text-muted uppercase mt-0.5 tracking-widest">
                      {db.formatRelativeTime(activity.applied_at)} • Status: {activity.status}
                    </p>
                  </div>
                  <Link href="/applications" className="h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary transition-all flex-shrink-0">
                    <LuArrowRight size={20} />
                  </Link>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="p-12 text-center text-muted italic text-sm">No recent activity found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content (Right) */}
        <div className="space-y-8">
          {/* Profile Metrics */}
          <ProfileCompleteness 
            percentage={profile?.profile_completion || 0} 
            missingItems={(profile?.profile_completion ?? 0) < 100 ? [
              "Upload latest resume",
              "Verify phone number",
              "Add project details"
            ] : []}
          />
          
          <div className="app-card">
            <div className="px-8 py-6 border-b border-border-subtle bg-background/30 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold tracking-tight">Bulletin Board</h3>
              <LuBell className="text-muted" size={18} />
            </div>
            <div className="p-6 space-y-6">
              {bulletin.events.map((event) => (
                <div key={event.id} className="group cursor-pointer">
                  <p className="font-sans text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                    {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(event.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="font-display text-lg font-bold mt-1 leading-tight group-hover:text-primary transition-colors">{event.title}</p>
                  <p className="text-[10px] font-black text-muted mt-2 uppercase tracking-widest">{event.location}</p>
                </div>
              ))}
              {bulletin.notices.slice(0, 2).map((notice) => (
                <div key={notice.id} className="group cursor-pointer border-t border-border-subtle pt-6 first:border-t-0 first:pt-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest mb-2">
                    {notice.category}
                  </span>
                  <p className="font-display text-base font-bold group-hover:text-primary transition-colors leading-tight">{notice.title}</p>
                  <p className="font-sans text-[10px] font-bold text-muted uppercase mt-1.5 tracking-widest">
                    Posted {db.formatRelativeTime(notice.created_at)}
                  </p>
                </div>
              ))}
              {bulletin.events.length === 0 && bulletin.notices.length === 0 && (
                <div className="p-6 text-center text-muted italic text-xs">No updates at this time.</div>
              )}
            </div>
            <div className="p-6 bg-background/30 border-t border-border-subtle">
              <button className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">
                Sync to Calendar
              </button>
            </div>
          </div>

          {/* Quick Support / Snapshot */}
          <div className="app-card p-6 bg-primary/5 border-primary/20">
            <h4 className="font-display text-base font-bold tracking-tight">Need Assistance?</h4>
            <p className="text-[10px] font-medium text-muted mt-2 leading-relaxed">
              Your placement officer is available for 1-on-1 career coaching.
            </p>
            <Link href="/profile" className="block mt-4 w-full py-2.5 rounded-full bg-surface border border-border-subtle text-[9px] font-black text-center uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
              Book a Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

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

const RECENT_ACTIVITY = [
  {
    company: "Amazon",
    role: "SDE-1",
    time: "2 hours ago",
    icon: FaAmazon,
    color: "#FF9900"
  },
  {
    company: "Meta",
    role: "Product Designer",
    time: "5 hours ago",
    icon: SiMeta,
    color: "#0668E1"
  },
  {
    company: "Netflix",
    role: "UI Engineer",
    time: "Yesterday",
    icon: SiNetflix,
    color: "#E50914"
  }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 py-6 px-4 max-w-[1400px] mx-auto">
      {/* Welcome Section */}
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-10 rounded-full bg-primary" />
              <span className="section-label text-primary">Personnel Command</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
              Welcome back, <span className="text-primary italic">John.</span>
            </h2>
            <p className="font-sans text-lg md:text-xl font-medium mt-2 text-muted max-w-2xl leading-relaxed">
              Your placement journey is <span className="highlight font-bold text-foreground">85% complete.</span> You&apos;re making incredible progress!
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="h-12 w-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-muted relative cursor-pointer hover:bg-background transition-colors group">
              <LuBell size={20} />
              <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface animate-bounce" />
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
            value={12} 
            icon={LuFileText} 
            trend={{ value: "2 this week", isUp: true }}
          />
        </Link>
        <Link href="/notifications" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Pending Tasks" 
            value={4} 
            icon={LuTimer} 
            description="Due by end of week"
          />
        </Link>
        <Link href="/progress" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Interviews" 
            value={2} 
            icon={LuSend} 
            description="Next: tomorrow"
          />
        </Link>
        <Link href="/offers" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Offers" 
            value={1} 
            icon={LuAward} 
            trend={{ value: "New!", isUp: true }}
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
              {RECENT_ACTIVITY.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div key={i} className="flex items-center gap-5 p-6 hover:bg-background/50 transition-colors group">
                    <div 
                      className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ color: activity.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                        Applied to {activity.company} for {activity.role}
                      </p>
                      <p className="font-sans text-[10px] font-bold text-muted uppercase mt-0.5 tracking-widest">{activity.time} • Automated Submission</p>
                    </div>
                    <Link href="/applications" className="h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary transition-all flex-shrink-0">
                      <LuArrowRight size={20} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Content (Right) */}
        <div className="space-y-8">
          {/* Profile Metrics */}
          <ProfileCompleteness 
            percentage={85} 
            missingItems={[
              "Upload latest resume",
              "Add 10th marksheet",
              "Verify phone number"
            ]}
          />
          
          {/* Bulletin Board - Upcoming Events */}
          <div className="app-card">
            <div className="px-8 py-6 border-b border-border-subtle bg-background/30 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold tracking-tight">Bulletin Board</h3>
              <LuBell className="text-muted" size={18} />
            </div>
            <div className="p-6 space-y-6">
              <Link href="/drives" className="block relative pl-6 group cursor-pointer">
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-primary group-hover:w-1.5 transition-all" />
                <p className="font-sans text-[10px] font-black text-primary uppercase tracking-[0.15em]">Tomorrow, 10:00 AM</p>
                <p className="font-display text-lg font-bold mt-1 leading-tight group-hover:text-primary transition-colors">Pre-Placement Talk: Google</p>
                <p className="text-[10px] font-black text-muted mt-2 uppercase tracking-widest">Online • Link in email</p>
              </Link>
              <Link href="/drives" className="block relative pl-6 group cursor-pointer">
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-primary group-hover:w-1.5 transition-all" />
                <p className="font-sans text-[10px] font-black text-primary uppercase tracking-[0.15em]">May 5, 2:00 PM</p>
                <p className="font-display text-lg font-bold mt-1 leading-tight group-hover:text-primary transition-colors">Aptitude Test: Microsoft</p>
                <p className="text-[10px] font-black text-muted mt-2 uppercase tracking-widest">College Lab 2 • Hall 4A</p>
              </Link>
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
            <Link href="/profile" className="block mt-4 w-full py-2.5 rounded-full bg-white border border-border-subtle text-[9px] font-black text-center uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
              Book a Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

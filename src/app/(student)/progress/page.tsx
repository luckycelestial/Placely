"use client";

import { Sk } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  LuCircle, 
  LuChevronRight,
  LuChevronLeft,
  LuBuilding2,
  LuTarget,
  LuCircleCheck,
  LuX,
  LuInfo,
  LuIndianRupee,
  LuShieldCheck,
  LuCalendar,
  LuClock,
  LuPartyPopper,
  LuTimer,
  LuSparkles,
  LuArrowRight,
  LuSearch,
  LuMapPin,
  LuAward,
  LuCode,
  LuFolder,
  LuPlus,
  LuTrash2,
  LuPencil,
  LuGithub,
  LuExternalLink,
  LuRefreshCw,
  LuBriefcase
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { db } from "@/services/database";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const formatCapitalized = (str: string) => {
  if (!str) return "";
  if (str.toLowerCase() === "ppo") return "PPO";
  return str
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface TimelineEvent {
  id: string;
  title: string;
  company?: string;
  status: "Completed" | "Current" | "Upcoming" | "Rejected" | "Skipped";
  date: string;
  description: string;
}

interface OfferDetails {
  status: "Offered" | "Accepted" | "Verified" | "Joining Soon" | "Joined";
  type: "Full Time" | "Internship" | "PPO";
  ctc: string;
  offerDate: string;
  joiningDate: string;
  dbJoiningDate?: string;
  description: string;
  actionsRequired: string[];
  companyId?: string;
}

interface ApplicationProgress {
  id: string;
  company: string;
  role: string;
  overallStatus: string;
  currentStage: string;
  completion: number;
  location: string;
  ctc: string;
  events: TimelineEvent[];
  offer?: OfferDetails;
  driveId?: string;
}

export default function ProgressPage() {
  const [mainTab, setMainTab] = useState<"drives" | "coding" | "projects">("drives");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelines, setPipelines] = useState<ApplicationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [placedCount, setPlacedCount] = useState(0);
  const [offeredCount, setOfferedCount] = useState(0);
  
  // Local state to manage offer acceptances and action item checklist triggers dynamically
  const [acceptedOffers, setAcceptedOffers] = useState<Record<string, boolean>>({});
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [dateModalData, setDateModalData] = useState<{
    appId: string;
    companyId: string;
    driveId: string;
    roleTitle: string;
    packageCtc: string;
    currentDate?: string;
  } | null>(null);

  const [calendarMonth, setCalendarMonth] = useState<number>(6); // Default to July
  const [calendarYear, setCalendarYear] = useState<number>(2026); // Default to 2026
  const [tempSelectedDate, setTempSelectedDate] = useState<string>("");

  // Coding & Projects States
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [leetcodeStats, setLeetcodeStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Projects CRUD state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null); // null for create
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projLive, setProjLive] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (isDateModalOpen && dateModalData) {
      const initialDateStr = dateModalData.currentDate || "2026-07-15";
      setTempSelectedDate(initialDateStr);
      const parsedDate = new Date(initialDateStr);
      if (!isNaN(parsedDate.getTime())) {
        setCalendarMonth(parsedDate.getMonth());
        setCalendarYear(parsedDate.getFullYear());
      }
    }
  }, [isDateModalOpen, dateModalData]);

  const loadAllProgress = useCallback(async () => {
    setLoading(true);
    try {
      const studentId = DEV_STUDENT_ID;
      const [data, offersData, statsData, profileResult, projectsResult] = await Promise.all([
        db.getStudentApplications(studentId),
        db.getStudentOffers(studentId),
        db.getStudentApplicationStats(studentId),
        supabase.from('student_profiles').select('*').eq('student_id', studentId).single(),
        supabase.from('student_projects').select('*').eq('student_id', studentId).order('created_at', { ascending: false })
      ]);
      
      const formatted = data.map((app: any) => {
        const ctc = app.job_drives?.package_ctc || "12 - 18 LPA";
        const location = app.job_drives?.location || "Bangalore, India";
        const role = app.job_drives?.role_title || "Software Engineer";
        const companyName = app.job_drives?.companies?.name || "Company";
        
        let driveStages = undefined;
        const rules = app.job_drives?.eligibility_rules;
        if (rules) {
          let parsedRules = rules;
          if (typeof rules === 'string') {
            try { parsedRules = JSON.parse(rules); } catch (e) {}
          }
          if (parsedRules && Array.isArray(parsedRules.stages)) {
            driveStages = parsedRules.stages;
          }
        }

        let completion = 20;
        if (driveStages && driveStages.length > 0) {
          const idx = driveStages.findIndex((s: any) => s.id === app.current_stage);
          if (app.status === "Offered" || app.status === "Accepted" || app.status === "Joined" || app.status === "Rejected") {
            completion = 100;
          } else if (idx !== -1) {
            completion = Math.round(((idx + 1) / (driveStages.length + 1)) * 100);
          }
        } else {
          if (app.status === "In Review") completion = 40;
          else if (app.status === "Shortlisted") completion = 60;
          else if (app.status === "Offered") completion = 85;
          else if (app.status === "Accepted" || app.status === "Joined" || app.status === "Rejected") completion = 100;
        }

        const timeline = getTimelineStages(app.status, app.current_stage, app.applied_at, driveStages);

        const realOffer = offersData.find((o: any) => o.drive_id === app.drive_id);
        let offer = undefined;
        if (app.status === "Offered" || app.status === "Accepted" || app.status === "Joined" || (realOffer && (realOffer.acceptance_status === "accepted" || app.status === "offered"))) {
          const isAccepted = realOffer ? realOffer.acceptance_status === 'accepted' : app.status === "Accepted" || app.status === "Joined";
          const dbJoiningDate = realOffer?.joining_date;
          
          let displayJoiningDate = "July 15, 2026"; 
          if (dbJoiningDate) {
            displayJoiningDate = new Date(dbJoiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }

          offer = {
            status: (isAccepted ? "Accepted" : "Offered") as any,
            type: (app.job_drives?.drive_type || "Full Time") as any,
            ctc: ctc,
            offerDate: new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            joiningDate: displayJoiningDate,
            dbJoiningDate: dbJoiningDate,
            description: `Congratulations! We are thrilled to offer you the position of ${role} on the engineering team at ${companyName}.`,
            actionsRequired: !isAccepted 
              ? ["Accept Offer", "Choose Joining Date Slot"]
              : ["Upload Medical Certificate", "Verify ID Proofs"],
            companyId: app.job_drives?.companies?.id || ""
          };
        }

        return {
          id: app.id,
          company: companyName,
          role: role,
          overallStatus: app.status === "Rejected" ? "Not Selected" : formatCapitalized(app.status || "Applied"),
          currentStage: formatCapitalized(app.current_stage || "Applied"),
          completion: completion,
          location: location,
          ctc: ctc,
          events: timeline,
          offer: offer,
          driveId: app.drive_id
        };
      });
      
      setPipelines(formatted);
      setActiveCount(Number(statsData.active_count));
      setPlacedCount(Number(statsData.placed_count));
      setOfferedCount(Number(statsData.offered_count));

      setProfile(profileResult.data);
      setProjects(projectsResult.data || []);
      if (profileResult.data) {
        setLeetcodeStats({
          total: profileResult.data.leetcode_count || 0,
          easy: 0,
          medium: 0,
          hard: 0
        });
        setLastFetched(profileResult.data.leetcode_last_fetched || null);
      }
    } catch (err) {
      console.error("Failed to load progress data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllProgress();
  }, [loadAllProgress]);

  function getTimelineStages(
    status: string, 
    currentStageId: string, 
    appliedDate?: string, 
    driveStages?: any[]
  ) {
    const formattedDate = appliedDate 
      ? new Date(appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : "Oct 15";
    
    const rawStages = (driveStages && Array.isArray(driveStages) && driveStages.length > 0)
      ? driveStages
      : [
          { id: "applied", name: "Applied" },
          { id: "shortlisted", name: "Shortlisted" },
          { id: "interview1", name: "Tech Round 1" },
          { id: "interview2", name: "Tech Round 2" },
          { id: "selection", name: "Selection" }
        ];

    const currentIdx = rawStages.findIndex((s: any) => s.id === currentStageId);
    
    const baseStages: TimelineEvent[] = rawStages.map((stage: any, idx: number) => {
      const stageName = formatCapitalized(stage.name);
      let stageStatus: "Completed" | "Current" | "Upcoming" | "Rejected" | "Skipped" = "Upcoming";
      let date = "TBD";
      let description = `Process round: ${stageName}.`;

      if (status === "Rejected") {
        const rejectedIdx = currentIdx !== -1 ? currentIdx : 1;
        if (idx === rejectedIdx) {
          stageStatus = "Rejected";
          date = formattedDate;
          description = `Evaluation stopped at ${stageName} stage.`;
        } else if (idx < rejectedIdx) {
          stageStatus = "Completed";
          date = formattedDate;
          description = `${stageName} round successfully cleared.`;
        } else {
          stageStatus = "Skipped";
          date = "—";
          description = `Evaluation skipped.`;
        }
      } else if (status === "Offered" || status === "Accepted" || status === "Joined") {
        stageStatus = "Completed";
        date = formattedDate;
        description = `${stageName} round completed.`;
      } else {
        if (stage.id === currentStageId || (currentIdx === -1 && idx === 0)) {
          stageStatus = "Current";
          date = formattedDate;
          description = `Currently in ${stageName} round. Awaiting evaluation results.`;
        } else if (idx < currentIdx) {
          stageStatus = "Completed";
          date = formattedDate;
          description = `${stageName} round successfully completed.`;
        }
      }

      return {
        id: stage.id,
        title: stageName,
        status: stageStatus,
        date: date,
        description: description
      };
    });

    if ((status === "Offered" || status === "Accepted" || status === "Joined") && !baseStages.some(s => s.id === "final-offer")) {
      baseStages.push({
        id: "final-offer",
        title: "Offer Released",
        status: "Completed",
        date: formattedDate,
        description: "Official job offer released!"
      });
    }

    return baseStages;
  }

  const handleAcceptOffer = async (app: any) => {
    try {
      const studentId = DEV_STUDENT_ID;
      const companyId = app.offer?.companyId || "";
      const driveId = app.driveId;
      const roleTitle = app.role;
      const packageCtc = app.ctc;

      await db.acceptOffer(
        studentId,
        driveId,
        companyId,
        roleTitle,
        packageCtc,
        app.id
      );

      setAcceptedOffers(prev => ({ ...prev, [app.id]: true }));
      setActiveCount(prev => Math.max(0, prev - 1));
      setPlacedCount(prev => prev + 1);
      setOfferedCount(prev => Math.max(0, prev - 1));
      
      setPipelines(prev => prev.map(p => {
        if (p.id === app.id) {
          return {
            ...p,
            overallStatus: "Accepted",
            offer: p.offer ? {
              ...p.offer,
              status: "Accepted",
              actionsRequired: ["Upload Medical Certificate", "Verify ID Proofs"]
            } : undefined
          };
        }
        return p;
      }));

      toast.success("Offer Accepted Successfully! Preparing your day-one onboarding dashboard.");
    } catch (err) {
      console.error("Failed to accept offer:", err);
      toast.error("Failed to accept offer. Please try again.");
    }
  };

  const handleSelectJoiningDate = async (selectedDate: string) => {
    if (!dateModalData) return;
    try {
      const studentId = DEV_STUDENT_ID;
      await db.setOfferJoiningDate(
        studentId,
        dateModalData.driveId,
        dateModalData.companyId,
        dateModalData.roleTitle,
        dateModalData.packageCtc,
        selectedDate
      );

      const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      setPipelines(prev => prev.map(p => {
        if (p.id === dateModalData.appId) {
          return {
            ...p,
            offer: p.offer ? {
              ...p.offer,
              joiningDate: displayDate,
              dbJoiningDate: selectedDate
            } : undefined
          };
        }
        return p;
      }));

      setIsDateModalOpen(false);
      setDateModalData(null);
      toast.success("Joining date updated successfully!");
    } catch (err) {
      console.error("Failed to set joining date:", err);
      toast.error("Failed to set joining date. Please try again.");
    }
  };

  const toggleActionItem = (actionKey: string) => {
    setCompletedActions(prev => ({ ...prev, [actionKey]: !prev[actionKey] }));
  };

  const filteredApps = useMemo(() => {
    return pipelines.filter(app => {
      const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = activeTab === "All" || app.overallStatus === activeTab;
      if (activeTab === "Accepted") {
        matchesTab = app.overallStatus === "Accepted" || acceptedOffers[app.id];
      }
      
      return matchesSearch && matchesTab;
    });
  }, [pipelines, searchQuery, activeTab, acceptedOffers]);

  // Coding manual sync logic
  const handleSyncLeetcode = async () => {
    const leetcodeHandle = profile?.notes?.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, '').trim();
    if (!leetcodeHandle) {
      toast.error("Please configure your LeetCode handle in Profile settings first.");
      return;
    }

    if (lastFetched) {
      const diff = Date.now() - new Date(lastFetched).getTime();
      const hours24 = 24 * 60 * 60 * 1000;
      if (diff < hours24) {
        const remaining = hours24 - diff;
        const hrs = Math.floor(remaining / (60 * 60 * 1000));
        const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        toast.warning(`Rate limit: Try again in ${hrs}h ${mins}m.`);
        return;
      }
    }

    setIsSyncing(true);
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `;

      const res = await fetch("/api/leetcode-graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { username: leetcodeHandle } })
      });

      const body = await res.json();
      if (body.errors) {
        throw new Error(body.errors[0]?.message || "GraphQL response had errors.");
      }

      const submissions = body?.data?.matchedUser?.submitStats?.acSubmissionNum;
      if (!submissions) {
        throw new Error("No submission stats retrieved. Verify username.");
      }

      const allStats = submissions.find((s: any) => s.difficulty === "All");
      const easyStats = submissions.find((s: any) => s.difficulty === "Easy");
      const mediumStats = submissions.find((s: any) => s.difficulty === "Medium");
      const hardStats = submissions.find((s: any) => s.difficulty === "Hard");

      const totalVal = allStats?.count || 0;
      const easyVal = easyStats?.count || 0;
      const mediumVal = mediumStats?.count || 0;
      const hardVal = hardStats?.count || 0;

      const nowStr = new Date().toISOString();
      const { error: dbError } = await supabase
        .from('student_profiles')
        .update({
          leetcode_count: totalVal,
          leetcode_last_fetched: nowStr
        })
        .eq('student_id', DEV_STUDENT_ID);

      if (dbError) throw dbError;

      setLeetcodeStats({ total: totalVal, easy: easyVal, medium: mediumVal, hard: hardVal });
      setLastFetched(nowStr);
      setProfile((prev: any) => ({ ...prev, leetcode_count: totalVal, leetcode_last_fetched: nowStr }));
      toast.success(`LeetCode sync complete! Total solved: ${totalVal}.`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Sync failed: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Projects CRUD logic
  const handleOpenProjectModal = (proj: any = null) => {
    if (proj) {
      setEditingProject(proj);
      setProjTitle(proj.title);
      setProjDesc(proj.description || "");
      setProjTech(proj.technologies || "");
      setProjGithub(proj.github_url || "");
      setProjLive(proj.live_url || "");
    } else {
      setEditingProject(null);
      setProjTitle("");
      setProjDesc("");
      setProjTech("");
      setProjGithub("");
      setProjLive("");
    }
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projTitle.trim()) {
      toast.error("Project title is required.");
      return;
    }
    setIsSavingProject(true);
    try {
      const payload = {
        student_id: DEV_STUDENT_ID,
        title: projTitle.trim(),
        description: projDesc.trim() || null,
        technologies: projTech.trim() || null,
        github_url: projGithub.trim() || null,
        live_url: projLive.trim() || null
      };

      if (editingProject) {
        const { error } = await supabase
          .from('student_projects')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingProject.id);
        if (error) throw error;
        toast.success("Project updated successfully.");
      } else {
        const { error } = await supabase
          .from('student_projects')
          .insert([payload]);
        if (error) throw error;
        toast.success("Project added successfully.");
      }

      const { data: updatedProjects } = await supabase
        .from('student_projects')
        .select('*')
        .eq('student_id', DEV_STUDENT_ID)
        .order('created_at', { ascending: false });

      setProjects(updatedProjects || []);
      setIsProjectModalOpen(false);
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message || err}`);
    } finally {
      setIsSavingProject(false);
    }
  };

  const confirmDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Project deleted successfully.");
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message || err}`);
    }
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDayIndex = getFirstDayOfMonth(calendarMonth, calendarYear);

  const daysGrid: (number | null)[] = useMemo(() => {
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(d);
    }
    return grid;
  }, [firstDayIndex, daysInMonth]);

  if (loading) return (
    <div className="space-y-12 pt-2 pb-10 px-4 max-w-7xl mx-auto min-h-screen">
      <Sk.PageHeader />
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <Sk.Block className="h-12 w-full lg:w-2/3 rounded-full" />
        <Sk.Block className="h-12 w-full lg:w-1/3 rounded-2xl" />
      </div>
      <Sk.CardGrid count={3} cols={1} />
    </div>
  );

  return (
    <div className="space-y-12 pt-2 pb-10 px-4 max-w-7xl mx-auto min-h-screen font-sans">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              My <span className="text-primary">Progress.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              Track recruitment pipelines, update coding stats, and showcase project portfolios in one centralized hub.
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-surface border border-border-subtle p-6 rounded-3xl shadow-xl shadow-black/5">
             <div className="flex flex-col items-center px-2">
                <span className="text-3xl font-black text-primary">{String(activeCount).padStart(2, '0')}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1 font-sans">Active Streams</span>
             </div>
             <div className="h-10 w-px bg-border-subtle" />
             <div className="flex flex-col items-center px-2">
                <span className="text-3xl font-black text-emerald-500">{String(placedCount).padStart(2, '0')}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1 font-sans">Placed / Joined</span>
             </div>
             {offeredCount > 0 && (
               <>
                 <div className="h-10 w-px bg-border-subtle" />
                 <div className="flex flex-col items-center px-2 animate-pulse">
                    <span className="text-3xl font-black text-purple-500">{String(offeredCount).padStart(2, '0')}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1 font-sans">Action Needed</span>
                 </div>
               </>
             )}
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-border-subtle gap-8 pt-4">
        {[
          { id: "drives", label: "Placement Streams", icon: <LuBriefcase size={16} /> },
          { id: "coding", label: "Coding Profile", icon: <LuCode size={16} /> },
          { id: "projects", label: "Projects Portfolio", icon: <LuFolder size={16} /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id as any)}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all cursor-pointer",
              mainTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {mainTab === "drives" && (
        <>
          {/* Control Bar */}
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between sticky -top-4 md:-top-6 z-30 bg-background/95 backdrop-blur-md py-2.5 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full lg:w-auto no-scrollbar">
              {["All", "Applied", "In Review", "Shortlisted", "Offered", "Accepted", "Not Selected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                    activeTab === tab 
                      ? "bg-foreground text-white shadow-tactile scale-105" 
                      : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-96 group">
              <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search company or job role..." 
                className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Pipeline Cards Grid */}
          <div className="space-y-8">
            {filteredApps.map((app) => {
              const isOfferOpen = expandedOfferId === app.id;
              const hasOffer = app.offer !== undefined;
              const isPlacedLocally = acceptedOffers[app.id] || app.overallStatus === "Accepted" || app.overallStatus === "Joined";
              
              return (
                <div 
                  key={app.id} 
                  className={cn(
                    "app-card p-8 transition-all relative overflow-hidden group border",
                    isOfferOpen ? "border-primary shadow-2xl shadow-primary/5 ring-4 ring-primary/5 bg-primary/[0.01]" : "hover:border-primary/20",
                    isPlacedLocally && "border-emerald-500/30 bg-emerald-500/[0.005]"
                  )}
                >
                  {isPlacedLocally && (
                    <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Secured</span>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle/50">
                    <div className="flex items-center gap-6">
                      <div className="shrink-0 transition-transform group-hover:scale-105">
                        <CompanyLogo name={app.company} size={64} rounded="rounded-2xl" />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-black tracking-tight">{app.company}</h3>
                        <p className="font-sans text-sm font-bold text-muted uppercase tracking-widest mt-1 flex items-center gap-1.5">
                          {app.role}
                          <span className="h-1 w-1 rounded-full bg-muted/40" />
                          <span className="text-primary tracking-normal font-black flex items-center gap-0.5">
                            <LuIndianRupee size={12} />
                            {app.ctc}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-start md:self-center">
                      <div className="text-left md:text-right">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest",
                          isPlacedLocally ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15" :
                          app.overallStatus === "Not Selected" ? "bg-red-500/10 text-red-500 border border-red-500/15" :
                          app.overallStatus === "Offered" ? "bg-purple-500/15 text-purple-600 border border-purple-500/20 animate-pulse" :
                          "bg-primary/10 text-primary border border-primary/15"
                        )}>
                          {isPlacedLocally ? (
                            <>
                              <LuShieldCheck size={12} />
                              Accepted Offer
                            </>
                          ) : (
                            <>
                              <LuClock size={12} />
                              {app.overallStatus}
                            </>
                          )}
                        </span>
                      </div>

                      {hasOffer && (
                        <button 
                          onClick={() => setExpandedOfferId(isOfferOpen ? null : app.id)}
                          className={cn(
                            "btn px-5 py-3 h-auto text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
                            isOfferOpen 
                              ? "bg-foreground text-white hover:bg-foreground/95" 
                              : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                          )}
                        >
                          <LuAward size={14} />
                          {isOfferOpen ? "Close Details" : "View Offer & Onboarding"}
                        </button>
                      )}
                      
                      {!hasOffer && app.overallStatus !== "Not Selected" && (
                        <button className="btn-secondary px-5 py-3 h-auto text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer">
                          Prepare Now
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <p className="text-[10px] font-black text-muted/50 uppercase tracking-[0.2em] mb-4">Recruitment Stages Log</p>
                    <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth flex items-center gap-0 w-full select-none">
                      {app.events.map((event, idx) => {
                        const isCompleted = event.status === "Completed" || (isPlacedLocally && idx === app.events.length - 1);
                        const isCurrent = event.status === "Current" && !isPlacedLocally;
                        const isRejected = event.status === "Rejected";
                        const isSkipped = event.status === "Skipped";

                        return (
                          <div key={event.id} className={cn("flex items-center shrink-0", isSkipped && "opacity-30")}>
                            <div className="flex flex-col items-center text-center relative z-10 w-32 px-2">
                              <div className={cn(
                                "h-12 w-12 rounded-full border-4 border-background flex items-center justify-center relative transition-all duration-300 shadow-sm",
                                isCompleted ? "bg-emerald-500 text-white" :
                                isCurrent ? "bg-primary text-white shadow-tactile animate-pulse scale-105" :
                                isRejected ? "bg-red-500 text-white" :
                                isSkipped ? "bg-surface/30 border-2 border-dashed border-border-subtle/50 text-muted/30" :
                                "bg-surface border-border-subtle text-muted"
                              )}>
                                {isCompleted ? <LuCircleCheck size={18} /> :
                                 isCurrent ? <LuTarget size={18} /> :
                                 isRejected ? <LuX size={18} /> :
                                 isSkipped ? <span className="text-xs font-semibold select-none">—</span> :
                                 <LuCircle size={14} />}
                              </div>
                              
                              <span className="text-[9px] font-black text-muted/60 uppercase tracking-widest mt-2 leading-none">{event.date}</span>
                              <span className={cn(
                                "font-display text-xs font-black tracking-tight mt-1 truncate max-w-[110px] block leading-snug",
                                isCurrent ? "text-primary font-black" : "text-foreground"
                              )}>
                                {isPlacedLocally && idx === app.events.length - 1 ? "Offer Secured" : event.title}
                              </span>
                            </div>
                            
                            {idx < app.events.length - 1 && (
                              <div className={cn(
                                "h-[2px] w-20 mx-1 self-center rounded-full mt-[-24px] shrink-0",
                                isCompleted ? "bg-emerald-500" :
                                (event.status === "Skipped" || event.status === "Rejected" || app.events[idx + 1]?.status === "Skipped")
                                  ? "bg-border-subtle/30"
                                  : "bg-border-subtle"
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isOfferOpen && app.offer && (
                    <div className="mt-8 border-t border-border-subtle/80 pt-8 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-7 bg-foreground text-white rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary-light border border-primary/30 text-[10px] font-black uppercase tracking-widest">
                                {app.offer.type}
                              </span>
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Issued {app.offer.offerDate}</span>
                            </div>
                            
                            <h4 className="font-display text-3xl font-black tracking-tighter">
                              Official Offer & <span className="text-primary">Roadmap.</span>
                            </h4>
                            
                            <p className="font-sans text-base text-white/60 leading-relaxed max-w-xl">
                              {app.offer.description}
                            </p>

                            <div className="pt-8 border-t border-white/10 space-y-6">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <LuTimer className="text-primary" />
                                Onboarding Milestones
                              </h5>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <Milestone icon={<LuPartyPopper />} label="Offer Released" date={app.offer.offerDate} completed />
                                 <Milestone 
                                   icon={<LuCircleCheck />} 
                                   label="Acceptance" 
                                   date={isPlacedLocally ? "Accepted" : "Pending"} 
                                   active={!isPlacedLocally} 
                                   completed={isPlacedLocally} 
                                 />
                                 <Milestone 
                                   icon={<LuShieldCheck />} 
                                   label="Verification" 
                                   date={isPlacedLocally ? "Complete" : "Awaiting Sign"} 
                                   completed={isPlacedLocally} 
                                 />
                                 <Milestone icon={<LuMapPin />} label="Joining Day" date={app.offer.joiningDate} />
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        </div>

                        <div className="lg:col-span-5 space-y-6 h-full">
                          <div className="bg-surface border border-border-subtle p-8 rounded-3xl flex flex-col justify-between min-h-[320px]">
                            <div>
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                                <LuSparkles className="text-primary" />
                                Required Onboarding Actions
                              </h5>
                              
                              <div className="space-y-3">
                                {app.offer?.actionsRequired.map((action, i) => {
                                  const actionKey = `${app.id}-${action}`;
                                  const isItemChecked = completedActions[actionKey] || 
                                    (action === "Accept Offer" && isPlacedLocally) ||
                                    (action === "Choose Joining Date Slot" && app.offer?.dbJoiningDate);
                                  
                                  return (
                                    <div 
                                      key={i} 
                                      onClick={() => {
                                        if (action === "Choose Joining Date Slot") {
                                          setDateModalData({
                                            appId: app.id,
                                            companyId: app.offer?.companyId || "",
                                            driveId: app.driveId || "",
                                            roleTitle: app.role,
                                            packageCtc: app.ctc,
                                            currentDate: app.offer?.dbJoiningDate
                                          });
                                          setIsDateModalOpen(true);
                                        } else {
                                          toggleActionItem(actionKey);
                                        }
                                      }}
                                      className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all group/action cursor-pointer select-none",
                                        isItemChecked 
                                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" 
                                          : "border-border-subtle bg-background/50 hover:bg-background"
                                      )}
                                    >
                                      <span className={cn(
                                        "font-sans text-xs font-bold transition-all",
                                        isItemChecked ? "line-through opacity-70" : "text-foreground"
                                      )}>
                                        {action}
                                      </span>
                                      {isItemChecked ? (
                                        <LuCircleCheck size={18} className="text-emerald-500" />
                                      ) : (
                                        <LuChevronRight size={18} className="text-muted/40 group-hover/action:text-primary transition-all translate-x-0 group-hover/action:translate-x-1" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {!isPlacedLocally ? (
                              <button 
                                onClick={() => handleAcceptOffer(app)}
                                className="btn-primary w-full py-4 rounded-2xl mt-6 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer"
                              >
                                Sign & Accept Offer
                                <LuArrowRight size={16} />
                              </button>
                            ) : (
                              <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <LuCircleCheck size={16} />
                                Offer Secured
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface border border-border-subtle p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex gap-4 items-center">
                          <div className="h-12 w-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                            <LuInfo size={24} />
                          </div>
                          <div>
                            <h6 className="font-display text-base font-black leading-tight">Offer Discrepancy?</h6>
                            <p className="font-sans text-xs font-medium text-muted mt-1">If the terms don&apos;t match what you discussed during your rounds, raise a query with our placement office.</p>
                          </div>
                        </div>
                        <button className="btn-secondary whitespace-nowrap px-6 py-3 h-auto text-[9px] uppercase tracking-widest self-stretch sm:self-auto rounded-xl cursor-pointer">
                          Raise Ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredApps.length === 0 && (
              <div className="py-24 text-center app-card">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
                  <LuBuilding2 size={28} />
                </div>
                <h3 className="font-display text-2xl font-black tracking-tight text-foreground">No Pipelines Found</h3>
                <p className="text-muted mt-2 font-medium text-base">We couldn&apos;t find any applications in the {activeTab !== "All" ? `"${activeTab}"` : ""} stream.</p>
              </div>
            )}
          </div>
        </>
      )}

      {mainTab === "coding" && (
        <div className="space-y-8 max-w-4xl">
          <div className="bg-surface border border-border-subtle p-8 rounded-3xl shadow-xl shadow-black/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="relative z-10 space-y-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">
                LeetCode Profile
              </span>
              <h3 className="font-display text-3xl font-black tracking-tight">
                Coding <span className="text-primary">Performance.</span>
              </h3>
              <p className="font-sans text-sm font-medium text-muted max-w-xl leading-relaxed">
                Connect your LeetCode handle to sync your problem count. Stats will update the leaderboard rankings.
              </p>
              
              {profile?.notes ? (
                <div className="flex items-center gap-3 p-3 bg-foreground/5 rounded-2xl border border-border-subtle/50 w-fit">
                  <LuGithub className="text-muted" size={16} />
                  <span className="text-xs font-bold text-foreground">{profile?.notes}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-red-500/5 rounded-2xl border border-red-500/10 w-fit text-red-600">
                  <LuInfo size={16} />
                  <span className="text-xs font-bold">LeetCode handle not set in Profile settings.</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 shrink-0">
              <button
                onClick={handleSyncLeetcode}
                disabled={isSyncing || !profile?.notes}
                className={cn(
                  "btn-primary h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest cursor-pointer",
                  (isSyncing || !profile?.notes) && "opacity-50 cursor-not-allowed"
                )}
              >
                <LuRefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {isSyncing ? "Syncing..." : "Sync Stats"}
              </button>
              {lastFetched && (
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Last Sync: {new Date(lastFetched).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Stats breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { label: "Total Solved", value: leetcodeStats.total, color: "text-foreground bg-foreground/5" },
              { label: "Easy Solved", value: leetcodeStats.easy || "—", color: "text-emerald-500 bg-emerald-500/10" },
              { label: "Medium Solved", value: leetcodeStats.medium || "—", color: "text-amber-500 bg-amber-500/10" },
              { label: "Hard Solved", value: leetcodeStats.hard || "—", color: "text-red-500 bg-red-500/10" }
            ].map((stat, i) => (
              <div key={i} className="bg-surface border border-border-subtle p-6 rounded-3xl text-center space-y-2 flex flex-col justify-center min-h-[140px] shadow-sm">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">{stat.label}</span>
                <span className={cn("text-4xl font-black rounded-2xl py-1 px-4 w-fit mx-auto", stat.color)}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mainTab === "projects" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-3xl font-black tracking-tight">
                Project <span className="text-primary">Showcase.</span>
              </h3>
              <p className="text-sm font-medium text-muted mt-1">Manage, CRUD, and showcase your developer projects here.</p>
            </div>
            <button
              onClick={() => handleOpenProjectModal()}
              className="btn-primary py-3 px-6 text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <LuPlus size={16} />
              Add Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="app-card p-6 flex flex-col justify-between relative group border hover:border-primary/20">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-display text-xl font-bold tracking-tight text-foreground truncate max-w-[80%]">
                      {proj.title}
                    </h4>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenProjectModal(proj)}
                        className="p-2 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <LuPencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingProjectId(proj.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted font-medium line-clamp-3 leading-relaxed">
                    {proj.description || "No description provided."}
                  </p>

                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.technologies.split(",").map((tech: string, index: number) => (
                        <span key={index} className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-black uppercase tracking-wider">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-border-subtle/50">
                  {proj.github_url && (
                    <a
                      href={proj.github_url.startsWith("http") ? proj.github_url : `https://${proj.github_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <LuGithub size={14} />
                      Code Repository
                    </a>
                  )}
                  {proj.live_url && (
                    <a
                      href={proj.live_url.startsWith("http") ? proj.live_url : `https://${proj.live_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1.5 transition-colors"
                    >
                      <LuExternalLink size={14} />
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-2 py-24 text-center app-card">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
                  <LuFolder size={28} />
                </div>
                <h3 className="font-display text-2xl font-black tracking-tight text-foreground">No Projects Found</h3>
                <p className="text-muted mt-2 font-medium text-base">You haven&apos;t added any projects to your portfolio yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Slot Picker Modal */}
      {isDateModalOpen && dateModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-border-subtle bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuCalendar className="text-primary" size={20} />
                <div>
                  <h3 className="font-display text-sm font-black tracking-tight text-foreground">Choose Joining Date</h3>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Select your preferred date</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsDateModalOpen(false);
                  setDateModalData(null);
                }}
                aria-label="Close modal"
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
              >
                <LuX size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-sans text-xs font-semibold text-muted leading-relaxed">
                Choose a custom start date that coordinates best with your timeline.
              </p>
              
              <div className="border border-border-subtle bg-background/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(prev => prev - 1);
                      } else {
                        setCalendarMonth(prev => prev - 1);
                      }
                    }}
                    aria-label="Previous month"
                    className="p-2 rounded-xl hover:bg-primary/10 text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <LuChevronLeft size={16} />
                  </button>
                  <span className="font-display text-sm font-black text-foreground">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(prev => prev + 1);
                      } else {
                        setCalendarMonth(prev => prev + 1);
                      }
                    }}
                    aria-label="Next month"
                    className="p-2 rounded-xl hover:bg-primary/10 text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <LuChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                    <span key={d} className="text-[10px] font-black text-muted/60 uppercase tracking-widest">{d}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {daysGrid.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} />;
                    }

                    const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = tempSelectedDate === dateString;

                    return (
                      <button
                        key={dateString}
                        onClick={() => setTempSelectedDate(dateString)}
                        className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all mx-auto cursor-pointer",
                          isSelected 
                            ? "bg-primary text-white shadow-tactile font-black scale-110" 
                            : "hover:bg-primary/10 text-foreground hover:text-primary"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {tempSelectedDate && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-center text-xs font-bold text-primary">
                  Selected Date: {new Date(tempSelectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-subtle bg-background/30 flex gap-3">
              <button 
                onClick={() => {
                  setIsDateModalOpen(false);
                  setDateModalData(null);
                }}
                className="flex-1 py-3 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSelectJoiningDate(tempSelectedDate)}
                disabled={!tempSelectedDate}
                className="flex-1 btn-primary py-3 px-6 h-auto text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Confirm Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project CRUD Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-border-subtle bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
              <h3 className="font-display text-lg font-black tracking-tight text-foreground">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h3>
              <button 
                onClick={() => setIsProjectModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
              >
                <LuX size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Project Title *</label>
                <input 
                  type="text" 
                  value={projTitle} 
                  onChange={(e) => setProjTitle(e.target.value)} 
                  placeholder="e.g. Campus Recruitment Portal" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Description</label>
                <textarea 
                  value={projDesc} 
                  onChange={(e) => setProjDesc(e.target.value)} 
                  placeholder="Write a brief overview of the project..." 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Technologies (comma-separated)</label>
                <input 
                  type="text" 
                  value={projTech} 
                  onChange={(e) => setProjTech(e.target.value)} 
                  placeholder="e.g. Next.js, TypeScript, Tailwind, Supabase" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">GitHub Repository URL</label>
                <input 
                  type="text" 
                  value={projGithub} 
                  onChange={(e) => setProjGithub(e.target.value)} 
                  placeholder="e.g. github.com/username/project" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Live Demo URL</label>
                <input 
                  type="text" 
                  value={projLive} 
                  onChange={(e) => setProjLive(e.target.value)} 
                  placeholder="e.g. project-live.vercel.app" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle bg-background/30 flex gap-3">
              <button 
                onClick={() => setIsProjectModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={isSavingProject}
                className="flex-1 btn-primary py-3 px-6 h-auto text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingProject ? "Saving..." : "Save Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Custom Dialog) */}
      {deletingProjectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <h4 className="font-display text-lg font-black tracking-tight">Delete Project?</h4>
              <p className="text-sm font-semibold text-muted">Are you sure you want to permanently delete this project? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingProjectId(null)}
                className="flex-1 py-3 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await confirmDeleteProject(deletingProjectId);
                  setDeletingProjectId(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Milestone({ icon, label, date, completed = false, active = false }: { icon: React.ReactNode, label: string, date: string, completed?: boolean, active?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 shrink-0 w-full min-w-[100px]">
      <div className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center border transition-all shadow-sm",
        completed ? "bg-primary border-primary text-white" : 
        active ? "bg-primary/20 border-primary text-primary animate-pulse" :
        "bg-white/5 border-white/10 text-white/20"
      )}>
        {icon}
      </div>
      <p className={cn("text-[10px] font-black tracking-tight mt-3 leading-none", completed || active ? "text-white" : "text-white/20")}>{label}</p>
      <p className={cn("text-[9px] font-semibold mt-1", completed ? "text-primary-light" : "text-white/40")}>{date}</p>
    </div>
  );
}

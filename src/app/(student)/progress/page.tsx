"use client";

import { Sk } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { 
  LuCircle, 
  LuChevronRight,
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
  LuAward
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { db } from "@/services/database";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { toast } from "sonner";

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
  status: "Completed" | "Current" | "Upcoming" | "Rejected";
  date: string;
  description: string;
}

interface OfferDetails {
  status: "Offered" | "Accepted" | "Verified" | "Joining Soon" | "Joined";
  type: "Full Time" | "Internship" | "PPO";
  ctc: string;
  offerDate: string;
  joiningDate: string;
  description: string;
  actionsRequired: string[];
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
}

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelines, setPipelines] = useState<ApplicationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  
  // Local state to manage offer acceptances and action item checklist triggers dynamically
  const [acceptedOffers, setAcceptedOffers] = useState<Record<string, boolean>>({});
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadAllProgress() {
      setLoading(true);
      try {
        const studentId = DEV_STUDENT_ID;
        const data = await db.getStudentApplications(studentId);
        
        const formatted = data.map((app: any) => {
          const ctc = app.job_drives?.package_ctc || "12 - 18 LPA";
          const location = app.job_drives?.location || "Bangalore, India";
          const role = app.job_drives?.role_title || "Software Engineer";
          const companyName = app.job_drives?.companies?.name || "Company";
          
          // Parse eligibility rules and stages from staff ATS tracker
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

          // Generate dynamic completion percentage proportional to real stages
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

          // Build dynamic timeline stages based on application status and drive's stages
          const timeline = getTimelineStages(app.status, app.current_stage, app.applied_at, driveStages);

          // Populate mock offer details if status is Offered, Accepted, or Joined
          let offer = undefined;
          if (app.status === "Offered" || app.status === "Accepted" || app.status === "Joined") {
            offer = {
              status: app.status as any,
              type: (app.job_drives?.drive_type || "Full Time") as any,
              ctc: ctc,
              offerDate: new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              joiningDate: "July 15, 2026",
              description: `Congratulations! We are thrilled to offer you the position of ${role} on the engineering team at ${companyName}.`,
              actionsRequired: app.status === "Offered" 
                ? ["Accept Offer", "Choose Joining Date Slot"]
                : ["Upload Medical Certificate", "Verify ID Proofs"]
            };
          }

          return {
            id: app.id,
            company: companyName,
            role: role,
            overallStatus: formatCapitalized(app.status || "Applied"),
            currentStage: formatCapitalized(app.current_stage || "Applied"),
            completion: completion,
            location: location,
            ctc: ctc,
            events: timeline,
            offer: offer
          };
        });
        
        setPipelines(formatted);
      } catch (err) {
        console.error("Failed to load progress data", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllProgress();
  }, []);

  // Utility to generate stages timeline dynamically mapped to staff ATS parameters
  function getTimelineStages(
    status: string, 
    currentStageId: string, 
    appliedDate?: string, 
    driveStages?: any[]
  ) {
    const formattedDate = appliedDate 
      ? new Date(appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : "Oct 15";
    
    // Fall back to default stages if none are specified for this placement drive
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
      let stageStatus: "Completed" | "Current" | "Upcoming" | "Rejected" = "Upcoming";
      let date = "TBD";
      let description = `Process round: ${stageName}.`;

      if (status === "Rejected") {
        if (stage.id === currentStageId || (currentIdx === -1 && idx === 1)) {
          stageStatus = "Rejected";
          date = formattedDate;
          description = `Evaluation stopped at ${stageName} stage.`;
        } else if (idx < currentIdx || (currentIdx === -1 && idx < 1)) {
          stageStatus = "Completed";
          date = formattedDate;
          description = `${stageName} round successfully cleared.`;
        }
      } else if (status === "Offered" || status === "Accepted" || status === "Joined") {
        stageStatus = "Completed";
        date = formattedDate;
        description = `${stageName} round completed.`;
      } else {
        // Active candidate status mapping
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

    // Append offered milestones dynamically for completed offer releases
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

  // Handle Offer Acceptance dynamic action
  const handleAcceptOffer = (appId: string) => {
    setAcceptedOffers(prev => ({ ...prev, [appId]: true }));
    toast.success("Offer Accepted Successfully! Preparing your day-one onboarding dashboard.");
  };

  // Toggle action item checklists
  const toggleActionItem = (actionKey: string) => {
    setCompletedActions(prev => ({ ...prev, [actionKey]: !prev[actionKey] }));
  };

  // Filter application pipelines
  const filteredApps = pipelines.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Support filtering by tab state
    let matchesTab = activeTab === "All" || app.overallStatus === activeTab;
    if (activeTab === "Accepted") {
      matchesTab = app.overallStatus === "Accepted" || acceptedOffers[app.id];
    }
    
    return matchesSearch && matchesTab;
  });

  // Calculate high-fidelity stats banner metrics
  const activeCount = pipelines.filter(p => p.overallStatus !== "Rejected" && p.overallStatus !== "Accepted" && p.overallStatus !== "Joined").length;
  const placedCount = pipelines.filter(p => p.overallStatus === "Accepted" || p.overallStatus === "Joined" || acceptedOffers[p.id]).length;
  const offeredCount = pipelines.filter(p => p.overallStatus === "Offered" && !acceptedOffers[p.id]).length;

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
    <div className="space-y-12 pt-2 pb-10 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              My <span className="text-primary">Progress.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              Your entire placement ecosystem in one view. Track application status, review horizontal timelines, and complete offer onboarding tasks.
            </p>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 bg-surface border border-border-subtle p-6 rounded-3xl shadow-xl shadow-black/5">
             <div className="flex flex-col items-center px-2">
                <span className="text-3xl font-black text-primary">{String(activeCount).padStart(2, '0')}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">Active Streams</span>
             </div>
             <div className="h-10 w-px bg-border-subtle" />
             <div className="flex flex-col items-center px-2">
                <span className="text-3xl font-black text-emerald-500">{String(placedCount).padStart(2, '0')}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">Placed / Joined</span>
             </div>
             {offeredCount > 0 && (
               <>
                 <div className="h-10 w-px bg-border-subtle" />
                 <div className="flex flex-col items-center px-2 animate-pulse">
                    <span className="text-3xl font-black text-purple-500">{String(offeredCount).padStart(2, '0')}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">Action Needed</span>
                 </div>
               </>
             )}
          </div>
        </div>
      </section>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between sticky -top-4 md:-top-6 z-30 bg-background/95 backdrop-blur-md py-2.5 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full lg:w-auto no-scrollbar">
          {["All", "Applied", "In Review", "Shortlisted", "Offered", "Accepted", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-foreground text-white shadow-tactile scale-105" 
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              }`}
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
              {/* Placement success badge floating glow */}
              {isPlacedLocally && (
                <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Secured</span>
                </div>
              )}

              {/* Header Container */}
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

                {/* Right side buttons & badges */}
                <div className="flex items-center gap-4 self-start md:self-center">
                  <div className="text-left md:text-right">
                    <span className={cn(
                      "px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest",
                      isPlacedLocally ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15" :
                      app.overallStatus === "Rejected" ? "bg-red-500/10 text-red-500 border border-red-500/15" :
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
                        "btn px-5 py-3 h-auto text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm",
                        isOfferOpen 
                          ? "bg-foreground text-white hover:bg-foreground/95" 
                          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                      )}
                    >
                      <LuAward size={14} />
                      {isOfferOpen ? "Close Details" : "View Offer & Onboarding"}
                    </button>
                  )}
                  
                  {!hasOffer && app.overallStatus !== "Rejected" && (
                    <button className="btn-secondary px-5 py-3 h-auto text-[9px] font-black uppercase tracking-widest rounded-xl">
                      Prepare Now
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal Scrollable Timeline */}
              <div className="pt-6">
                <p className="text-[10px] font-black text-muted/50 uppercase tracking-[0.2em] mb-4">Recruitment Stages Log</p>
                
                <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth flex items-center gap-0 w-full select-none">
                  {app.events.map((event, idx) => {
                    const isCompleted = event.status === "Completed" || (isPlacedLocally && idx === app.events.length - 1);
                    const isCurrent = event.status === "Current" && !isPlacedLocally;
                    const isRejected = event.status === "Rejected";

                    return (
                      <div key={event.id} className="flex items-center shrink-0">
                        <div className="flex flex-col items-center text-center relative z-10 w-32 px-2">
                          <div className={cn(
                            "h-12 w-12 rounded-full border-4 border-background flex items-center justify-center relative transition-all duration-300 shadow-sm",
                            isCompleted ? "bg-emerald-500 text-white" :
                            isCurrent ? "bg-primary text-white shadow-tactile animate-pulse scale-105" :
                            isRejected ? "bg-red-500 text-white" :
                            "bg-surface border-border-subtle text-muted"
                          )}>
                            {isCompleted ? <LuCircleCheck size={18} /> :
                             isCurrent ? <LuTarget size={18} /> :
                             isRejected ? <LuX size={18} /> :
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
                            isCompleted ? "bg-emerald-500" : "bg-border-subtle"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expanding Offer & Onboarding Panel */}
              {isOfferOpen && app.offer && (
                <div className="mt-8 border-t border-border-subtle/80 pt-8 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Panel: Description & Roadmap Track */}
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

                        {/* Milestones Vertical Track */}
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
                      {/* Premium Backdrop Glow */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    </div>

                    {/* Right Panel: Onboarding checklist */}
                    <div className="lg:col-span-5 space-y-6 h-full">
                      <div className="bg-surface border border-border-subtle p-8 rounded-3xl flex flex-col justify-between min-h-[320px]">
                        <div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                            <LuSparkles className="text-primary" />
                            Required Onboarding Actions
                          </h5>
                          
                          <div className="space-y-3">
                            {app.offer.actionsRequired.map((action, i) => {
                              const actionKey = `${app.id}-${action}`;
                              const isItemChecked = completedActions[actionKey] || (action === "Accept Offer" && isPlacedLocally);
                              
                              return (
                                <div 
                                  key={i} 
                                  onClick={() => toggleActionItem(actionKey)}
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

                        {/* Sign Actions */}
                        {!isPlacedLocally ? (
                          <button 
                            onClick={() => handleAcceptOffer(app.id)}
                            className="btn-primary w-full py-4 rounded-2xl mt-6 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
                          >
                            Sign & Accept Offer
                            <LuArrowRight size={16} />
                          </button>
                        ) : (
                          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                            <LuCircleCheck size={16} />
                            Offer Fully Secured
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discrepancy Query Section */}
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
                    
                    <button className="btn-secondary whitespace-nowrap px-6 py-3 h-auto text-[9px] uppercase tracking-widest self-stretch sm:self-auto rounded-xl">
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
    </div>
  );
}

// Sub-component for Milestone card
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

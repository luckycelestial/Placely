"use client";

import { Sk } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LuCode,
  LuFolder,
  LuBriefcase,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { DEV_STUDENT_ID, isValidUuid } from "@/lib/dev-config";
import { toast } from "sonner";
import { ApplicationProgress, DateModalData, TimelineEvent } from "./types";
import { PlacementStreamsTab } from "./components/PlacementStreamsTab";
import { CodingProfileTab } from "./components/CodingProfileTab";
import { ProjectsPortfolioTab } from "./components/ProjectsPortfolioTab";
import {
  DateSlotPickerModal,
  ProjectFormModal,
  DeleteProjectConfirmModal,
  ConfirmOfferAcceptanceModal,
} from "./components/ProgressModals";

const formatCapitalized = (str: string) => {
  if (!str) return "";
  if (str.toLowerCase() === "ppo") return "PPO";
  return str
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

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
  const [dateModalData, setDateModalData] = useState<DateModalData | null>(null);

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
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projLive, setProjLive] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const [offerToConfirm, setOfferToConfirm] = useState<any | null>(null);

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

  function getTimelineStages(
    status: string,
    currentStageId: string,
    appliedDate?: string,
    driveStages?: any[]
  ) {
    const formattedDate = appliedDate
      ? new Date(appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Oct 15";

    const rawStages =
      driveStages && Array.isArray(driveStages) && driveStages.length > 0
        ? driveStages
        : [
            { id: "applied", name: "Applied" },
            { id: "shortlisted", name: "Shortlisted" },
            { id: "interview1", name: "Tech Round 1" },
            { id: "interview2", name: "Tech Round 2" },
            { id: "selection", name: "Selection" },
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
        description: description,
      };
    });

    if (
      (status === "Offered" || status === "Accepted" || status === "Joined") &&
      !baseStages.some((s) => s.id === "final-offer")
    ) {
      baseStages.push({
        id: "final-offer",
        title: "Offer Released",
        status: "Completed",
        date: formattedDate,
        description: "Official job offer released!",
      });
    }

    return baseStages;
  }

  const loadAllProgress = useCallback(async () => {
    if (!DEV_STUDENT_ID || !isValidUuid(DEV_STUDENT_ID)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const studentId = DEV_STUDENT_ID;
      const [data, offersData, statsData, profileResult, projectsResult] = await Promise.all([
        db.getStudentApplications(studentId),
        db.getStudentOffers(studentId),
        db.getStudentApplicationStats(studentId),
        db.getStudentProfile(studentId).then((p: any) => ({ data: p?.student_profiles?.[0] || p?.student_profiles || p })).catch(() => ({ data: null })),
        db.getStudentProjects(studentId).then((projects: any) => ({ data: projects || [] })).catch(() => ({ data: [] })),
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
          if (typeof rules === "string") {
            try {
              parsedRules = JSON.parse(rules);
            } catch (e) {}
          }
          if (parsedRules && Array.isArray(parsedRules.stages)) {
            driveStages = parsedRules.stages;
          }
        }

        let completion = 20;
        if (driveStages && driveStages.length > 0) {
          const idx = driveStages.findIndex((s: any) => s.id === app.current_stage);
          if (
            app.status === "Offered" ||
            app.status === "Accepted" ||
            app.status === "Joined" ||
            app.status === "Rejected"
          ) {
            completion = 100;
          } else if (idx !== -1) {
            completion = Math.round(((idx + 1) / (driveStages.length + 1)) * 100);
          }
        } else {
          if (app.status === "In Review") completion = 40;
          else if (app.status === "Shortlisted") completion = 60;
          else if (app.status === "Offered") completion = 85;
          else if (app.status === "Accepted" || app.status === "Joined" || app.status === "Rejected")
            completion = 100;
        }

        const timeline = getTimelineStages(app.status, app.current_stage, app.applied_at, driveStages);

        const realOffer = offersData.find((o: any) => o.drive_id === app.drive_id);
        let offer = undefined;
        if (
          app.status === "Offered" ||
          app.status === "Accepted" ||
          app.status === "Joined" ||
          (realOffer && (realOffer.acceptance_status === "accepted" || app.status === "offered"))
        ) {
          const isAccepted = realOffer
            ? realOffer.acceptance_status === "accepted"
            : app.status === "Accepted" || app.status === "Joined";
          const dbJoiningDate = realOffer?.joining_date;

          let displayJoiningDate = "July 15, 2026";
          if (dbJoiningDate) {
            displayJoiningDate = new Date(dbJoiningDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }

          offer = {
            status: (isAccepted ? "Accepted" : "Offered") as any,
            type: (app.job_drives?.drive_type || "Full Time") as any,
            ctc: ctc,
            offerDate: new Date(app.applied_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            joiningDate: displayJoiningDate,
            dbJoiningDate: dbJoiningDate,
            description: `Congratulations! We are thrilled to offer you the position of ${role} on the engineering team at ${companyName}.`,
            actionsRequired: !isAccepted
              ? ["Accept Offer", "Choose Joining Date Slot"]
              : ["Upload Medical Certificate", "Verify ID Proofs"],
            companyId: app.job_drives?.companies?.id || "",
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
          driveId: app.drive_id,
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
          hard: 0,
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

  const executeAcceptOffer = async (app: any) => {
    try {
      const studentId = DEV_STUDENT_ID;
      const companyId = app.offer?.companyId || "";
      const driveId = app.driveId;
      const roleTitle = app.role;
      const packageCtc = app.ctc;

      await db.acceptOffer(studentId, driveId, companyId, roleTitle, packageCtc, app.id);

      setAcceptedOffers((prev) => ({ ...prev, [app.id]: true }));
      setActiveCount((prev) => Math.max(0, prev - 1));
      setPlacedCount((prev) => prev + 1);
      setOfferedCount((prev) => Math.max(0, prev - 1));

      setPipelines((prev) =>
        prev.map((p) => {
          if (p.id === app.id) {
            return {
              ...p,
              overallStatus: "Accepted",
              offer: p.offer
                ? {
                    ...p.offer,
                    status: "Accepted",
                    actionsRequired: ["Upload Medical Certificate", "Verify ID Proofs"],
                  }
                : undefined,
            };
          }
          return p;
        })
      );

      toast.success("Offer Accepted Successfully! Placement Lock activated.");
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

      const displayDate = new Date(selectedDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      setPipelines((prev) =>
        prev.map((p) => {
          if (p.id === dateModalData.appId) {
            return {
              ...p,
              offer: p.offer
                ? {
                    ...p.offer,
                    joiningDate: displayDate,
                    dbJoiningDate: selectedDate,
                  }
                : undefined,
            };
          }
          return p;
        })
      );

      setIsDateModalOpen(false);
      setDateModalData(null);
      toast.success("Joining date updated successfully!");
    } catch (err) {
      console.error("Failed to set joining date:", err);
      toast.error("Failed to set joining date. Please try again.");
    }
  };

  const toggleActionItem = (actionKey: string) => {
    setCompletedActions((prev) => ({ ...prev, [actionKey]: !prev[actionKey] }));
  };

  const filteredApps = useMemo(() => {
    return pipelines.filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    const leetcodeHandle = profile?.notes?.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, "").trim();
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
        body: JSON.stringify({ query, variables: { username: leetcodeHandle } }),
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
        .from("student_profiles")
        .update({
          leetcode_count: totalVal,
          leetcode_last_fetched: nowStr,
        })
        .eq("student_id", DEV_STUDENT_ID);

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
        live_url: projLive.trim() || null,
      };

      if (editingProject) {
        await db.updateTableCell("student_projects", editingProject.id, payload);
        toast.success("Project updated successfully.");
      } else {
        await db.createStudentProject(payload);
        toast.success("Project added successfully.");
      }

      const updatedProjects = await db.getStudentProjects(DEV_STUDENT_ID);
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
      await db.deleteStudentProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted successfully.");
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message || err}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 pt-2 pb-10 px-4 max-w-7xl mx-auto min-h-screen">
        <Sk.PageHeader />
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <Sk.Block className="h-12 w-full lg:w-2/3 rounded-full" />
          <Sk.Block className="h-12 w-full lg:w-1/3 rounded-2xl" />
        </div>
        <Sk.CardGrid count={3} cols={1} />
      </div>
    );
  }

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
              Track recruitment pipelines, update coding stats, and showcase project portfolios in one centralized
              hub.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-surface border border-border-subtle p-6 rounded-3xl shadow-xl shadow-black/5">
            <div className="flex flex-col items-center px-2">
              <span className="text-3xl font-black text-primary">{String(activeCount).padStart(2, "0")}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1 font-sans">
                Active Streams
              </span>
            </div>
            <div className="h-10 w-px bg-border-subtle" />
            <div className="flex flex-col items-center px-2">
              <span className="text-3xl font-black text-emerald-500">{String(placedCount).padStart(2, "0")}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1 font-sans">
                Placed / Joined
              </span>
            </div>
            {offeredCount > 0 && (
              <>
                <div className="h-10 w-px bg-border-subtle" />
                <div className="flex flex-col items-center px-2 animate-pulse">
                  <span className="text-3xl font-black text-purple-500">
                    {String(offeredCount).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1 font-sans">
                    Action Needed
                  </span>
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
          { id: "projects", label: "Projects Portfolio", icon: <LuFolder size={16} /> },
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
        <PlacementStreamsTab
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredApps={filteredApps}
          expandedOfferId={expandedOfferId}
          setExpandedOfferId={setExpandedOfferId}
          acceptedOffers={acceptedOffers}
          completedActions={completedActions}
          onToggleActionItem={toggleActionItem}
          onOpenDateModal={(data) => {
            setDateModalData(data);
            setIsDateModalOpen(true);
          }}
          onAcceptOffer={(app) => setOfferToConfirm(app)}
        />
      )}

      {mainTab === "coding" && (
        <CodingProfileTab
          profile={profile}
          leetcodeStats={leetcodeStats}
          lastFetched={lastFetched}
          isSyncing={isSyncing}
          onSyncLeetcode={handleSyncLeetcode}
          currentStudentId={DEV_STUDENT_ID}
        />
      )}

      {mainTab === "projects" && (
        <ProjectsPortfolioTab
          projects={projects}
          onOpenProjectModal={handleOpenProjectModal}
          onSetDeletingProjectId={(id) => setDeletingProjectId(id)}
        />
      )}

      {/* Date Slot Picker Modal */}
      <DateSlotPickerModal
        isOpen={isDateModalOpen}
        onClose={() => {
          setIsDateModalOpen(false);
          setDateModalData(null);
        }}
        dateModalData={dateModalData}
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        calendarYear={calendarYear}
        setCalendarYear={setCalendarYear}
        tempSelectedDate={tempSelectedDate}
        setTempSelectedDate={setTempSelectedDate}
        onConfirmDate={handleSelectJoiningDate}
      />

      {/* Project CRUD Modal */}
      <ProjectFormModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        editingProject={editingProject}
        projTitle={projTitle}
        setProjTitle={setProjTitle}
        projDesc={projDesc}
        setProjDesc={setProjDesc}
        projTech={projTech}
        setProjTech={setProjTech}
        projGithub={projGithub}
        setProjGithub={setProjGithub}
        projLive={projLive}
        setProjLive={setProjLive}
        isSavingProject={isSavingProject}
        onSaveProject={handleSaveProject}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProjectConfirmModal
        deletingProjectId={deletingProjectId}
        onClose={() => setDeletingProjectId(null)}
        onConfirmDelete={confirmDeleteProject}
      />

      {/* Confirm Offer Acceptance Modal */}
      <ConfirmOfferAcceptanceModal
        offerToConfirm={offerToConfirm}
        onClose={() => setOfferToConfirm(null)}
        onConfirmAccept={executeAcceptOffer}
      />
    </div>
  );
}

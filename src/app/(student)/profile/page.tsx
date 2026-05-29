"use client";
import { Sk } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuGraduationCap, 
  LuBook, LuCalendar, LuFileText, LuUpload, LuExternalLink,
  LuCircleCheck, LuArrowRight, LuGlobe, LuBriefcase, 
  LuIndianRupee, LuFolderOpen, LuTriangleAlert, LuBadgeCheck,
  LuHash, LuX
} from "react-icons/lu";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { ProfileSection } from "@/components/student/profile-section";
import { db } from "@/services/database";
import Link from "next/link";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { cn } from "@/lib/utils";
import { getSystemSettings } from "@/services/settings";
import { getYearFromBatch, getBatchRangeFromYear, getRomanYear } from "@/lib/batch-utils";
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

export default function ProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [placementInterest, setPlacementInterest] = useState<string>("Interested");
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Social Links States
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  useEffect(() => {
    if (student) {
      const pref = student?.student_preferences?.[0] || student?.student_preferences || {};
      setPlacementInterest(pref.placement_interest || "Interested");
    }
  }, [student]);

  const handlePlacementInterestChange = async (value: string) => {
    setPlacementInterest(value);
    setIsSavingPref(true);
    setSaveSuccess(false);
    try {
      await db.updateStudentProfile(DEV_STUDENT_ID, {
        placement_interest: value
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving placement interest:", error);
      alert("Failed to save preference: " + (error.message || error));
    } finally {
      setIsSavingPref(false);
    }
  };

  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  useEffect(() => {
    async function loadProfileAndSettings() {
      try {
        const [profileData, settingsData, appsData] = await Promise.all([
          db.getStudentProfile(DEV_STUDENT_ID),
          getSystemSettings(),
          db.getStudentApplications(DEV_STUDENT_ID)
        ]);
        setStudent(profileData);
        setIsCompleted(settingsData.isAcademicYearCompleted);
        setApplications(appsData);

        // Populate links states
        const prof = profileData?.student_profiles?.[0] || profileData?.student_profiles || {};
        setGithubUrl(prof.github_url || "");
        setLinkedinUrl(prof.linkedin_url || "");
        setLeetcodeUrl(prof.notes || "");
        setPortfolioUrl(prof.portfolio_url || "");
      } catch (error) {
        console.error("Error loading profile, settings or applications:", error);
      } finally {
        setLoading(false);
        setLoadingApplications(false);
      }
    }
    loadProfileAndSettings();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const userId = student.user_id || student.users?.id;
        if (!userId) throw new Error("User ID not found in profile data");
        await db.updateProfilePicture(userId, base64String);
        setStudent((prev: any) => ({ ...prev, users: { ...prev.users, avatar_url: base64String } }));
      } catch (error: any) {
        alert(`Failed to update profile picture: ${error.message || "Unknown error"}`);
      }
    };
    reader.onerror = () => alert("Failed to read the file");
    reader.readAsDataURL(file);
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLinks(true);
    try {
      await db.updateStudentProfile(DEV_STUDENT_ID, {
        github_url: githubUrl || null,
        linkedin_url: linkedinUrl || null,
        portfolio_url: portfolioUrl || null,
        notes: leetcodeUrl || null
      });

      setStudent((prev: any) => {
        let updatedProfiles = prev.student_profiles;
        if (Array.isArray(prev.student_profiles)) {
          updatedProfiles = [{
            ...prev.student_profiles[0],
            github_url: githubUrl || null,
            linkedin_url: linkedinUrl || null,
            portfolio_url: portfolioUrl || null,
            notes: leetcodeUrl || null
          }];
        } else {
          updatedProfiles = {
            ...prev.student_profiles,
            github_url: githubUrl || null,
            linkedin_url: linkedinUrl || null,
            portfolio_url: portfolioUrl || null,
            notes: leetcodeUrl || null
          };
        }
        return {
          ...prev,
          student_profiles: updatedProfiles
        };
      });

      setShowLinksModal(false);
      toast.success("Professional links updated successfully!");
    } catch (error: any) {
      console.error("Error saving professional links:", error);
      alert("Failed to save links: " + (error.message || error));
    } finally {
      setIsSavingLinks(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 max-w-7xl pt-2 pb-10 px-4 mx-auto">
        <Sk.Profile />
      </div>
    );
  }

  const academics = student?.student_academics?.[0] || student?.student_academics || {};
  const profile = student?.student_profiles?.[0] || student?.student_profiles || {};
  const contacts = student?.student_contacts?.[0] || student?.student_contacts || {};
  const completionPercentage = student?.profile_completion || 0;

  const range = getBatchRangeFromYear(student?.year);
  const startYear = range.startYear;
  const endYear = range.endYear;
  const yearNum = getYearFromBatch(student?.year, isCompleted);
  const romanYear = getRomanYear(yearNum);

  // Semester CGPA data
  const semesterCgpa: Record<string, number> = academics?.semester_cgpa || {};
  const semKeys = ['s1','s2','s3','s4','s5','s6','s7','s8'];
  const filledSems = semKeys.filter(k => semesterCgpa[k] && Number(semesterCgpa[k]) > 0);
  const aggregateCgpa = filledSems.length > 0
    ? (filledSems.reduce((acc, k) => acc + Number(semesterCgpa[k]), 0) / filledSems.length).toFixed(2)
    : (academics?.cgpa || 0).toFixed(2);

  // Arrears data
  const historyOfArrears = academics?.history_of_arrears || academics?.history_of_backlogs || false;
  const activeArrears = academics?.active_arrears ?? academics?.current_backlogs ?? 0;

  // Address
  const addressParts = [contacts?.address, contacts?.city, contacts?.state, contacts?.pincode].filter(Boolean);
  const physicalAddress = addressParts.join(', ') || null;
  const permanentAddress = contacts?.permanent_address || null;

  // Format DOB
  const dobFormatted = student?.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-12 max-w-7xl pt-2 pb-10 px-4 mx-auto">
      {/* ── Master Profile Card ── */}
      <div className="app-card overflow-hidden border border-border-subtle shadow-xl bg-surface">
        <div className="p-8 md:p-12 relative">
          <div className="flex flex-col lg:flex-row gap-10 items-start relative z-10">
            {/* Profile Image */}
            <div className="relative group flex-shrink-0">
              <div className="h-44 w-44 rounded-3xl bg-surface p-2 shadow-sm transition-transform group-hover:scale-105 border border-border-subtle">
                <div className="h-full w-full rounded-2xl bg-surface flex items-center justify-center text-primary/20 border border-primary/5 overflow-hidden">
                  {student?.users?.avatar_url ? (
                    <img src={student.users.avatar_url} alt="Profile" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <LuUser size={100} />
                  )}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-primary text-white shadow-lg border-4 border-white flex items-center justify-center hover:scale-110 transition-transform"
              >
                <LuUpload size={20} />
              </button>
            </div>

            {/* Identity & Academic Info */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground">
                {student?.users?.name || "Student"}
              </h2>
              <p className="font-display text-2xl font-bold mt-2 text-muted-foreground/80">
                B.Tech {student?.department || "Department"} ({startYear}-{endYear} : {romanYear})
              </p>

              {/* Identity chips */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-5">
                {student?.register_number && (
                  <Chip icon={LuBook} label="Reg." value={student.register_number} />
                )}
                {student?.roll_number && (
                  <Chip icon={LuHash} label="Roll" value={student.roll_number} />
                )}
                {student?.gender && (
                  <Chip icon={LuUser} label="" value={student.gender} />
                )}
                {dobFormatted && (
                  <Chip icon={LuCalendar} label="DOB" value={dobFormatted} />
                )}
                <Chip icon={LuGraduationCap} label="CGPA" value={`${aggregateCgpa} / 10`} highlight />
              </div>

              {/* Completeness Bar */}
              <div className="mt-8 max-w-sm mx-auto lg:mx-0">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Profile Completeness</span>
                  <span className="text-xl font-display font-black text-primary">{completionPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border-subtle">
                  <div className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,56,60,0.2)]" style={{ width: `${completionPercentage}%` }} />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="w-full lg:w-auto flex flex-col gap-3">
              <HeaderDetailItem value={student?.users?.email || ""} icon={LuMail} />
              <HeaderDetailItem value={student?.users?.phone || "+91 ----- -----"} icon={LuPhone} />
              {physicalAddress ? (
                <HeaderDetailItem value={physicalAddress} icon={LuMapPin} />
              ) : (
                <HeaderDetailItem value="Address not set" icon={LuMapPin} />
              )}
            </div>
          </div>

          {/* Decor */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50" />
        </div>
      </div>

      {/* ── Academic Performance ── */}
      <ProfileSection title="Academic Performance" description="Score Breakdown">
        <div className="mt-6 space-y-8">
          {/* School Scores */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">School & Pre-University</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ScoreCard label="10th Grade" value={academics?.tenth_score} unit="%" />
              <ScoreCard label="12th Grade" value={academics?.twelfth_score} unit="%" />
              <ScoreCard label="Diploma" value={academics?.diploma_score} unit="%" optional />
            </div>
          </div>

          {/* Semester CGPA */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Semester-wise CGPA</p>
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full">
                <LuGraduationCap size={14} />
                <span className="text-xs font-black">Aggregate: {aggregateCgpa}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {semKeys.map((key, idx) => {
                const val = semesterCgpa[key] ? Number(semesterCgpa[key]) : null;
                const pct = val ? (val / 10) * 100 : 0;
                return (
                  <div key={key} className="flex flex-col items-center gap-2">
                    <div className="relative w-full h-24 bg-background rounded-2xl border border-border-subtle overflow-hidden flex flex-col-reverse">
                      <div
                        className={cn("w-full transition-all duration-700 rounded-b-2xl", val ? "bg-primary/80" : "bg-border-subtle/30")}
                        style={{ height: `${pct}%` }}
                      />
                      {val && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground">
                          {val.toFixed(1)}
                        </span>
                      )}
                      {!val && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted/40">—</span>
                      )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted">S{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrears */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Arrears Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={cn(
                "p-5 rounded-3xl border flex items-center gap-4",
                activeArrears > 0 ? "bg-red-50 border-red-200" : "bg-green-50/60 border-green-200"
              )}>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  activeArrears > 0 ? "bg-red-500 text-white" : "bg-green-500 text-white"
                )}>
                  {activeArrears > 0 ? <LuTriangleAlert size={22} /> : <LuCircleCheck size={22} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Active Arrears</p>
                  <p className={cn("text-2xl font-black font-display", activeArrears > 0 ? "text-red-600" : "text-green-600")}>
                    {activeArrears} <span className="text-sm font-bold">standing</span>
                  </p>
                  <p className="text-xs text-muted mt-0.5">{activeArrears > 0 ? "Prevents immediate placement eligibility" : "No active backlogs"}</p>
                </div>
              </div>
              <div className={cn(
                "p-5 rounded-3xl border flex items-center gap-4",
                historyOfArrears ? "bg-amber-50 border-amber-200" : "bg-green-50/60 border-green-200"
              )}>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  historyOfArrears ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                )}>
                  {historyOfArrears ? <LuTriangleAlert size={22} /> : <LuBadgeCheck size={22} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">History of Arrears</p>
                  <p className={cn("text-2xl font-black font-display", historyOfArrears ? "text-amber-600" : "text-green-600")}>
                    {historyOfArrears ? "Yes" : "No"}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{historyOfArrears ? "Previously had cleared backlogs" : "Clean academic record"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProfileSection>

      {/* ── Address Details ── */}
      <ProfileSection title="Address Details" description="Location & Contact">
        <div className="grid gap-4 sm:grid-cols-2 mt-6">
          <div className="p-6 rounded-3xl bg-background border border-border-subtle">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Current / Physical Address</p>
            {physicalAddress ? (
              <p className="font-semibold text-foreground leading-relaxed">{physicalAddress}</p>
            ) : (
              <p className="text-sm text-muted">Not set</p>
            )}
          </div>
          <div className="p-6 rounded-3xl bg-background border border-border-subtle">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Permanent Address</p>
            {permanentAddress ? (
              <p className="font-semibold text-foreground leading-relaxed">{permanentAddress}</p>
            ) : (
              <p className="text-sm text-muted">Not set</p>
            )}
          </div>
        </div>
      </ProfileSection>

      {/* ── Placement Preferences ── */}
      <ProfileSection title="Placement Preferences" description="Career Strategy">
        <div className="space-y-8 mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <DetailItem value="SDE / Full Stack" icon={LuBriefcase} />
            <DetailItem value="12 - 18 LPA" icon={LuIndianRupee} />
            <DetailItem value="Bangalore, Hyderabad, Remote" icon={LuMapPin} />
          </div>

          {/* Interactive Placement Interest Option */}
          <div className="p-6 md:p-8 rounded-3xl bg-background border border-border-subtle shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-xl font-display font-black tracking-tight text-foreground flex items-center gap-2">
                  Placement Interest
                </h4>
                <p className="text-xs text-muted mt-1">Specify whether you wish to participate in active campus placement drives.</p>
              </div>

              {/* Status Saver Badge */}
              <div className="flex items-center gap-2 h-7">
                {isSavingPref && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-black animate-pulse border border-primary/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    Saving...
                  </span>
                )}
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black border border-emerald-100">
                    <LuCircleCheck size={12} className="text-emerald-500" />
                    Saved to profile
                  </span>
                )}
              </div>
            </div>

            {/* Premium Radio Selection Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InterestRadioCard
                title="Interested"
                description="Actively looking for placement opportunities"
                icon={LuBriefcase}
                isSelected={placementInterest === "Interested"}
                onClick={() => handlePlacementInterestChange("Interested")}
              />
              <InterestRadioCard
                title="Higher Studies"
                description="Pursuing post-graduation or research"
                icon={LuGraduationCap}
                isSelected={placementInterest === "Not Interested: Higher Studies"}
                onClick={() => handlePlacementInterestChange("Not Interested: Higher Studies")}
              />
              <InterestRadioCard
                title="Entrepreneurship"
                description="Founding a startup or building business"
                icon={LuGlobe}
                isSelected={placementInterest === "Not Interested: Entrepreneurship"}
                onClick={() => handlePlacementInterestChange("Not Interested: Entrepreneurship")}
              />
              <InterestRadioCard
                title="Not Interested"
                description="Other career paths / Not specified"
                icon={LuTriangleAlert}
                isSelected={placementInterest === "Not Interested"}
                onClick={() => handlePlacementInterestChange("Not Interested")}
              />
            </div>
          </div>
        </div>
      </ProfileSection>

      {/* ── Drive Attendance History ── */}
      <ProfileSection 
        title="Drive Attendance History" 
        description="Recruitment progress, outcomes, and current status across campus drives."
      >
        {loadingApplications ? (
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Sk.Card />
            <Sk.Card />
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-6 border-2 border-dashed border-border-subtle rounded-3xl p-10 flex flex-col items-center justify-center text-muted text-center bg-surface/50">
            <LuBriefcase size={40} className="text-muted/40 mb-3" />
            <p className="font-sans text-sm font-bold text-muted uppercase tracking-widest">No recruitment history found</p>
            <p className="text-xs text-muted/60 mt-1 max-w-sm">You haven't applied to any placement or internship recruitment drives yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            {applications.map((app: any) => {
              const drive = app.job_drives || {};
              const company = drive.companies || {};
              const roundTitle = app.current_stage ? (
                app.current_stage === 'applied' ? 'Applied' :
                app.current_stage === 'shortlisted' ? 'Shortlisted' :
                app.current_stage === 'aptitude' ? 'Aptitude Assessment' :
                app.current_stage === 'interview1' ? 'Technical Interview 1' :
                app.current_stage === 'interview2' ? 'Technical Interview 2' :
                app.current_stage === 'selection' ? 'Offer Discussion' :
                app.current_stage === 'offered' ? 'Offered' :
                app.current_stage === 'rejected' ? 'Rejected' :
                formatCapitalized(app.current_stage)
              ) : 'Applied';

              const isOffered = app.status?.toLowerCase() === 'offered' || app.current_stage?.toLowerCase() === 'offered' || app.status?.toLowerCase() === 'selection';
              const isRejected = app.status?.toLowerCase() === 'rejected' || app.current_stage?.toLowerCase() === 'rejected';

              return (
                <div key={app.id} className="p-6 rounded-3xl border border-border-subtle bg-surface hover:shadow-lg transition-all group flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <CompanyLogo name={company.name || 'Unknown'} size={48} rounded="rounded-2xl shadow-tactile" className="group-hover:scale-105 transition-transform" />
                    <div className="min-w-0">
                      <h4 className="font-display text-xl font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                        {drive.role_title || 'Software Engineer'}
                      </h4>
                      <p className="text-xs font-black text-muted uppercase tracking-widest mt-0.5">
                        {company.name || 'Unknown Company'}
                      </p>
                      <p className="text-xs font-bold text-muted/80 mt-2">
                        Round Reached: <span className="text-foreground font-black">{roundTitle}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                      isOffered ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      isRejected ? "bg-red-500/10 text-red-600 border-red-500/20" :
                      "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    )}>
                      {formatCapitalized(app.status || 'Applied')}
                    </span>
                    {drive.package_ctc && (
                      <span className="text-[10px] font-black tracking-wider text-muted bg-background border border-border-subtle px-2 py-0.5 rounded-md">
                        {drive.package_ctc}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ProfileSection>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Documents */}
        <ProfileSection 
          title="Documents" 
          description="Credential Progress"
          actions={
            <Link href="/documents" className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors bg-primary/5 px-4 py-2 rounded-full">
              <LuFolderOpen size={16} />
              View Center
            </Link>
          }
        >
          <div className="grid gap-4 mt-4">
            <DocumentCard name="Resume_2024.pdf" date="Updated 2 days ago" type="pdf" />
            <DocumentCard name="10th_Marksheet.pdf" date="Completed" type="pdf" isCompleted />
            <DocumentCard name="12th_Marksheet.pdf" date="Completed" type="pdf" isCompleted />
          </div>
        </ProfileSection>

        {/* Professional Links */}
        <ProfileSection 
          title="Professional Links" 
          description="External Assets"
          actions={
            <button 
              onClick={() => setShowLinksModal(true)} 
              className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors bg-primary/5 px-4 py-2 rounded-full cursor-pointer"
            >
              <LuExternalLink size={16} />
              Connect / Edit
            </button>
          }
        >
          <div className="grid gap-4 mt-4">
            <LinkCard title="GitHub" url={profile?.github_url || "github.com/—"} icon={SiGithub} color="#181717" />
            <LinkCard title="LinkedIn" url={profile?.linkedin_url || "linkedin.com/in/—"} icon={FaLinkedin} color="#0A66C2" />
            <LinkCard title="LeetCode" url={profile?.notes || "leetcode.com/—"} icon={SiLeetcode} color="#FFA116" />
            <LinkCard title="Portfolio" url={profile?.portfolio_url || "—"} icon={LuGlobe} color="#ff383c" />
          </div>
        </ProfileSection>
      </div>

      {/* ── Connect Socials Modal ── */}
      {showLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowLinksModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-surface border border-border-subtle rounded-3xl shadow-2xl overflow-hidden z-10 transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
            <div className="p-8 md:p-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <LuGlobe size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black tracking-tight text-foreground">Connect Socials</h3>
                    <p className="text-xs text-muted mt-0.5">Link your external professional profiles.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLinksModal(false)}
                  className="h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-all cursor-pointer"
                >
                  <LuX size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveLinks} className="space-y-6">
                {/* GitHub */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                    <SiGithub size={12} /> GitHub Profile
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">github.com/</span>
                    <input 
                      type="text"
                      value={githubUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGithubUrl(val ? `github.com/${val.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}` : "");
                      }}
                      placeholder="username"
                      className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-[90px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                    <FaLinkedin size={12} /> LinkedIn Profile
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">linkedin.com/in/</span>
                    <input 
                      type="text"
                      value={linkedinUrl.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLinkedinUrl(val ? `linkedin.com/in/${val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : "");
                      }}
                      placeholder="username"
                      className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-[116px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* LeetCode */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                    <SiLeetcode size={12} /> LeetCode Username
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">leetcode.com/</span>
                    <input 
                      type="text"
                      value={leetcodeUrl.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLeetcodeUrl(val ? `leetcode.com/${val.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, '')}` : "");
                      }}
                      placeholder="username"
                      className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-[100px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Portfolio */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                    <LuGlobe size={12} /> Portfolio Website
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">https://</span>
                    <input 
                      type="text"
                      value={portfolioUrl.replace(/^(https?:\/\/)?(www\.)?/, '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPortfolioUrl(val ? `https://${val.replace(/^(https?:\/\/)?(www\.)?/, '')}` : "");
                      }}
                      placeholder="yourwebsite.com"
                      className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-[64px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8 pt-4 border-t border-border-subtle/50">
                  <button 
                    type="button"
                    onClick={() => setShowLinksModal(false)}
                    className="flex-1 bg-surface border border-border-subtle hover:bg-background rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-muted hover:text-foreground transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingLinks}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    {isSavingLinks ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : "Save Connections"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Utility Components ──

function Chip({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all",
      highlight
        ? "bg-primary/10 border-primary/20 text-primary"
        : "bg-surface border-border-subtle text-foreground"
    )}>
      <Icon size={14} className={highlight ? "text-primary" : "text-muted"} />
      {label && <span className="text-[10px] text-muted uppercase tracking-widest font-black">{label}</span>}
      <span>{value}</span>
    </div>
  );
}

function HeaderDetailItem({ value, icon: Icon }: { value: string; icon: import("react-icons").IconType }) {
  return (
    <div className="flex items-center gap-4 bg-surface/50 border border-border-subtle p-4 rounded-2xl w-full lg:min-w-[340px] shadow-sm hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={20} />
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  );
}

function ScoreCard({ label, value, unit, optional }: { label: string; value?: number | null; unit: string; optional?: boolean }) {
  const hasValue = value !== null && value !== undefined && value > 0;
  return (
    <div className={cn(
      "p-5 rounded-3xl border flex flex-col gap-2 transition-all",
      hasValue ? "bg-background border-border-subtle" : "bg-background/50 border-dashed border-border-subtle"
    )}>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}{optional && " (Optional)"}</p>
      {hasValue ? (
        <p className="font-display text-3xl font-black text-foreground">{value}<span className="text-sm text-muted font-bold ml-1">{unit}</span></p>
      ) : (
        <p className="font-display text-xl font-bold text-muted/30">—</p>
      )}
    </div>
  );
}

function DetailItem({ value, icon: Icon }: { value: string; icon: import("react-icons").IconType }) {
  return (
    <div className="flex items-center gap-4 group bg-background/50 rounded-3xl p-5 border border-border-subtle hover:border-primary transition-all">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-lg font-display font-bold tracking-tight text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function DocumentCard({ name, date, isCompleted, type }: { name: string; date: string; isCompleted?: boolean; type?: string }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-3xl bg-background border border-border-subtle hover:border-primary hover:bg-surface hover:shadow-xl hover:shadow-black/5 transition-all group">
      <div className="flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white">
          <LuFileText size={26} />
        </div>
        <div>
          <p className="font-display text-lg font-bold tracking-tight truncate max-w-[180px]">{name}</p>
          <div className="flex items-center gap-3 mt-1 font-sans text-[10px] font-bold uppercase tracking-widest text-muted">
            <span>{date}</span>
            {isCompleted && (
              <div className="flex items-center gap-1 text-emerald-500">
                <LuCircleCheck size={12} />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <button className="h-10 w-10 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary/5 transition-all">
        <LuExternalLink size={20} />
      </button>
    </div>
  );
}

function LinkCard({ title, url, icon: Icon, color }: { title: string; url: string; icon: import("react-icons").IconType; color: string }) {
  const isPlaceholder = url.includes('—') || url.length < 5;
  return (
    <a
      href={isPlaceholder ? undefined : `https://${url.replace(/^https?:\/\//, '')}`}
      target={isPlaceholder ? undefined : "_blank"}
      rel="noreferrer"
      className={cn(
        "flex items-center justify-between p-6 rounded-3xl bg-background border border-border-subtle hover:border-primary hover:bg-surface hover:shadow-xl hover:shadow-black/5 transition-all group",
        isPlaceholder && "opacity-50 cursor-default"
      )}
    >
      <div className="flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center border border-border-subtle group-hover:border-transparent transition-all" style={{ color }}>
          <Icon size={28} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{title}</p>
          <p className="font-sans text-xs font-semibold text-muted/60 lowercase">{url}</p>
        </div>
      </div>
      {!isPlaceholder && (
        <div className="h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary transition-all">
          <LuArrowRight size={20} />
        </div>
      )}
    </a>
  );
}

function InterestRadioCard({ 
  title, 
  description, 
  icon: Icon, 
  isSelected, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 relative group outline-none",
        isSelected
          ? "bg-primary/5 border-primary shadow-[0_4px_20px_rgba(255,56,60,0.06)]"
          : "bg-surface border-border-subtle hover:border-muted hover:bg-surface/80"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
        isSelected 
          ? "bg-primary text-white" 
          : "bg-primary/5 text-primary group-hover:scale-105"
      )}>
        <Icon size={20} />
      </div>
      <h5 className="font-display font-bold text-base text-foreground mb-1 flex items-center gap-1.5">
        {title}
        {isSelected && (
          <LuCircleCheck size={14} className="text-primary animate-scale-up" />
        )}
      </h5>
      <p className="text-xs text-muted/80 leading-relaxed font-sans mt-0.5">{description}</p>
    </button>
  );
}

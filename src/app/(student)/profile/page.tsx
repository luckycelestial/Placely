"use client";
import { Sk } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuGraduationCap, 
  LuBook, LuCalendar, LuFileText, LuUpload, LuExternalLink,
  LuCircleCheck, LuArrowRight, LuGlobe, LuBriefcase, 
  LuDollarSign, LuFolderOpen, LuTriangleAlert, LuBadgeCheck,
  LuHash
} from "react-icons/lu";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { ProfileSection } from "@/components/student/profile-section";
import { db } from "@/services/database";
import Link from "next/link";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await db.getStudentProfile(DEV_STUDENT_ID);
        setStudent(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
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

  if (loading) {
    return (
      <div className="space-y-12 max-w-7xl py-10 px-4 mx-auto">
        <Sk.Profile />
      </div>
    );
  }

  const academics = student?.student_academics?.[0] || student?.student_academics || {};
  const profile = student?.student_profiles?.[0] || student?.student_profiles || {};
  const contacts = student?.student_contacts?.[0] || student?.student_contacts || {};
  const completionPercentage = student?.profile_completion || 0;

  const year = student?.year || 4;
  const endYear = 2020 + (student?.year || 4);
  const startYear = endYear - 4;
  const romanMap: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
  const romanYear = romanMap[year as keyof typeof romanMap] || "IV";

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
    <div className="space-y-12 max-w-7xl py-10 px-4 mx-auto">
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
              <p className="text-sm text-muted italic">Not set</p>
            )}
          </div>
          <div className="p-6 rounded-3xl bg-background border border-border-subtle">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Permanent Address</p>
            {permanentAddress ? (
              <p className="font-semibold text-foreground leading-relaxed">{permanentAddress}</p>
            ) : (
              <p className="text-sm text-muted italic">Not set</p>
            )}
          </div>
        </div>
      </ProfileSection>

      {/* ── Placement Preferences ── */}
      <ProfileSection title="Placement Preferences" description="Career Strategy">
        <div className="grid gap-8 md:grid-cols-3 mt-4">
          <DetailItem value="SDE / Full Stack" icon={LuBriefcase} />
          <DetailItem value="12 - 18 LPA" icon={LuDollarSign} />
          <DetailItem value="Bangalore, Hyderabad, Remote" icon={LuMapPin} />
        </div>
      </ProfileSection>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Documents */}
        <ProfileSection 
          title="Documents" 
          description="Credential Verification"
          actions={
            <Link href="/documents" className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors bg-primary/5 px-4 py-2 rounded-full">
              <LuFolderOpen size={16} />
              View Center
            </Link>
          }
        >
          <div className="grid gap-4 mt-4">
            <DocumentCard name="Resume_2024.pdf" date="Updated 2 days ago" type="pdf" />
            <DocumentCard name="10th_Marksheet.pdf" date="Verified" type="pdf" isVerified />
            <DocumentCard name="12th_Marksheet.pdf" date="Verified" type="pdf" isVerified />
          </div>
        </ProfileSection>

        {/* Professional Links */}
        <ProfileSection title="Professional Links" description="External Assets">
          <div className="grid gap-4 mt-4">
            <LinkCard title="GitHub" url={profile?.github_url || "github.com/—"} icon={SiGithub} color="#181717" />
            <LinkCard title="LinkedIn" url={profile?.linkedin_url || "linkedin.com/in/—"} icon={FaLinkedin} color="#0A66C2" />
            <LinkCard title="LeetCode" url="leetcode.com/—" icon={SiLeetcode} color="#FFA116" />
            <LinkCard title="Portfolio" url={profile?.portfolio_url || "—"} icon={LuGlobe} color="#ff383c" />
          </div>
        </ProfileSection>
      </div>
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

function DocumentCard({ name, date, isVerified, type }: { name: string; date: string; isVerified?: boolean; type?: string }) {
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
            {isVerified && (
              <div className="flex items-center gap-1 text-emerald-500">
                <LuCircleCheck size={12} />
                <span>Verified</span>
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

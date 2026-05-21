"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState } from "react";
import { 
  LuUser, 
  LuMail, 
  LuPhone, 
  LuMapPin, 
  LuGraduationCap, 
  LuBook, 
  LuCalendar,
  LuFileText,
  LuUpload,
  LuExternalLink,
  LuPencil,
  LuCircleCheck,
  LuCircleX,
  LuArrowRight,
  LuGlobe,
  LuBriefcase,
  LuDollarSign,
  LuShieldCheck,
  LuFolderOpen
} from "react-icons/lu";
import { 
  SiGithub, 
  SiLeetcode 
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { ProfileSection } from "@/components/student/profile-section";
import { db } from "@/services/database";
import Link from "next/link";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { useEffect, useRef } from "react";

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

    // Check file size (limit to 2MB for Base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Update DB
      try {
        const userId = student.user_id || student.users?.id;
        if (!userId) throw new Error("User ID not found in profile data");

        await db.updateProfilePicture(userId, base64String);
        
        // Update local state
        setStudent((prev: any) => ({
          ...prev,
          users: {
            ...prev.users,
            avatar_url: base64String
          }
        }));
      } catch (error: any) {
        console.error("Error updating profile picture:", error);
        alert(`Failed to update profile picture: ${error.message || "Unknown error"}`);
      }
    };
    reader.onerror = () => {
      console.error("FileReader error");
      alert("Failed to read the file");
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="space-y-12 max-w-7xl py-10 px-4 mx-auto">
        <Sk.Profile />
      </div>
    );
  }

  const academics = student?.student_academics?.[0] || student?.student_academics;
  const profile = student?.student_profiles?.[0] || student?.student_profiles;
  const completionPercentage = student?.profile_completion || 0;

  const year = student?.year || 4;
  const endYear = 2020 + (student?.year || 4);
  const startYear = endYear - 4;
  const romanMap: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
  const romanYear = romanMap[year as keyof typeof romanMap] || "IV";

  return (
    <div className="space-y-12 max-w-7xl py-10 px-4 mx-auto">
      {/* Master Profile Card */}
      <div className="app-card overflow-hidden border border-border-subtle shadow-xl bg-surface">
        {/* Profile Header (White Theme) */}
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
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-primary text-white shadow-lg border-4 border-white flex items-center justify-center hover:scale-110 transition-transform"
              >
                <LuUpload size={20} />
              </button>
            </div>
            
            {/* Identity & Academic Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-center lg:justify-start">
                <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground">
                  {student?.users?.name || "Student"}
                </h2>
              </div>
              <p className="font-display text-2xl font-bold mt-2 text-muted-foreground/80">
                B.Tech {student?.department || "Department"} ({startYear}-{endYear} : {romanYear})
              </p>

              {/* Small Academic Info (Image 1 Style) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <LuBook size={20} />
                  </div>
                  <span className="font-display font-black text-lg text-foreground">
                    {student?.register_number || student?.roll_number || "---"}
                  </span>
                </div>
                <div className="h-4 w-px bg-border-subtle hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <LuGraduationCap size={20} />
                  </div>
                  <span className="font-display font-black text-lg text-foreground">
                    {academics?.cgpa || "0.00"} / 10
                  </span>
                </div>
              </div>
              
              {/* Completeness Bar */}
              <div className="mt-8 max-w-sm mx-auto lg:mx-0">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Profile Completeness</span>
                  <span className="text-xl font-display font-black text-primary">{completionPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border-subtle">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,56,60,0.2)]" 
                    style={{ width: `${completionPercentage}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Contact Info (Image 2 Style) */}
            <div className="w-full lg:w-auto flex flex-col gap-3">
              <HeaderDetailItem value={student?.users?.email || ""} icon={LuMail} />
              <HeaderDetailItem value={student?.users?.phone || "+91 ----- -----"} icon={LuPhone} />
              <HeaderDetailItem value="Campus Resident" icon={LuMapPin} />
            </div>
          </div>

          {/* Decor */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50" />
        </div>
      </div>

      {/* Placement Preferences */}
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
            <DocumentCard name="Resume_Aarav_2024.pdf" date="Updated 2 days ago" type="pdf" />
            <DocumentCard name="10th_Marksheet.pdf" date="Verified" type="pdf" isVerified />
            <DocumentCard name="12th_Marksheet.pdf" date="Verified" type="pdf" isVerified />
          </div>
        </ProfileSection>

        {/* Experience & Links */}
        <ProfileSection title="Professional Links" description="External Assets">
          <div className="grid gap-4 mt-4">
            <LinkCard title="GitHub" url="github.com/aarav" icon={SiGithub} color="#181717" />
            <LinkCard title="LinkedIn" url="linkedin.com/in/aarav" icon={FaLinkedin} color="#0A66C2" />
            <LinkCard title="LeetCode" url="leetcode.com/aarav" icon={SiLeetcode} color="#FFA116" />
            <LinkCard title="Portfolio" url="aarav.dev" icon={LuGlobe} color="#ff383c" />
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}

function HeaderDetailItem({ value, icon: Icon }: { value: string, icon: import("react-icons").IconType }) {
  return (
    <div className="flex items-center gap-4 bg-surface/50 border border-border-subtle p-4 rounded-2xl w-full lg:min-w-[340px] shadow-sm hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={20} />
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  );
}

function DetailItem({ value, icon: Icon, placeholder }: { value: string, icon: import("react-icons").IconType, placeholder?: string }) {
  return (
    <div className="flex items-center gap-4 group bg-background/50 rounded-3xl p-5 border border-border-subtle hover:border-primary transition-all">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-lg font-display font-bold tracking-tight text-foreground truncate">{value || placeholder}</p>
      </div>
    </div>
  );
}

function DocumentCard({ name, date, isVerified, type }: { name: string, date: string, isVerified?: boolean, type?: string }) {
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

function LinkCard({ title, url, icon: Icon, color }: { title: string, url: string, icon: import("react-icons").IconType, color: string }) {
  return (
    <a 
      href={`https://${url}`} 
      target="_blank" 
      rel="noreferrer"
      className="flex items-center justify-between p-6 rounded-3xl bg-background border border-border-subtle hover:border-primary hover:bg-surface hover:shadow-xl hover:shadow-black/5 transition-all group"
    >
      <div className="flex items-center gap-5">
        <div 
          className="h-14 w-14 rounded-2xl flex items-center justify-center border border-border-subtle group-hover:border-transparent transition-all"
          style={{ color: color }}
        >
          <Icon size={28} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{title}</p>
          <p className="font-sans text-xs font-semibold text-muted/60 lowercase">{url}</p>
        </div>
      </div>
      <div className="h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary transition-all">
        <LuArrowRight size={20} />
      </div>
    </a>
  );
}

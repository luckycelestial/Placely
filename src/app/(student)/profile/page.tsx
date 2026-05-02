"use client";

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
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const completionPercentage = 85;

  return (
    <div className="space-y-12 max-w-5xl py-10 px-4 mx-auto">
      {/* Profile Header */}
      <div className="app-card bg-primary p-8 md:p-12 overflow-hidden relative border-none">
        <div className="flex flex-col lg:flex-row gap-10 items-center relative z-10">
          <div className="relative group flex-shrink-0">
            <div className="h-44 w-44 rounded-3xl bg-white p-2 shadow-2xl transition-transform group-hover:scale-105">
              <div className="h-full w-full rounded-2xl bg-background flex items-center justify-center text-primary border-2 border-primary/10 overflow-hidden">
                <LuUser size={100} />
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-secondary text-foreground shadow-lg border-4 border-primary flex items-center justify-center hover:scale-110 transition-transform">
              <LuUpload size={20} />
            </button>
          </div>
          
          <div className="flex-1 text-center lg:text-left text-white">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-center lg:justify-start">
              <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter">John Doe</h2>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <LuShieldCheck size={16} className="text-secondary" />
                <span className="font-sans text-[10px] font-black uppercase tracking-widest text-white">
                  Verified Identity
                </span>
              </div>
            </div>
            <p className="font-display text-2xl font-bold mt-2 opacity-90">B.Tech Computer Science (2020-2024)</p>
            
            {/* Completeness Bar */}
            <div className="mt-8 max-w-md mx-auto lg:mx-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Profile Completeness</span>
                <span className="text-2xl font-display font-black text-secondary">{completionPercentage}%</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-secondary shadow-[0_0_20px_rgba(255,232,116,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${completionPercentage}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-auto">
            {!isEditing ? (
                <button 
                onClick={() => setIsEditing(true)}
                className="btn-secondary border-none bg-white hover:bg-secondary hover:text-foreground text-primary px-8 py-5 shadow-xl w-full justify-center"
              >
                <LuPencil size={20} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 px-8 py-5 flex-1 justify-center"
                >
                  <LuCircleX size={20} />
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary border-none bg-secondary text-foreground hover:scale-105 px-8 py-5 shadow-xl flex-1 justify-center"
                >
                  <LuCircleCheck size={20} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decor */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Personal Details */}
        <ProfileSection title="Personal Details" description="Identity Dispatch">
          <div className="grid gap-8">
            <DetailItem label="Full Name" value="John Doe" icon={LuUser} isEditing={isEditing} />
            <DetailItem label="Email Address" value="john.doe@university.edu" icon={LuMail} isEditing={isEditing} />
            <DetailItem label="Phone Number" value="+91 98765 43210" icon={LuPhone} isEditing={isEditing} />
            <DetailItem label="Current Address" value="Boys Hostel 2, University Campus" icon={LuMapPin} isEditing={isEditing} />
          </div>
        </ProfileSection>

        {/* Academic Overview */}
        <ProfileSection title="Academic Overview" description="Performance Metrics">
          <div className="grid gap-8">
            <DetailItem label="Roll Number" value="2024CS101" icon={LuBook} isEditing={false} />
            <DetailItem label="Current CGPA" value="8.92 / 10" icon={LuGraduationCap} isEditing={false} />
            <DetailItem label="Batch" value="2020 - 2024" icon={LuCalendar} isEditing={false} />
            <DetailItem label="Department" value="Computer Science & Engineering" icon={LuGraduationCap} isEditing={false} />
          </div>
        </ProfileSection>
      </div>

      {/* Placement Preferences */}
      <ProfileSection title="Placement Preferences" description="Career Strategy">
        <div className="grid gap-8 md:grid-cols-3 mt-4">
          <DetailItem label="Preferred Role" value="SDE / Full Stack" icon={LuBriefcase} isEditing={isEditing} />
          <DetailItem label="Expected CTC" value="12 - 18 LPA" icon={LuDollarSign} isEditing={isEditing} />
          <DetailItem label="Preferred Locations" value="Bangalore, Hyderabad, Remote" icon={LuMapPin} isEditing={isEditing} />
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
            <DocumentCard name="Resume_JohnDoe_2024.pdf" date="Updated 2 days ago" type="pdf" />
            <DocumentCard name="10th_Marksheet.pdf" date="Verified" type="pdf" isVerified />
            <DocumentCard name="12th_Marksheet.pdf" date="Verified" type="pdf" isVerified />
          </div>
        </ProfileSection>

        {/* Experience & Links */}
        <ProfileSection title="Professional Links" description="External Assets">
          <div className="grid gap-4 mt-4">
            <LinkCard title="GitHub" url="github.com/johndoe" icon={SiGithub} color="#181717" />
            <LinkCard title="LinkedIn" url="linkedin.com/in/johndoe" icon={FaLinkedin} color="#0A66C2" />
            <LinkCard title="LeetCode" url="leetcode.com/johndoe" icon={SiLeetcode} color="#FFA116" />
            <LinkCard title="Portfolio" url="johndoe.dev" icon={LuGlobe} color="#ff383c" />
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon, isEditing }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="section-label pl-2">{label}</label>
      <div className="flex items-center gap-4 group bg-background/50 rounded-3xl p-5 border border-border-subtle hover:border-primary transition-all">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
          <Icon size={20} />
        </div>
        {isEditing ? (
          <input 
            type="text" 
            defaultValue={value}
            className="w-full bg-transparent px-2 py-1 text-sm font-bold uppercase tracking-tight focus:outline-none"
          />
        ) : (
          <p className="text-lg font-display font-bold tracking-tight text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ name, date, isVerified }: any) {
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

function LinkCard({ title, url, icon: Icon, color }: any) {
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

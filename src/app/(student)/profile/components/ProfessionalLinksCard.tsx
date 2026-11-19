"use client";

import React from "react";
import { LuGlobe, LuCircleCheck, LuSettings } from "react-icons/lu";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { ProfileSection } from "@/components/student/profile-section";
import { LinkCard } from "./ProfileUiPrimitives";

interface ProfessionalLinksCardProps {
  profile: any;
  isEditingLinks: boolean;
  setIsEditingLinks: (val: boolean) => void;
  isSavingLinks: boolean;
  handleSaveLinks: () => void;
  handleCancelLinks: () => void;
  githubUrl: string;
  setGithubUrl: (val: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  leetcodeUrl: string;
  setLeetcodeUrl: (val: string) => void;
  portfolioUrl: string;
  setPortfolioUrl: (val: string) => void;
}

export function ProfessionalLinksCard({
  profile,
  isEditingLinks,
  setIsEditingLinks,
  isSavingLinks,
  handleSaveLinks,
  handleCancelLinks,
  githubUrl,
  setGithubUrl,
  linkedinUrl,
  setLinkedinUrl,
  leetcodeUrl,
  setLeetcodeUrl,
  portfolioUrl,
  setPortfolioUrl,
}: ProfessionalLinksCardProps) {
  return (
    <ProfileSection
      title="Professional Links"
      description="External Assets"
      actions={
        isEditingLinks ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelLinks}
              disabled={isSavingLinks}
              className="bg-surface hover:bg-background border border-border-subtle text-muted hover:text-foreground rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLinks}
              disabled={isSavingLinks}
              className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingLinks ? (
                <>
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <LuCircleCheck size={12} />
                  Save
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingLinks(true)}
            className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] flex items-center gap-2 cursor-pointer"
          >
            <LuSettings size={12} />
            Edit
          </button>
        )
      }
    >
      {!isEditingLinks ? (
        <div className="grid gap-4 sm:grid-cols-2 mt-6">
          {profile?.github_url && !profile.github_url.includes("—") && profile.github_url.length > 5 && (
            <LinkCard title="GitHub" url={profile.github_url} icon={SiGithub} color="#181717" />
          )}
          {profile?.linkedin_url && !profile.linkedin_url.includes("—") && profile.linkedin_url.length > 5 && (
            <LinkCard title="LinkedIn" url={profile.linkedin_url} icon={FaLinkedin} color="#0A66C2" />
          )}
          {profile?.notes && !profile.notes.includes("—") && profile.notes.length > 5 && (
            <LinkCard title="LeetCode" url={profile.notes} icon={SiLeetcode} color="#FFA116" />
          )}
          {profile?.portfolio_url && !profile.portfolio_url.includes("—") && profile.portfolio_url.length > 5 && (
            <LinkCard title="Portfolio" url={profile.portfolio_url} icon={LuGlobe} color="#ff383c" />
          )}
          {(!profile?.github_url || profile.github_url.includes("—") || profile.github_url.length <= 5) &&
            (!profile?.linkedin_url || profile.linkedin_url.includes("—") || profile.linkedin_url.length <= 5) &&
            (!profile?.notes || profile.notes.includes("—") || profile.notes.length <= 5) &&
            (!profile?.portfolio_url || profile.portfolio_url.includes("—") || profile.portfolio_url.length <= 5) && (
              <div className="col-span-2 p-8 text-center text-muted font-bold bg-background border border-dashed border-border-subtle rounded-3xl">
                No professional links connected. Click Edit to add.
              </div>
            )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 mt-6 bg-background/50 border border-border-subtle p-6 rounded-3xl animate-in fade-in duration-300">
          {/* GitHub */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
              <SiGithub size={12} /> GitHub Profile
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">
                github.com/
              </span>
              <input
                type="text"
                value={githubUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "")}
                onChange={(e) => {
                  const val = e.target.value;
                  setGithubUrl(val ? `github.com/${val.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "")}` : "");
                }}
                placeholder="username"
                className="w-full bg-background border border-border-subtle rounded-2xl py-3 pl-[90px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
              <FaLinkedin size={12} /> LinkedIn Profile
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">
                linkedin.com/in/
              </span>
              <input
                type="text"
                value={linkedinUrl.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "")}
                onChange={(e) => {
                  const val = e.target.value;
                  setLinkedinUrl(val ? `linkedin.com/in/${val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "")}` : "");
                }}
                placeholder="username"
                className="w-full bg-background border border-border-subtle rounded-2xl py-3 pl-[116px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* LeetCode */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
              <SiLeetcode size={12} /> LeetCode Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">
                leetcode.com/
              </span>
              <input
                type="text"
                value={leetcodeUrl.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, "")}
                onChange={(e) => {
                  const val = e.target.value;
                  setLeetcodeUrl(val ? `leetcode.com/${val.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, "")}` : "");
                }}
                placeholder="username"
                className="w-full bg-background border border-border-subtle rounded-2xl py-3 pl-[100px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
              <LuGlobe size={12} /> Portfolio Website
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">
                https://
              </span>
              <input
                type="text"
                value={portfolioUrl.replace(/^(https?:\/\/)?(www\.)?/, "")}
                onChange={(e) => {
                  const val = e.target.value;
                  setPortfolioUrl(val ? `https://${val.replace(/^(https?:\/\/)?(www\.)?/, "")}` : "");
                }}
                placeholder="yourwebsite.com"
                className="w-full bg-background border border-border-subtle rounded-2xl py-3 pl-[64px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </ProfileSection>
  );
}

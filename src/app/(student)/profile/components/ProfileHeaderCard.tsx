"use client";

import React, { RefObject } from "react";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuGraduationCap,
  LuBook,
  LuCalendar,
  LuUpload,
  LuCircleCheck,
  LuHash,
  LuSettings,
} from "react-icons/lu";
import { getBatchRangeFromYear, getYearFromBatch, getRomanYear } from "@/lib/batch-utils";
import { Chip, HeaderDetailItem } from "./ProfileUiPrimitives";

interface ProfileHeaderCardProps {
  student: any;
  isCompleted: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditingTop: boolean;
  setIsEditingTop: (val: boolean) => void;
  isSavingTop: boolean;
  handleSaveTop: () => void;
  handleCancelTop: () => void;
  currentAddress: string;
  setCurrentAddress: (val: string) => void;
  permAddress: string;
  setPermAddress: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  stateVal: string;
  setStateVal: (val: string) => void;
  pincode: string;
  setPincode: (val: string) => void;
  personalEmail: string;
  setPersonalEmail: (val: string) => void;
}

export function ProfileHeaderCard({
  student,
  isCompleted,
  fileInputRef,
  handlePhotoUpload,
  isEditingTop,
  setIsEditingTop,
  isSavingTop,
  handleSaveTop,
  handleCancelTop,
  currentAddress,
  setCurrentAddress,
  permAddress,
  setPermAddress,
  city,
  setCity,
  stateVal,
  setStateVal,
  pincode,
  setPincode,
  personalEmail,
  setPersonalEmail,
}: ProfileHeaderCardProps) {
  const profile = student?.student_profiles?.[0] || student?.student_profiles || {};
  const contacts = student || {};
  const completionPercentage = profile.profile_completion || student?.profile_completion || 0;

  const range = getBatchRangeFromYear(student?.year);
  const startYear = range.startYear;
  const endYear = range.endYear;
  const yearNum = getYearFromBatch(student?.year, isCompleted);
  const romanYear = getRomanYear(yearNum);

  // Semester CGPA data
  const semesterCgpa: Record<string, number> = student?.semester_cgpa || {};
  const semKeys = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
  const filledSems = semKeys.filter((k) => semesterCgpa[k] && Number(semesterCgpa[k]) > 0);
  const aggregateCgpa =
    filledSems.length > 0
      ? (filledSems.reduce((acc, k) => acc + Number(semesterCgpa[k]), 0) / filledSems.length).toFixed(2)
      : (student?.cgpa || 0).toFixed(2);

  // Address
  const addressParts = [contacts?.address, contacts?.city, contacts?.state, contacts?.pincode].filter(Boolean);
  const physicalAddress = addressParts.join(", ") || null;
  const permanentAddress = contacts?.permanent_address || null;

  // Format DOB
  const dobFormatted = student?.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="app-card overflow-hidden border border-border-subtle shadow-xl bg-surface">
      <div className="p-8 md:p-12 relative">
        <div className="flex flex-col lg:flex-row gap-10 items-start relative z-10">
          {/* Profile Image */}
          <div className="relative group flex-shrink-0">
            <div className="h-44 w-44 rounded-3xl bg-surface p-2 shadow-sm transition-transform group-hover:scale-105 border border-border-subtle">
              <div className="h-full w-full rounded-2xl bg-surface flex items-center justify-center text-primary/20 border border-primary/5 overflow-hidden">
                {student?.users?.avatar_url ? (
                  <img
                    src={student.users.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover rounded-2xl"
                  />
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
              className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-primary text-white shadow-lg border-4 border-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
              aria-label="Upload profile photo"
            >
              <LuUpload size={20} />
            </button>
          </div>

          {/* Identity & Academic Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground">
              {student?.name || student?.users?.name || "Student"}
            </h2>
            <p className="font-display text-2xl font-bold mt-2 text-muted-foreground/80">
              B.Tech {student?.department || "Department"} ({startYear}-{endYear} : {romanYear})
            </p>

            {/* Identity chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-5">
              {student?.register_number && (
                <Chip icon={LuBook} label="Reg." value={student.register_number} />
              )}
              {student?.roll_number && <Chip icon={LuHash} label="Roll" value={student.roll_number} />}
              {student?.gender && <Chip icon={LuUser} label="" value={student.gender} />}
              {dobFormatted && <Chip icon={LuCalendar} label="DOB" value={dobFormatted} />}
              <Chip icon={LuGraduationCap} label="CGPA" value={`${aggregateCgpa} / 10`} highlight />
            </div>

            {/* Completeness Bar */}
            <div className="mt-8 max-w-sm mx-auto lg:mx-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">
                  Profile Completeness
                </span>
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

          {/* Contact Info */}
          <div className="w-full lg:w-96 flex flex-col gap-3 relative z-20">
            <div className="flex justify-end mb-1">
              {isEditingTop ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelTop}
                    disabled={isSavingTop}
                    className="bg-surface hover:bg-background border border-border-subtle text-muted hover:text-foreground rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTop}
                    disabled={isSavingTop}
                    className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingTop ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <LuCircleCheck size={14} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingTop(true)}
                  className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] flex items-center gap-2 cursor-pointer animate-in fade-in duration-200"
                >
                  <LuSettings size={14} />
                  Edit Info
                </button>
              )}
            </div>

            {isEditingTop ? (
              <div className="space-y-3">
                <HeaderDetailItem
                  icon={LuMail}
                  value={
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-xs font-bold text-foreground leading-snug truncate">
                        {student?.users?.email || ""}
                      </span>
                      {personalEmail ? (
                        <span className="text-[11px] font-bold text-muted truncate mt-0.5">
                          {personalEmail} (Personal)
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 mt-0.5 italic">
                          No personal email
                        </span>
                      )}
                    </div>
                  }
                />

                {/* Personal Email Editor */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-muted tracking-widest">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="Personal email address"
                    className="w-full px-3 py-2 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <HeaderDetailItem value={student?.users?.phone || "+91 ----- -----"} icon={LuPhone} />

                {/* Address Editor */}
                <div className="bg-surface border border-border-subtle p-5 rounded-2xl space-y-3.5 shadow-sm text-left relative z-25">
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                    <LuMapPin size={14} /> Address Editor
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted tracking-widest">
                      Current Address
                    </label>
                    <textarea
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      placeholder="Street, locality..."
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">State</label>
                      <input
                        type="text"
                        value={stateVal}
                        onChange={(e) => setStateVal(e.target.value)}
                        placeholder="State"
                        className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pin"
                        className="w-full px-2 py-1.5 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted tracking-widest">
                      Permanent Address
                    </label>
                    <textarea
                      value={permAddress}
                      onChange={(e) => setPermAddress(e.target.value)}
                      placeholder="Same as current..."
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <HeaderDetailItem
                  icon={LuMail}
                  value={
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-xs font-bold text-foreground leading-snug truncate">
                        {student?.users?.email || ""}
                      </span>
                      {personalEmail ? (
                        <span className="text-[11px] font-bold text-muted truncate mt-0.5">
                          {personalEmail} (Personal)
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 mt-0.5 italic">
                          No personal email
                        </span>
                      )}
                    </div>
                  }
                />
                <HeaderDetailItem value={student?.users?.phone || "+91 ----- -----"} icon={LuPhone} />
                {physicalAddress ? (
                  <HeaderDetailItem value={physicalAddress} icon={LuMapPin} />
                ) : (
                  <HeaderDetailItem value="Address not set" icon={LuMapPin} />
                )}
                {permanentAddress && (
                  <HeaderDetailItem value={`Perm: ${permanentAddress}`} icon={LuMapPin} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Decor */}
        <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50 pointer-events-none" />
      </div>
    </div>
  );
}

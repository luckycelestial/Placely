"use client";
import { Sk } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuGraduationCap, 
  LuBook, LuCalendar, LuFileText, LuUpload, LuExternalLink,
  LuCircleCheck, LuArrowRight, LuGlobe, LuBriefcase, 
  LuIndianRupee, LuFolderOpen, LuTriangleAlert, LuBadgeCheck,
  LuHash, LuX, LuSettings, LuActivity, LuLayers
} from "react-icons/lu";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { ProfileSection } from "@/components/student/profile-section";
import { db } from "@/services/database";
import Link from "next/link";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { cn } from "@/lib/utils";
import { getSystemSettings, getSettingByKey, DEFAULT_CUSTOM_GROUPS, type CustomGroup } from "@/services/settings";
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

  const [isEditingTop, setIsEditingTop] = useState(false);
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);

  const [isSavingTop, setIsSavingTop] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [prefRolesInput, setPrefRolesInput] = useState("");
  const [prefLocationsInput, setPrefLocationsInput] = useState("");

  const [currentAddress, setCurrentAddress] = useState("");
  const [permAddress, setPermAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");

  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [placementGroup, setPlacementGroup] = useState<string>("");

  useEffect(() => {
    if (student) {
      const pref = student?.student_preferences?.[0] || student?.student_preferences || {};
      setPlacementInterest(pref.placement_interest || "Interested");
      setPlacementGroup(pref.work_mode_preference || "");
      
      const roles = pref.preferred_roles || [];
      setPrefRolesInput(roles.join(", "));
      
      const locations = pref.preferred_locations || [];
      setPrefLocationsInput(locations.join(", "));

      const prof = student?.student_profiles?.[0] || student?.student_profiles || {};
      setSelectedDomains(prof.specializations || []);
    }
  }, [student]);

  // Placement interest is now updated locally during editing, and saved on main save.

  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  useEffect(() => {
    async function loadProfileAndSettings() {
      try {
        const [profileData, settingsData, appsData, customGroupsData] = await Promise.all([
          db.getStudentProfile(DEV_STUDENT_ID),
          getSystemSettings(),
          db.getStudentApplications(DEV_STUDENT_ID),
          getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS)
        ]);
        setStudent(profileData);
        setIsCompleted(settingsData.isAcademicYearCompleted);
        setApplications(appsData);
        setCustomGroups(customGroupsData);

        // Populate links states
        const prof = profileData?.student_profiles?.[0] || profileData?.student_profiles || {};
        setGithubUrl(prof.github_url || "");
        setLinkedinUrl(prof.linkedin_url || "");
        setLeetcodeUrl(prof.notes || "");
        setPortfolioUrl(prof.portfolio_url || "");
        setSelectedDomains(prof.specializations || []);

        // Populate preferences states
        const pref = profileData?.student_preferences?.[0] || profileData?.student_preferences || {};
        setPrefRolesInput(Array.isArray(pref.preferred_roles) ? pref.preferred_roles.join(", ") : "");
        setPrefLocationsInput(Array.isArray(pref.preferred_locations) ? pref.preferred_locations.join(", ") : "");
        setPlacementGroup(pref.work_mode_preference || "");

        // Populate contacts states
        const contactsData = profileData?.student_contacts?.[0] || profileData?.student_contacts || {};
        setCurrentAddress(contactsData.address || "");
        setPermAddress(contactsData.permanent_address || "");
        setCity(contactsData.city || "");
        setStateVal(contactsData.state || "");
        setPincode(contactsData.pincode || "");
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

  const handleSaveTop = async () => {
    setIsSavingTop(true);
    try {
      await db.updateStudentProfile(DEV_STUDENT_ID, {
        address: currentAddress || null,
        permanent_address: permAddress || null,
        city: city || null,
        state: stateVal || null,
        pincode: pincode || null
      });

      setStudent((prev: any) => {
        let updatedContacts = prev.student_contacts;
        if (Array.isArray(prev.student_contacts)) {
          updatedContacts = [{
            ...prev.student_contacts[0],
            address: currentAddress || null,
            permanent_address: permAddress || null,
            city: city || null,
            state: stateVal || null,
            pincode: pincode || null
          }];
        } else {
          updatedContacts = {
            ...prev.student_contacts,
            address: currentAddress || null,
            permanent_address: permAddress || null,
            city: city || null,
            state: stateVal || null,
            pincode: pincode || null
          };
        }
        return {
          ...prev,
          student_contacts: updatedContacts
        };
      });

      setIsEditingTop(false);
      toast.success("Address updated successfully!");
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address: " + (error.message || error));
    } finally {
      setIsSavingTop(false);
    }
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    const rolesArray = prefRolesInput.split(",").map(r => r.trim()).filter(Boolean);
    const locationsArray = prefLocationsInput.split(",").map(l => l.trim()).filter(Boolean);

    try {
      await db.updateStudentProfile(DEV_STUDENT_ID, {
        placement_interest: placementInterest,
        preferred_roles: rolesArray,
        preferred_locations: locationsArray,
        specializations: selectedDomains
      });

      setStudent((prev: any) => {
        let updatedPref = prev.student_preferences;
        if (Array.isArray(prev.student_preferences)) {
          updatedPref = [{
            ...prev.student_preferences[0],
            placement_interest: placementInterest,
            preferred_roles: rolesArray,
            preferred_locations: locationsArray
          }];
        } else {
          updatedPref = {
            ...prev.student_preferences,
            placement_interest: placementInterest,
            preferred_roles: rolesArray,
            preferred_locations: locationsArray
          };
        }

        let updatedProfiles = prev.student_profiles;
        if (Array.isArray(prev.student_profiles)) {
          updatedProfiles = [{
            ...prev.student_profiles[0],
            specializations: selectedDomains
          }];
        } else {
          updatedProfiles = {
            ...prev.student_profiles,
            specializations: selectedDomains
          };
        }

        return {
          ...prev,
          student_preferences: updatedPref,
          student_profiles: updatedProfiles
        };
      });

      setIsEditingPrefs(false);
      toast.success("Preferences updated successfully!");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences: " + (error.message || error));
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleSaveLinks = async () => {
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

      setIsEditingLinks(false);
      toast.success("Links updated successfully!");
    } catch (error: any) {
      console.error("Error saving links:", error);
      toast.error("Failed to save links: " + (error.message || error));
    } finally {
      setIsSavingLinks(false);
    }
  };

  const handleCancelTop = () => {
    const contactsData = student?.student_contacts?.[0] || student?.student_contacts || {};
    setCurrentAddress(contactsData.address || "");
    setPermAddress(contactsData.permanent_address || "");
    setCity(contactsData.city || "");
    setStateVal(contactsData.state || "");
    setPincode(contactsData.pincode || "");
    setIsEditingTop(false);
  };

  const handleCancelPrefs = () => {
    const pref = student?.student_preferences?.[0] || student?.student_preferences || {};
    setPlacementInterest(pref.placement_interest || "Interested");
    setPrefRolesInput(Array.isArray(pref.preferred_roles) ? pref.preferred_roles.join(", ") : "");
    setPrefLocationsInput(Array.isArray(pref.preferred_locations) ? pref.preferred_locations.join(", ") : "");

    const prof = student?.student_profiles?.[0] || student?.student_profiles || {};
    setSelectedDomains(prof.specializations || []);
    setIsEditingPrefs(false);
  };

  const handleCancelLinks = () => {
    const prof = student?.student_profiles?.[0] || student?.student_profiles || {};
    setGithubUrl(prof.github_url || "");
    setLinkedinUrl(prof.linkedin_url || "");
    setLeetcodeUrl(prof.notes || "");
    setPortfolioUrl(prof.portfolio_url || "");
    setIsEditingLinks(false);
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
  const pref = student?.student_preferences?.[0] || student?.student_preferences || {};
  const preferredRoles = pref.preferred_roles || [];
  const preferredLocations = pref.preferred_locations || [];
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
                  <HeaderDetailItem value={student?.users?.email || ""} icon={LuMail} />
                  <HeaderDetailItem value={student?.users?.phone || "+91 ----- -----"} icon={LuPhone} />
                  
                  {/* Address Editor */}
                  <div className="bg-surface border border-border-subtle p-5 rounded-2xl space-y-3.5 shadow-sm text-left relative z-25">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                      <LuMapPin size={14} /> Address Editor
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Current Address</label>
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
                      <label className="text-[9px] font-black uppercase text-muted tracking-widest">Permanent Address</label>
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
                  <HeaderDetailItem value={student?.users?.email || ""} icon={LuMail} />
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
          <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-50" />
        </div>
      </div>

      {/* ── Academic Performance ── */}
      <ProfileSection title="Academic Performance" description="Score Breakdown">
        <div className="mt-6 space-y-8">
          {/* Overall Scores */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Overall Scores</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <ScoreCard label="10th Grade" value={academics?.tenth_score} unit="%" />
              <ScoreCard label="12th Grade" value={academics?.twelfth_score} unit="%" />
              <ScoreCard label="Diploma" value={academics?.diploma_score} unit="%" optional />
              <ScoreCard label="CGPA" value={Number(aggregateCgpa)} unit="" />
            </div>
          </div>

          {/* Semester CGPA */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Semester-wise CGPA</p>
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


      <ProfileSection 
        title="Placement Preferences" 
        description="Career Strategy"
        actions={
          isEditingPrefs ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelPrefs}
                disabled={isSavingPrefs}
                className="bg-surface hover:bg-background border border-border-subtle text-muted hover:text-foreground rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrefs}
                disabled={isSavingPrefs}
                className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingPrefs ? (
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
              onClick={() => setIsEditingPrefs(true)}
              className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] flex items-center gap-2 cursor-pointer"
            >
              <LuSettings size={12} />
              Edit
            </button>
          )
        }
      >
        {!isEditingPrefs ? (
          <div className="space-y-8 mt-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {preferredRoles.length > 0 ? (
                <DetailItem value={preferredRoles.join(" / ")} icon={LuBriefcase} />
              ) : (
                <div className="flex items-center gap-4 bg-background/50 rounded-3xl p-5 border border-dashed border-border-subtle">
                  <div className="h-10 w-10 rounded-xl bg-muted/15 flex items-center justify-center text-muted flex-shrink-0">
                    <LuBriefcase size={20} />
                  </div>
                  <p className="text-sm text-muted font-bold">No preferred roles selected</p>
                </div>
              )}
              <DetailItem value={`Interest: ${placementInterest}`} icon={LuActivity} />
              <DetailItem value="12 - 18 LPA" icon={LuIndianRupee} />
              {preferredLocations.length > 0 ? (
                <DetailItem value={preferredLocations.join(", ")} icon={LuMapPin} />
              ) : (
                <div className="flex items-center gap-4 bg-background/50 rounded-3xl p-5 border border-dashed border-border-subtle">
                  <div className="h-10 w-10 rounded-xl bg-muted/15 flex items-center justify-center text-muted flex-shrink-0">
                    <LuMapPin size={20} />
                  </div>
                  <p className="text-sm text-muted font-bold">No preferred locations selected</p>
                </div>
              )}

              {/* Dynamic Groups/Domains in identical boxes */}
              {customGroups.map((group) => {
                if (group.type === "student_selectable") {
                  const selectedInGroup = group.options.filter(opt => selectedDomains.includes(opt));
                  const displayValue = selectedInGroup.length > 0 
                    ? selectedInGroup.join(" / ") 
                    : "None selected";
                  return (
                    <DetailItem 
                      key={group.id}
                      value={`${group.name}: ${displayValue}`} 
                      icon={LuLayers} 
                    />
                  );
                } else {
                  let assignedOpt = "";
                  if (placementGroup) {
                    if (placementGroup.trim().startsWith('{')) {
                      try {
                        const parsed = JSON.parse(placementGroup);
                        assignedOpt = parsed[group.id] || "";
                      } catch (e) {}
                    } else if (group.id === "placement_groups") {
                      assignedOpt = placementGroup;
                    }
                  }
                  const displayValue = assignedOpt || "Unassigned";
                  return (
                    <DetailItem 
                      key={group.id}
                      value={`${group.name}: ${displayValue}`} 
                      icon={LuBadgeCheck} 
                    />
                  );
                }
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8 mt-4 animate-in fade-in duration-300">
            <div className="grid gap-6 md:grid-cols-3 bg-background/50 border border-border-subtle p-6 rounded-3xl">
              {/* Preferred Roles Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                  <LuBriefcase size={12} /> Preferred Job Roles
                </label>
                <input 
                  type="text"
                  value={prefRolesInput}
                  onChange={(e) => setPrefRolesInput(e.target.value)}
                  placeholder="e.g. SDE, Full Stack, Frontend Developer"
                  className="w-full bg-background border border-border-subtle rounded-2xl py-4 px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <p className="text-[10px] text-muted-foreground/60 font-medium">Use commas to separate multiple roles.</p>
              </div>

              {/* Placement Interest Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                  <LuActivity size={12} /> Placement Interest
                </label>
                <div className="relative">
                  <select
                    value={placementInterest}
                    onChange={(e) => setPlacementInterest(e.target.value)}
                    className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-4 pr-10 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
                  >
                    <option value="Interested">Interested</option>
                    <option value="Not Interested: Higher Studies">Not Interested: Higher Studies</option>
                    <option value="Not Interested: Entrepreneurship">Not Interested: Entrepreneurship</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <LuArrowRight size={16} className="rotate-90" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-medium">Participation in campus placement drives.</p>
              </div>

              {/* Preferred Locations Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                  <LuMapPin size={12} /> Preferred Locations
                </label>
                <input 
                  type="text"
                  value={prefLocationsInput}
                  onChange={(e) => setPrefLocationsInput(e.target.value)}
                  placeholder="e.g. Bangalore, Mumbai, Remote"
                  className="w-full bg-background border border-border-subtle rounded-2xl py-4 px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <p className="text-[10px] text-muted-foreground/60 font-medium">Use commas to separate multiple locations.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 bg-background/50 border border-border-subtle p-6 rounded-3xl">
              {customGroups.map((group) => {
                if (group.type === "student_selectable") {
                  return (
                    <div key={group.id} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                        <LuLayers size={12} /> {group.name}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((option) => {
                          const isSelected = selectedDomains.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedDomains(selectedDomains.filter(o => o !== option));
                                } else {
                                  setSelectedDomains([...selectedDomains, option]);
                                }
                              }}
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                                isSelected
                                  ? "bg-primary text-white border-primary shadow-tactile"
                                  : "bg-surface text-muted border-border-subtle hover:border-primary/30"
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 font-medium">Toggle options to choose your specializations.</p>
                    </div>
                  );
                } else {
                  let currentAssigned = "";
                  if (placementGroup) {
                    if (placementGroup.trim().startsWith('{')) {
                      try {
                        const parsed = JSON.parse(placementGroup);
                        currentAssigned = parsed[group.id] || "";
                      } catch (e) {}
                    } else if (group.id === "placement_groups") {
                      currentAssigned = placementGroup;
                    }
                  }
                  return (
                    <div key={group.id} className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                        <LuUser size={12} /> {group.name}
                      </label>
                      <div className="relative">
                        <select
                          disabled
                          value={currentAssigned}
                          className="w-full bg-slate-100/50 border border-border-subtle rounded-2xl py-4 pl-4 pr-10 text-sm font-semibold text-muted focus:outline-none appearance-none cursor-not-allowed"
                        >
                          <option value="">Unassigned</option>
                          {group.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/30">
                          <LuArrowRight size={16} className="rotate-90" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 font-medium italic">Managed by administrator.</p>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}
      </ProfileSection>

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
            {profile?.github_url && !profile.github_url.includes('—') && profile.github_url.length > 5 && (
              <LinkCard title="GitHub" url={profile.github_url} icon={SiGithub} color="#181717" />
            )}
            {profile?.linkedin_url && !profile.linkedin_url.includes('—') && profile.linkedin_url.length > 5 && (
              <LinkCard title="LinkedIn" url={profile.linkedin_url} icon={FaLinkedin} color="#0A66C2" />
            )}
            {profile?.notes && !profile.notes.includes('—') && profile.notes.length > 5 && (
              <LinkCard title="LeetCode" url={profile.notes} icon={SiLeetcode} color="#FFA116" />
            )}
            {profile?.portfolio_url && !profile.portfolio_url.includes('—') && profile.portfolio_url.length > 5 && (
              <LinkCard title="Portfolio" url={profile.portfolio_url} icon={LuGlobe} color="#ff383c" />
            )}
            {(!profile?.github_url || profile.github_url.includes('—') || profile.github_url.length <= 5) &&
             (!profile?.linkedin_url || profile.linkedin_url.includes('—') || profile.linkedin_url.length <= 5) &&
             (!profile?.notes || profile.notes.includes('—') || profile.notes.length <= 5) &&
             (!profile?.portfolio_url || profile.portfolio_url.includes('—') || profile.portfolio_url.length <= 5) && (
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
                <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">github.com/</span>
                <input 
                  type="text"
                  value={githubUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGithubUrl(val ? `github.com/${val.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}` : "");
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
                <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">linkedin.com/in/</span>
                <input 
                  type="text"
                  value={linkedinUrl.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLinkedinUrl(val ? `linkedin.com/in/${val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : "");
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
                <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">leetcode.com/</span>
                <input 
                  type="text"
                  value={leetcodeUrl.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLeetcodeUrl(val ? `leetcode.com/${val.replace(/^(https?:\/\/)?(www\.)?leetcode\.com\//, '')}` : "");
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
                <span className="absolute left-4 text-xs font-semibold text-muted/50 select-none">https://</span>
                <input 
                  type="text"
                  value={portfolioUrl.replace(/^(https?:\/\/)?(www\.)?/, '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPortfolioUrl(val ? `https://${val.replace(/^(https?:\/\/)?(www\.)?/, '')}` : "");
                  }}
                  placeholder="yourwebsite.com"
                  className="w-full bg-background border border-border-subtle rounded-2xl py-3 pl-[64px] pr-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </ProfileSection>


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
        <p className="text-lg font-display font-bold tracking-tight text-foreground break-words whitespace-normal">{value}</p>
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

"use client";

import { Sk } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { db } from "@/services/database";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { getSystemSettings, getSettingByKey, DEFAULT_CUSTOM_GROUPS, type CustomGroup } from "@/services/settings";
import { toast } from "sonner";
import { ProfileHeaderCard } from "./components/ProfileHeaderCard";
import { AcademicScoresCard } from "./components/AcademicScoresCard";
import { CareerPreferencesCard } from "./components/CareerPreferencesCard";
import { ProfessionalLinksCard } from "./components/ProfessionalLinksCard";

export default function ProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [placementInterest, setPlacementInterest] = useState<string>("Interested");

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
  const [personalEmail, setPersonalEmail] = useState("");

  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [placementGroup, setPlacementGroup] = useState<string>("");

  useEffect(() => {
    if (student) {
      const prof = student?.student_profiles?.[0] || student?.student_profiles || {};
      const pref = prof;
      setPlacementInterest(pref.placement_interest || "Interested");
      setPlacementGroup(pref.work_mode_preference || "");

      const roles = pref.preferred_roles || [];
      setPrefRolesInput(Array.isArray(roles) ? roles.join(", ") : "");

      const locations = pref.preferred_locations || [];
      setPrefLocationsInput(Array.isArray(locations) ? locations.join(", ") : "");

      setSelectedDomains(prof.specializations || []);
    }
  }, [student]);

  useEffect(() => {
    async function loadProfileAndSettings() {
      try {
        const [profileData, settingsData, customGroupsData] = await Promise.all([
          db.getStudentProfile(DEV_STUDENT_ID),
          getSystemSettings(),
          getSettingByKey<CustomGroup[]>("custom_groups", DEFAULT_CUSTOM_GROUPS),
        ]);
        setStudent(profileData);
        setIsCompleted(settingsData.isAcademicYearCompleted);
        setCustomGroups(customGroupsData);

        // Populate links states
        const prof = profileData?.student_profiles?.[0] || profileData?.student_profiles || {};
        setGithubUrl(prof.github_url || "");
        setLinkedinUrl(prof.linkedin_url || "");
        setLeetcodeUrl(prof.notes || "");
        setPortfolioUrl(prof.portfolio_url || "");
        setSelectedDomains(prof.specializations || []);

        // Populate preferences states
        const pref = prof;
        setPrefRolesInput(Array.isArray(pref.preferred_roles) ? pref.preferred_roles.join(", ") : "");
        setPrefLocationsInput(Array.isArray(pref.preferred_locations) ? pref.preferred_locations.join(", ") : "");
        setPlacementGroup(pref.work_mode_preference || "");

        // Populate contacts states
        setCurrentAddress(profileData?.address || "");
        setPermAddress(profileData?.permanent_address || "");
        setCity(profileData?.city || "");
        setStateVal(profileData?.state || "");
        setPincode(profileData?.pincode || "");
        setPersonalEmail(profileData?.personal_email || "");
      } catch (error) {
        console.error("Error loading profile, settings or applications:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfileAndSettings();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 2MB.");
      return;
    }

    try {
      const userId = student.user_id || student.users?.id;
      if (!userId) throw new Error("User ID not found in profile data");
      const url = await db.uploadAvatar(userId, file);
      setStudent((prev: any) => ({ ...prev, users: { ...prev.users, avatar_url: url } }));
      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update profile picture: ${error.message || "Unknown error"}`);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveTop = async () => {
    setIsSavingTop(true);
    try {
      await db.updateStudentProfile(DEV_STUDENT_ID, {
        address: currentAddress || null,
        permanent_address: permAddress || null,
        city: city || null,
        state: stateVal || null,
        pincode: pincode || null,
        personal_email: personalEmail || null,
      });

      setStudent((prev: any) => ({
        ...prev,
        address: currentAddress || null,
        permanent_address: permAddress || null,
        city: city || null,
        state: stateVal || null,
        pincode: pincode || null,
        personal_email: personalEmail || null,
      }));

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
    const rolesArray = prefRolesInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const locationsArray = prefLocationsInput
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      await db.updateStudentProfile(DEV_STUDENT_ID, {
        placement_interest: placementInterest,
        preferred_roles: rolesArray,
        preferred_locations: locationsArray,
        specializations: selectedDomains,
      });

      setStudent((prev: any) => {
        let updatedProfiles = prev.student_profiles;
        if (Array.isArray(prev.student_profiles)) {
          updatedProfiles = [
            {
              ...prev.student_profiles[0],
              placement_interest: placementInterest,
              preferred_roles: rolesArray,
              preferred_locations: locationsArray,
              specializations: selectedDomains,
            },
          ];
        } else {
          updatedProfiles = {
            ...prev.student_profiles,
            placement_interest: placementInterest,
            preferred_roles: rolesArray,
            preferred_locations: locationsArray,
            specializations: selectedDomains,
          };
        }

        return {
          ...prev,
          student_profiles: updatedProfiles,
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
        notes: leetcodeUrl || null,
      });

      setStudent((prev: any) => {
        let updatedProfiles = prev.student_profiles;
        if (Array.isArray(prev.student_profiles)) {
          updatedProfiles = [
            {
              ...prev.student_profiles[0],
              github_url: githubUrl || null,
              linkedin_url: linkedinUrl || null,
              portfolio_url: portfolioUrl || null,
              notes: leetcodeUrl || null,
            },
          ];
        } else {
          updatedProfiles = {
            ...prev.student_profiles,
            github_url: githubUrl || null,
            linkedin_url: linkedinUrl || null,
            portfolio_url: portfolioUrl || null,
            notes: leetcodeUrl || null,
          };
        }

        return {
          ...prev,
          student_profiles: updatedProfiles,
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
    setCurrentAddress(student?.address || "");
    setPermAddress(student?.permanent_address || "");
    setCity(student?.city || "");
    setStateVal(student?.state || "");
    setPincode(student?.pincode || "");
    setPersonalEmail(student?.personal_email || "");
    setIsEditingTop(false);
  };

  const handleCancelPrefs = () => {
    const prof = student?.student_profiles?.[0] || student?.student_profiles || {};
    const pref = prof;
    setPlacementInterest(pref.placement_interest || "Interested");
    setPrefRolesInput(Array.isArray(pref.preferred_roles) ? pref.preferred_roles.join(", ") : "");
    setPrefLocationsInput(Array.isArray(pref.preferred_locations) ? pref.preferred_locations.join(", ") : "");
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

  const profile = student?.student_profiles?.[0] || student?.student_profiles || {};
  const preferredRoles = profile.preferred_roles || [];
  const preferredLocations = profile.preferred_locations || [];

  return (
    <div className="space-y-12 max-w-7xl pt-2 pb-10 px-4 mx-auto">
      {/* ── Master Profile Card ── */}
      <ProfileHeaderCard
        student={student}
        isCompleted={isCompleted}
        fileInputRef={fileInputRef}
        handlePhotoUpload={handlePhotoUpload}
        isEditingTop={isEditingTop}
        setIsEditingTop={setIsEditingTop}
        isSavingTop={isSavingTop}
        handleSaveTop={handleSaveTop}
        handleCancelTop={handleCancelTop}
        currentAddress={currentAddress}
        setCurrentAddress={setCurrentAddress}
        permAddress={permAddress}
        setPermAddress={setPermAddress}
        city={city}
        setCity={setCity}
        stateVal={stateVal}
        setStateVal={setStateVal}
        pincode={pincode}
        setPincode={setPincode}
        personalEmail={personalEmail}
        setPersonalEmail={setPersonalEmail}
      />

      {/* ── Academic Performance ── */}
      <AcademicScoresCard academics={student} />

      {/* ── Placement Preferences ── */}
      <CareerPreferencesCard
        student={student}
        preferredRoles={preferredRoles}
        preferredLocations={preferredLocations}
        placementInterest={placementInterest}
        setPlacementInterest={setPlacementInterest}
        prefRolesInput={prefRolesInput}
        setPrefRolesInput={setPrefRolesInput}
        prefLocationsInput={prefLocationsInput}
        setPrefLocationsInput={setPrefLocationsInput}
        customGroups={customGroups}
        selectedDomains={selectedDomains}
        setSelectedDomains={setSelectedDomains}
        placementGroup={placementGroup}
        isEditingPrefs={isEditingPrefs}
        setIsEditingPrefs={setIsEditingPrefs}
        isSavingPrefs={isSavingPrefs}
        handleSavePrefs={handleSavePrefs}
        handleCancelPrefs={handleCancelPrefs}
      />

      {/* ── Professional Links ── */}
      <ProfessionalLinksCard
        profile={profile}
        isEditingLinks={isEditingLinks}
        setIsEditingLinks={setIsEditingLinks}
        isSavingLinks={isSavingLinks}
        handleSaveLinks={handleSaveLinks}
        handleCancelLinks={handleCancelLinks}
        githubUrl={githubUrl}
        setGithubUrl={setGithubUrl}
        linkedinUrl={linkedinUrl}
        setLinkedinUrl={setLinkedinUrl}
        leetcodeUrl={leetcodeUrl}
        setLeetcodeUrl={setLeetcodeUrl}
        portfolioUrl={portfolioUrl}
        setPortfolioUrl={setPortfolioUrl}
      />
    </div>
  );
}

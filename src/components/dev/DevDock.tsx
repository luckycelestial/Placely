"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setLoggedStudentId } from "@/lib/dev-config";
import { LuZap, LuUser, LuShield, LuGraduationCap, LuX, LuChevronUp, LuChevronDown, LuCheck } from "react-icons/lu";

interface DevProfile {
  label: string;
  role: "admin" | "student";
  studentId?: string;
  name: string;
  dept?: string;
  statusBadge?: string;
  email?: string;
}

const PRESET_PROFILES: DevProfile[] = [
  {
    label: "Admin / Staff",
    role: "admin",
    name: "Placement Director",
    email: "admin@placely.edu",
    statusBadge: "Admin Portal",
  },
  {
    label: "Placed Student",
    role: "student",
    studentId: "00235f07-2e4f-420a-ba38-f28d06d81d8f",
    name: "Rajesh Shetty",
    dept: "ECE • 2027 Batch",
    statusBadge: "Placed",
  },
  {
    label: "Unplaced Student",
    role: "student",
    studentId: "05e31a1f-842d-45c5-a110-516bb5b5db1b",
    name: "Gautam Mukherjee",
    dept: "AI&DS • 2026 Batch",
    statusBadge: "Unplaced",
  },
  {
    label: "Student w/ Arrears",
    role: "student",
    studentId: "0df5fea0-a782-48b9-ac93-4d9dd32ebdd5",
    name: "Lakshmi Joshi",
    dept: "IT • 2026 Batch (3 Arrears)",
    statusBadge: "Placed",
  },
];

export function DevDock() {
  const router = useRouter();
  const pathname = usePathname();
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "local" || process.env.NODE_ENV !== "production";

  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeRole, setActiveRole] = useState<"admin" | "student" | "guest">(() => {
    if (typeof window !== "undefined") {
      const studentId = localStorage.getItem("active_student_id");
      const adminEmail = localStorage.getItem("active_admin_email");
      if (studentId) return "student";
      if (adminEmail) return "admin";
    }
    return "guest";
  });
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("active_student_id") || "";
    }
    return "";
  });

  const currentRole = pathname.startsWith("/admin") ? "admin" : activeRole;

  useEffect(() => {
    if (typeof window === "undefined" || !isDev) return;
    
    // Support optional env flag or keyboard shortcut Ctrl+Shift+D in development
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Never render in production
  if (!isDev || (!isVisible && process.env.NEXT_PUBLIC_SHOW_DEV_DOCK !== "true")) {
    return null;
  }

  const handleSwitchProfile = (profile: DevProfile) => {
    if (profile.role === "admin") {
      localStorage.setItem("active_admin_email", profile.email || "admin@placely.edu");
      localStorage.removeItem("active_student_id");
      setActiveRole("admin");
      router.push("/admin/dashboard");
    } else if (profile.role === "student" && profile.studentId) {
      localStorage.removeItem("active_admin_email");
      setLoggedStudentId(profile.studentId);
      setActiveRole("student");
      setActiveStudentId(profile.studentId);
      router.push("/dashboard");
    }
    setIsOpen(false);
  };

  const handleClearSession = () => {
    localStorage.removeItem("active_admin_email");
    localStorage.removeItem("active_student_id");
    setActiveRole("guest");
    setActiveStudentId("");
    router.push("/");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-lg text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer group"
          title="Quick Dev Role Switcher"
        >
          <LuZap className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Dev Dock</span>
          <span className="bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
            {currentRole}
          </span>
          <LuChevronUp className="h-3.5 w-3.5 text-amber-400 opacity-70" />
        </button>
      ) : (
        <div className="w-80 bg-[#121318] border border-amber-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <LuZap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Dev Environment Quick Login
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {PRESET_PROFILES.map((profile, i) => {
              const isSelected =
                (profile.role === "admin" && activeRole === "admin") ||
                (profile.role === "student" && profile.studentId === activeStudentId);

              return (
                <button
                  key={i}
                  onClick={() => handleSwitchProfile(profile)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        profile.role === "admin"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {profile.role === "admin" ? (
                        <LuShield className="h-3.5 w-3.5" />
                      ) : (
                        <LuGraduationCap className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{profile.name}</span>
                        {profile.statusBadge && (
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-white/10 rounded text-white/60">
                            {profile.statusBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {profile.dept || profile.email}
                      </div>
                    </div>
                  </div>
                  {isSelected && <LuCheck className="h-4 w-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-white/40 font-mono">Local Dev Mode</span>
            <button
              onClick={handleClearSession}
              className="text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer"
            >
              Clear Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

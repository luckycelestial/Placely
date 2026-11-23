"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setLoggedStudentId } from "@/lib/dev-config";
import { LuZap, LuShield, LuGraduationCap, LuArrowRight } from "react-icons/lu";

interface DevRoleOption {
  title: string;
  subtitle: string;
  role: "admin" | "student";
  studentId?: string;
  email?: string;
  badge: string;
  badgeColor: string;
}

const DEV_OPTIONS: DevRoleOption[] = [
  {
    title: "Placement Director / Super Admin",
    subtitle: "Full access to admin dashboard, drives management, notices, ATS, reports, & settings",
    role: "admin",
    email: "admin@placely.edu",
    badge: "Admin Access",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    title: "Rajesh Shetty (Placed Student)",
    subtitle: "ECE • 2027 Graduation Batch • Placed with CTC Offer",
    role: "student",
    studentId: "00235f07-2e4f-420a-ba38-f28d06d81d8f",
    badge: "Placed Student",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    title: "Gautam Mukherjee (Unplaced Student)",
    subtitle: "AI&DS • 2026 Graduation Batch • Active Drive Applications",
    role: "student",
    studentId: "05e31a1f-842d-45c5-a110-516bb5b5db1b",
    badge: "Unplaced Student",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  {
    title: "Lakshmi Joshi (Student w/ Arrears)",
    subtitle: "IT • 2026 Graduation Batch • 3 Active Arrears",
    role: "student",
    studentId: "0df5fea0-a782-48b9-ac93-4d9dd32ebdd5",
    badge: "Arrears Profile",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
];

export default function DevLoginPage() {
  const router = useRouter();
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "local" || process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!isDev) {
      router.replace("/");
    }
  }, [isDev, router]);

  if (!isDev) {
    return null;
  }

  const handleSelect = (option: DevRoleOption) => {
    if (option.role === "admin") {
      localStorage.setItem("active_admin_email", option.email || "admin@placely.edu");
      localStorage.removeItem("active_student_id");
      router.push("/admin/dashboard");
    } else if (option.role === "student" && option.studentId) {
      localStorage.removeItem("active_admin_email");
      setLoggedStudentId(option.studentId);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-foreground relative overflow-hidden font-sans">
      {/* Background Visual Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] left-[25%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <LuZap className="h-3.5 w-3.5" />
            <span>Local Development Environment</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quick Role Login</h1>
          <p className="text-xs text-white/50 font-medium">
            Select a pre-configured user persona to bypass Google OAuth during local testing.
          </p>
        </div>

        <div className="space-y-3">
          {DEV_OPTIONS.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-white/10 transition-all cursor-pointer group flex items-center justify-between gap-4 backdrop-blur-md"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 mt-0.5 border ${
                    option.role === "admin"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }`}
                >
                  {option.role === "admin" ? (
                    <LuShield className="h-5 w-5" />
                  ) : (
                    <LuGraduationCap className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {option.title}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${option.badgeColor}`}>
                      {option.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 font-medium mt-1 leading-relaxed">
                    {option.subtitle}
                  </p>
                </div>
              </div>

              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-amber-300 group-hover:border-amber-500/30 transition-all shrink-0">
                <LuArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs font-semibold text-white/40 hover:text-white/80 transition-colors inline-flex items-center gap-1.5"
          >
            ← Standard Google Login Page
          </Link>
        </div>
      </div>
    </div>
  );
}

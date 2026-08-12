"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LuUser, 
  LuShieldCheck, 
  LuCircleHelp, 
  LuSparkles,
  LuMoveRight,
  LuArrowRight
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db, clearStudentsCache } from "@/services/database";
import { setLoggedStudentId } from "@/lib/dev-config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function TenantEntryPage() {
  const showDemo = 
    process.env.NEXT_PUBLIC_APP_ENV === "local" ||
    process.env.NEXT_PUBLIC_APP_ENV === "dev" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
    process.env.NODE_ENV === "development";

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (showDemo) {
      async function loadProfiles() {
        try {
          clearStudentsCache();
          const { data } = await db.getStudents({ pageSize: 30 });
          setStudents(data || []);
        } catch (err: any) {
          console.error("Failed to load student profiles:", err);
        } finally {
          setLoadingStudents(false);
        }
      }
      loadProfiles();
    }
  }, [showDemo]);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback"
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize Google Sign-in.");
      setIsLoggingIn(false);
    }
  };

  const handleStudentProfileSignIn = (studentId: string) => {
    setIsLoggingIn(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_admin_email");
    }
    setLoggedStudentId(studentId);
    toast.success("Student session activated! Opening portal...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  const handleAdminSignIn = () => {
    setIsLoggingIn(true);
    setLoggedStudentId("");
    if (typeof window !== "undefined") {
      localStorage.setItem("active_admin_email", "admin@placement.edu");
    }
    toast.success("Admin session activated! Accessing dashboard...");
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans selection:bg-primary/20 text-foreground overflow-x-hidden max-w-full">
      
      {/* Left Section: Large Brand Hero */}
      <div className="relative w-full lg:w-[55%] bg-[#0A0A0B] flex flex-col justify-center p-8 lg:p-24 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
        {/* Background Visuals */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 space-y-12 max-w-2xl">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-left-6 duration-1000 delay-100">
              The Future of <br />
              <span className="text-primary">Campus Hiring.</span>
            </h1>
            <p className="text-white/50 text-lg lg:text-xl font-medium max-w-lg leading-relaxed animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
              Experience a unified placement ecosystem designed for the next generation of talent and recruiters.
            </p>
          </div>

          <div className="flex items-center gap-8 animate-in fade-in slide-in-from-left-10 duration-1000 delay-300">
            <div className="space-y-1">
              <p className="text-white text-2xl font-black">10k+</p>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Active Students</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="space-y-1">
              <p className="text-white text-2xl font-black">500+</p>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Global Partners</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="space-y-1">
              <p className="text-white text-2xl font-black">95%</p>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Placement Rate</p>
            </div>
          </div>
        </div>

        {/* Floating Accent */}
        <div className="absolute bottom-12 left-12 lg:left-24 flex items-center gap-4 text-white/20 animate-in fade-in duration-1000 delay-1000">
           <LuSparkles size={20} />
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Precision Orchestrated</span>
        </div>
      </div>

      {/* Right Section: Login Area */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-8 lg:p-20 bg-background relative border-l border-border-subtle">
        <div className="max-w-[420px] mx-auto w-full space-y-8">

          {/* Logo & Title Header */}
          <div className="space-y-6 flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <img src="/careerbridge.png" alt="CareerBridge Logo" className="h-20 w-20 object-contain drop-shadow-md" />
              <span className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground leading-none">CareerBridge</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold tracking-tight text-muted">Sign in to your account</h2>
            </div>
          </div>

          <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex bg-surface p-1.5 rounded-[20px] border border-border-subtle gap-1 shadow-inner">
              <button
                onClick={() => setActiveTab("student")}
                className={cn(
                  "flex-1 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2",
                  activeTab === "student"
                    ? "bg-background text-primary shadow-sm border border-border-subtle/30"
                    : "text-muted hover:text-foreground"
                )}
              >
                <LuUser size={14} />
                Student Portal
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={cn(
                  "flex-1 py-3 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2",
                  activeTab === "admin"
                    ? "bg-background text-primary shadow-sm border border-border-subtle/30"
                    : "text-muted hover:text-foreground"
                )}
              >
                <LuShieldCheck size={14} />
                Admin Portal
              </button>
            </div>

            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full h-14 flex items-center justify-center gap-4 rounded-[20px] bg-white text-slate-800 border border-slate-200 hover:border-slate-300 text-sm font-black uppercase tracking-widest transition-all transform active:scale-[0.98] hover:shadow-md cursor-pointer disabled:opacity-75"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Dev Mode Instant Login Buttons (Controlled via ENV) */}
            {showDemo && (
              <div className="space-y-4 pt-4 border-t border-border-subtle/50">
                {activeTab === "student" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                        <LuUser size={14} className="text-primary" />
                        Dev Quick Login (All Students)
                      </h3>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">DEV ENV</span>
                    </div>

                    {loadingStudents ? (
                      <div className="space-y-2">
                        <div className="h-12 rounded-2xl bg-surface animate-pulse" />
                        <div className="h-12 rounded-2xl bg-surface animate-pulse" />
                      </div>
                    ) : students.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1.5 no-scrollbar">
                        {students.map((student) => {
                          const avatar = (student.name || "U").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                          return (
                            <button
                              key={student.id}
                              onClick={() => handleStudentProfileSignIn(student.id)}
                              disabled={isLoggingIn}
                              className="w-full p-3 rounded-2xl border border-border-subtle bg-surface/50 text-left hover:border-primary/40 hover:bg-surface transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none cursor-pointer shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                                  {avatar}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-foreground leading-none mb-1 group-hover:text-primary transition-colors truncate">{student.name}</p>
                                  <p className="text-[10px] font-black text-muted uppercase tracking-tighter flex items-center gap-1.5">
                                    {student.regNo || student.registerNumber}
                                    <span className="h-1 w-1 rounded-full bg-muted/40" />
                                    <span className="text-primary">{student.dept || student.department}</span>
                                  </p>
                                </div>
                              </div>
                              <LuMoveRight size={16} className="text-muted/40 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] font-semibold text-muted text-center py-4">No student profiles in database. Run seed script to load demo students.</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                        <LuShieldCheck size={14} className="text-primary" />
                        Dev Quick Login (Admin)
                      </h3>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">DEV ENV</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={handleAdminSignIn}
                        disabled={isLoggingIn}
                        className="w-full p-4 rounded-2xl border border-border-subtle bg-surface/50 text-left hover:border-primary/40 hover:bg-surface transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                            AD
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground leading-none mb-1 group-hover:text-primary transition-colors truncate">System Administrator</p>
                            <p className="text-[9px] font-black text-muted uppercase tracking-tighter flex items-center gap-1">
                              Placement Officer
                              <span className="h-1 w-1 rounded-full bg-muted/40" />
                              <span className="text-primary">TPO Admin</span>
                            </p>
                          </div>
                        </div>
                        <LuArrowRight size={16} className="text-muted/40 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">Enterprise SSO</button>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">
              <LuCircleHelp size={14} />
              Help Center
            </button>
          </div>

        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center opacity-40">
           <p className="text-[9px] font-black uppercase tracking-[0.2em]">Powered by CareerBridge Unified Infrastructure</p>
        </div>
      </div>
    </div>
  );
}

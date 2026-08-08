"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LuShieldCheck, 
  LuLock, 
  LuUser, 
  LuEye, 
  LuEyeOff, 
  LuArrowRight,
  LuSparkles,
  LuBuilding2,
  LuGraduationCap
} from "react-icons/lu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { setLoggedStudentId } from "@/lib/dev-config";
import { db } from "@/services/database";

export default function TenantEntryPage() {
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfiles() {
      try {
        const { data } = await db.getStudents({ pageSize: 15 });
        setStudents(data || []);
      } catch (err: any) {
        console.error("Failed to load student profiles:", err);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadProfiles();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    const cleanUserId = userId.trim().toLowerCase();
    const cleanPassword = password.trim();

    const authEmail = cleanUserId.includes('@') && !cleanUserId.includes('.') 
      ? `${cleanUserId}.com` 
      : cleanUserId;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPassword,
      });

      if (authError || !authData.session) {
        setIsLoggingIn(false);
        toast.error("Invalid credentials! Please check User ID and Password.");
        return;
      }

      setLoggedStudentId("");
      toast.success("Login Successful! Accessing Admin Portal...");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 600);
    } catch (err: any) {
      console.error("Login error:", err);
      setIsLoggingIn(false);
      toast.error("Authentication error. Please try again.");
    }
  };

  const handleStudentProfileSignIn = (studentId: string) => {
    setIsLoggingIn(true);
    setLoggedStudentId(studentId);
    toast.success("Student session activated! Opening portal...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

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

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans selection:bg-primary/20 overflow-x-hidden max-w-full">
      
      {/* Left Section: Dark Hero Visual */}
      <div className="relative w-full lg:w-[55%] bg-[#08090D] text-white flex flex-col justify-center p-8 lg:p-20 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        </div>

        <div className="relative z-10 space-y-10 max-w-xl mx-auto lg:mx-0">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Department <br />
              <span className="text-primary">Placement Cell.</span>
            </h1>
            <p className="text-white/50 text-base sm:text-lg font-medium leading-relaxed max-w-md">
              Unified placement portal for AI&amp;DS students, recruiters, and placement officers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-black text-white">163</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-0.5">Students</p>
            </div>
            <div>
              <p className="text-2xl font-black text-primary">3</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-0.5">Sections (A, B, C)</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400">2027</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-0.5">Batch Year</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">100%</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-0.5">Realtime Sync</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Dual Login Tabs */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-8 sm:p-14 lg:p-20 bg-[#F8F9FA] relative">
        <div className="max-w-[400px] mx-auto w-full space-y-8">
          
          {/* Tab Switcher */}
          <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("student")}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "student"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LuGraduationCap size={16} />
              <span>Student Login</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LuShieldCheck size={16} />
              <span>Staff / Admin</span>
            </button>
          </div>

          {activeTab === "student" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Portal</h2>
                <p className="text-xs text-slate-500 font-medium">Access your drives, resume builder, and placement applications.</p>
              </div>

              {/* Google OAuth Login Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="w-full h-13 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-[#F8F9FA] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">or select student</span>
              </div>

              {/* Student Quick Profile Selector */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {loadingStudents ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-4">Loading student profiles...</p>
                ) : (
                  students.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => handleStudentProfileSignIn(s.id)}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 hover:border-primary/50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">{s.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{s.registerNumber} • {s.department}</p>
                      </div>
                      <LuArrowRight size={14} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Staff / Admin Form */
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff Login</h2>
                <p className="text-xs text-slate-500 font-medium">Enter credentials to access administrative dashboard.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">User ID / Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <LuUser size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="admin@aids"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <LuLock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 mt-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <LuArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LuShieldCheck, 
  LuLock, 
  LuUser, 
  LuEye, 
  LuEyeOff, 
  LuArrowRight,
  LuSparkles
} from "react-icons/lu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { setLoggedStudentId } from "@/lib/dev-config";

/* ==============================================================================
   COMMENTED OUT: PREVIOUS DEMO & OAUTH LOGIN SCREEN
   ==============================================================================
export default function LegacyTenantEntryPage() {
  // const showDemo = ...
  // Google sign in / Profile selector logic commented out per request
}
============================================================================== */

export default function TenantEntryPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    const cleanUserId = userId.trim().toLowerCase();
    const cleanPassword = password.trim();

    const authEmail = cleanUserId.includes('@') && !cleanUserId.includes('.') 
      ? `${cleanUserId}.com` 
      : cleanUserId;

    try {
      // Authenticate dynamically against Supabase Auth
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
              Secure administrative access portal for AI&amp;DS department placement monitoring and analytics.
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

      {/* Right Section: Clean Light Admin Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-8 sm:p-14 lg:p-20 bg-[#F8F9FA] relative">
        <div className="max-w-[380px] mx-auto w-full space-y-8">
          
          {/* Header Logo */}
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <LuShieldCheck size={24} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Admin Login</h2>
            <p className="text-xs text-slate-500 font-medium">Enter your credentials to access the department dashboard.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            {/* User ID Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">User ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LuUser size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your User ID"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LuLock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-14 mt-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <LuArrowRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}

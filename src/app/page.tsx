"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LuBuilding2, 
  LuUser, 
  LuShieldCheck, 
  LuArrowRight, 
  LuCircleHelp,
  LuGlobe,
  LuLock,
  LuSparkles,
  LuMoveRight
} from "react-icons/lu";
import { cn } from "@/lib/utils";

export default function TenantEntryPage() {
  const [role, setRole] = useState<"student" | "admin">("student");

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans selection:bg-primary/20 text-foreground overflow-x-hidden max-w-full">
      
      {/* Left Section: Large Brand Hero */}
      <div className="relative w-full lg:w-[55%] bg-[#0A0A0B] flex flex-col justify-center p-8 lg:p-24 overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
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
        <div className="max-w-[420px] mx-auto w-full space-y-10">
          
          <div className="space-y-12">
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <img src="/placely.png" alt="Placely" className="h-20 w-20 object-contain" />
              <span className="text-7xl font-black tracking-tighter text-foreground leading-none">Placely</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-muted">Sign in to Continue</h2>
            </div>
          </div>

          <div className="space-y-6">
            {/* Role Tabs */}
            <div className="flex p-1 bg-background rounded-[20px] border border-border-subtle">
              <button
                onClick={() => setRole("student")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all",
                  role === "student" ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-foreground"
                )}
              >
                <LuUser size={16} />
                Student
              </button>
              <button
                onClick={() => setRole("admin")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all",
                  role === "admin" ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-foreground"
                )}
              >
                <LuShieldCheck size={16} />
                Admin
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Access Credentials</label>
                <div className="relative">
                  <LuLock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text"
                    placeholder={role === "student" ? "Student Roll Number" : "Administrator ID"}
                    className="w-full pl-14 pr-6 py-4.5 rounded-[24px] border border-border-subtle bg-surface text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              <Link 
                href={role === "student" ? "/dashboard" : "/admin/dashboard"}
                className="w-full h-16 flex items-center justify-center gap-3 rounded-[24px] bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all transform active:scale-[0.98] group"
              >
                Access Portal
                <LuMoveRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">Recovery Mode</button>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">
              <LuCircleHelp size={14} />
              Support
            </button>
          </div>

        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center opacity-40">
           <p className="text-[9px] font-black uppercase tracking-[0.2em]">Powered by Placely Unified Infrastructure</p>
        </div>
      </div>
    </div>
  );
}

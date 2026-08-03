"use client";

import { StudentShell } from "@/components/layout/student-shell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { LuConstruction } from "react-icons/lu";

const STUDENT_PORTAL_DISABLED = process.env.NEXT_PUBLIC_DISABLE_STUDENT_PORTAL === "true";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [hasId, setHasId] = useState(false);

  // Feature flag: block student portal entirely
  if (STUDENT_PORTAL_DISABLED) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-sm w-full space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <LuConstruction size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Student Portal</h1>
            <p className="text-[13px] text-white/40 font-medium leading-relaxed">
              The student portal is currently under development and will be available soon.
              For queries, contact the placement cell.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!DEV_STUDENT_ID) {
      router.push("/");
    } else {
      setHasId(true);
    }
  }, [router]);

  if (!hasId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted text-sm font-bold">
        Redirecting to sign in...
      </div>
    );
  }

  return <StudentShell>{children}</StudentShell>;
}

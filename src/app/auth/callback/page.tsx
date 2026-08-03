"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setLoggedStudentId } from "@/lib/dev-config";
import { LuLoader, LuCircleAlert, LuLogOut } from "react-icons/lu";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          setErrorMsg("No active session found. Please try logging in again.");
          return;
        }

        const email = session.user?.email;
        if (!email) {
          setErrorMsg("No email address returned from Google account.");
          return;
        }

        // Query public.users table for this email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', email)
          .maybeSingle();

        if (userError) throw userError;

        if (!userData) {
          setErrorMsg(`Email ${email} is not registered in the system. Please contact your system administrator.`);
          return;
        }

        if (userData.role === 'admin') {
          router.push("/admin/dashboard");
        } else {
          // Student portal disabled — block student login
          if (process.env.NEXT_PUBLIC_DISABLE_STUDENT_PORTAL === "true") {
            setErrorMsg("The student portal is currently unavailable. Please contact the placement cell.");
            return;
          }

          // Find student ID
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userData.id)
            .maybeSingle();

          if (studentError) throw studentError;

          if (!studentData) {
            setErrorMsg("Your email is registered but no student profile was found.");
            return;
          }

          setLoggedStudentId(studentData.id);
          router.push("/dashboard");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "An unexpected error occurred during sign-in.");
      }
    }

    handleAuthCallback();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-foreground relative overflow-hidden">
      {/* Background Visuals */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-surface/50 border border-border-subtle/50 backdrop-blur-md rounded-[32px] p-8 md:p-10 shadow-2xl text-center space-y-6">
        {errorMsg ? (
          <>
            <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
              <LuCircleAlert size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-black tracking-tight text-white">Sign-in Failed</h2>
              <p className="font-sans text-xs text-white/50 leading-relaxed font-semibold">{errorMsg}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-4 rounded-2xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-background transition-all flex items-center justify-center gap-2 cursor-pointer text-muted hover:text-foreground"
            >
              <LuLogOut size={16} />
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="relative h-16 w-16 flex items-center justify-center mx-auto">
              <LuLoader size={40} className="text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-black tracking-tight text-white">Authenticating...</h2>
              <p className="font-sans text-xs text-white/40 leading-relaxed font-medium">Verifying your Google session credentials with the placement system.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

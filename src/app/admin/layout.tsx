"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      try {
        if (typeof window !== 'undefined') {
          const demoAdminEmail = localStorage.getItem('active_admin_email');
          if (demoAdminEmail) {
            setIsAdmin(true);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        const email = session.user?.email;
        if (!email) {
          router.push("/");
          return;
        }

        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (error || !userData || userData.role !== "admin") {
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin authorization failed:", err);
        router.push("/");
      }
    }

    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0A0A0B]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-muted mt-4 uppercase tracking-widest animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

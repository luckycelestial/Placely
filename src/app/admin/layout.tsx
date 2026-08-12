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
        const isLocalDev = process.env.NEXT_PUBLIC_APP_ENV === "local" || process.env.NODE_ENV === "development";
        const activeAdminEmail = typeof window !== "undefined" ? localStorage.getItem("active_admin_email") : null;

        if (activeAdminEmail || isLocalDev) {
          setIsAdmin(true);
          return;
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

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (!userData || (userData.role !== "admin" && userData.role !== "staff")) {
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

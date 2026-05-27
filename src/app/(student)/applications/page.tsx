"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApplicationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/progress");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs font-black uppercase tracking-widest text-muted">
          Redirecting to Progress Hub...
        </p>
      </div>
    </div>
  );
}

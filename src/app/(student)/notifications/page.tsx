"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="py-32 text-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-muted mt-4 uppercase tracking-widest">Redirecting to Dashboard...</p>
    </div>
  );
}

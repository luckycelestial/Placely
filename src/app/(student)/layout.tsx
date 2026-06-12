"use client";

import { StudentShell } from "@/components/layout/student-shell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEV_STUDENT_ID } from "@/lib/dev-config";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [hasId, setHasId] = useState(false);

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

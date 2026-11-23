/**
 * Client-Side API Bridge
 * All frontend requests go through the Next.js backend API (/api/rpc)
 * Automatically attaches auth tokens & session credentials.
 */

export async function apiCall<T = any>(action: string, ...args: unknown[]): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    // 1. Check for stored Supabase session token
    try {
      const stored = localStorage.getItem("placely-auth-token");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore parsing errors
    }

    // 2. Dev mode persona headers
    const adminEmail = localStorage.getItem("active_admin_email");
    if (adminEmail) {
      headers["x-placely-admin-email"] = adminEmail;
    }

    const studentId = localStorage.getItem("active_student_id");
    if (studentId) {
      headers["x-placely-student-id"] = studentId;
    }
  }

  const res = await fetch("/api/rpc", {
    method: "POST",
    headers,
    body: JSON.stringify({ action, args }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Server returned error HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Operation failed on backend");
  }

  return json.data;
}

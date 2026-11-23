import "server-only";
import { serverDb } from "./server-db";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: "admin" | "student" | "guest";
  studentId?: string;
}

/**
 * Extracts and verifies the caller's session and role from an incoming request.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  // 1. Check Bearer Token (Supabase Access Token)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const { data: { user }, error } = await serverDb.auth.getUser(token);
        if (!error && user) {
          // Resolve role from public.users table
          const { data: dbUser } = await serverDb
            .from("users")
            .select("id, email, role")
            .eq("id", user.id)
            .maybeSingle();

          let studentId: string | undefined;
          if (dbUser?.role === "student") {
            const { data: student } = await serverDb
              .from("students")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();
            studentId = student?.id;
          }

          return {
            id: user.id,
            email: user.email || dbUser?.email,
            role: (dbUser?.role as "admin" | "student") || "student",
            studentId,
          };
        }
      } catch (err) {
        console.warn("[Auth Server] Failed to verify Supabase token:", err);
      }
    }
  }

  // 2. Local Development Persona fallback (ONLY enabled in non-production or local env)
  const isLocalDev = process.env.NEXT_PUBLIC_APP_ENV === "local" || process.env.NODE_ENV !== "production";
  if (isLocalDev) {
    const adminEmail = req.headers.get("x-placely-admin-email");
    if (adminEmail && adminEmail.toLowerCase().includes("admin")) {
      return {
        id: "local-dev-admin-id",
        email: adminEmail,
        role: "admin",
      };
    }

    const devStudentId = req.headers.get("x-placely-student-id");
    if (devStudentId) {
      return {
        id: "local-dev-student-id",
        role: "student",
        studentId: devStudentId,
      };
    }
  }

  return null;
}

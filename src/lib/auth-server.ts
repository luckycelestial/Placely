import "server-only";
import { serverDb } from "./server-db";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: "admin" | "student" | "guest";
  studentId?: string;
}

const ALLOWED_DEV_ADMIN_EMAILS = new Set([
  "admin@placely.test",
  "admin@placely.com",
  "superadmin@placely.com",
  "placement-admin@college.edu",
]);

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
          const userRole = dbUser?.role;
          if (userRole === "student") {
            const { data: student } = await serverDb
              .from("students")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();
            studentId = student?.id;
          }

          const resolvedRole: "admin" | "student" | "guest" =
            userRole === "admin" ? "admin" : userRole === "student" ? "student" : "guest";

          return {
            id: user.id,
            email: user.email || dbUser?.email,
            role: resolvedRole,
            studentId,
          };
        }
      } catch (err) {
        console.warn("[Auth Server] Failed to verify Supabase token:", err);
      }
    }
  }

  // 2. Local Development Persona fallback (STRICTLY disabled in production)
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const isExplicitDevEnv =
      process.env.APP_ENV === "local" ||
      process.env.APP_ENV === "test" ||
      process.env.NEXT_PUBLIC_APP_ENV === "local" ||
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development";

    if (isExplicitDevEnv) {
      const adminEmail = req.headers.get("x-placely-admin-email");
      if (adminEmail && ALLOWED_DEV_ADMIN_EMAILS.has(adminEmail.toLowerCase())) {
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
  }

  return null;
}

import { NextResponse } from "next/server";
import { serverServices } from "@/server";
import { verifyTurnstileToken } from "@/lib/turnstile-server";
import { getAuthenticatedUser } from "@/lib/auth-server";

// Actions requiring Turnstile bot protection
const PROTECTED_ACTIONS: Record<string, string> = {
  applyToDrive: "job_apply",
  createStudent: "student_create",
};

// Internal-only queue & system actions that must NEVER be called directly over RPC
const INTERNAL_ONLY_ACTIONS = new Set([
  "claimPendingJobs",
  "executeJob",
  "runJobProcessingCycle",
]);

// Administrative actions that strictly require admin role
const ADMIN_ONLY_ACTIONS = new Set([
  "createStudent",
  "deleteStudent",
  "syncStudentRow",
  "updateStudentVerification",
  "flagStudent",
  "createDrive",
  "updateDrive",
  "deleteDrive",
  "updateDriveStages",
  "updateAllDriveStages",
  "createCompany",
  "updateCompany",
  "deleteCompany",
  "createTemplate",
  "updateTemplate",
  "deleteTemplate",
  "bulkUpdateApplicationStage",
  "updateApplicationStage",
  "resetApplicationsStage",
  "deleteOffer",
  "updateOffer",
  "updateOfferStatus",
  "updateOfferVerification",
  "bulkCreateOffers",
  "updateApplicationCtc",
  "createNotice",
  "updateNotice",
  "deleteNotice",
  "toggleNoticePin",
  "createEvent",
  "updateEvent",
  "deleteEvent",
  "updateSystemSettings",
  "updateSettingByKey",
  "bulkCreateStudents",
  "bulkUploadResults",
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, args = [], turnstileToken } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { success: false, error: "Action name is required." },
        { status: 400 }
      );
    }

    // 1. Block internal-only actions
    if (INTERNAL_ONLY_ACTIONS.has(action)) {
      return NextResponse.json(
        { success: false, error: `Action '${action}' is restricted to internal background tasks.` },
        { status: 403 }
      );
    }

    // 2. Validate Turnstile token if required
    if (PROTECTED_ACTIONS[action]) {
      const token = req.headers.get("cf-turnstile-response") || turnstileToken;
      const remoteIp = req.headers.get("x-forwarded-for") ?? undefined;
      const verification = await verifyTurnstileToken({
        token,
        expectedAction: PROTECTED_ACTIONS[action],
        remoteIp,
      });

      if (!verification.success) {
        return NextResponse.json(
          { success: false, error: verification.error || "Turnstile verification failed" },
          { status: 403 }
        );
      }
    }

    // 3. Enforce Role-Based Access Control for Administrative Actions
    if (ADMIN_ONLY_ACTIONS.has(action)) {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser || authUser.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Admin privileges required." },
          { status: 403 }
        );
      }
    }

    // 4. Protect student profile updates against privilege escalation and academic record tampering
    if (action === "updateStudentProfile") {
      const authUser = await getAuthenticatedUser(req);
      if (authUser && authUser.role !== "admin") {
        // Enforce student can only update their own profile
        const targetStudentId = args[0];
        if (authUser.studentId && targetStudentId !== authUser.studentId) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You cannot modify another student's profile." },
            { status: 403 }
          );
        }

        // Sanitize payload: strip academic & administrative columns from non-admin updates
        const payload = (args[1] || {}) as Record<string, unknown>;
        const sanitized: Record<string, unknown> = { ...payload };
        const FORBIDDEN_STUDENT_FIELDS = [
          "cgpa",
          "active_arrears",
          "history_of_arrears",
          "history_of_backlogs",
          "tenth_score",
          "twelfth_score",
          "diploma_score",
          "semester_cgpa",
          "department",
          "year",
          "register_number",
          "placement_status",
          "verification_status",
        ];
        FORBIDDEN_STUDENT_FIELDS.forEach((f) => delete sanitized[f]);
        args[1] = sanitized;
      }
    }

    // 5. Enforce that students can only apply on their own behalf
    if (action === "applyToDrive") {
      const authUser = await getAuthenticatedUser(req);
      if (authUser && authUser.role === "student" && authUser.studentId) {
        // Force the first argument (studentId) to match the authenticated student ID
        args[0] = authUser.studentId;
      }
    }

    const handler = serverServices[action];
    if (typeof handler !== "function") {
      return NextResponse.json(
        { success: false, error: `Invalid backend action: '${action}'` },
        { status: 404 }
      );
    }

    const data = await handler(...args);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    let message = "Internal server error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error !== null) {
      message = (error as any).message || (error as any).error_description || (error as any).details || JSON.stringify(error);
    } else if (typeof error === "string") {
      message = error;
    }

    console.error(`[API RPC Error]:`, message, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

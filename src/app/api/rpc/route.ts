import { NextResponse } from "next/server";
import { serverServices } from "@/server";
import { verifyTurnstileToken } from "@/lib/turnstile-server";
import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/auth-server";

// Bot protection requirements for sensitive entry points
const BOT_PROTECTED_ACTIONS: Record<string, string> = {
  applyToDrive: "job_apply",
  applyToDriveWithForm: "job_apply",
  createStudent: "student_create",
};

type RoleRequirement = "admin" | "student" | "authenticated" | "public";

interface ActionPolicy {
  role: RoleRequirement;
  ownership?: (user: AuthenticatedUser, args: any[]) => boolean | Promise<boolean>;
  sanitizeArgs?: (user: AuthenticatedUser, args: any[]) => any[];
}

/**
 * Strict Action Registry & Access Control Matrix (Allowlist)
 * Every callable RPC action MUST be explicitly registered here with its minimum role
 * and ownership boundaries. Unregistered actions and generic database helpers are blocked by default.
 */
const ACTION_POLICIES: Record<string, ActionPolicy> = {
  // ── Public / Anonymous Safe Queries ──
  getStudents: { role: "public" },
  getSystemSettings: { role: "public" },
  getSettingByKey: { role: "public" },

  // ── Authenticated / Student-Safe Actions ──
  getDrives: { role: "authenticated" },
  getCompanies: { role: "authenticated" },
  getDistinctBatches: { role: "authenticated" },
  getDistinctDepartments: { role: "authenticated" },
  getTemplates: { role: "authenticated" },
  getNotices: { role: "authenticated" },
  getNoticesAll: { role: "authenticated" },
  getEvents: { role: "authenticated" },
  getEventsAll: { role: "authenticated" },
  getNoticeRsvps: { role: "authenticated" },
  getLeaderboardData: { role: "authenticated" },
  getRecentActivity: { role: "authenticated" },
  logAudit: { role: "authenticated" },
  validatePlacementFormResponses: { role: "authenticated" },
  evaluateStudentEligibility: { role: "authenticated" },

  // ── Student-Scoped Operations with Strict Ownership ──
  applyToDrive: {
    role: "authenticated",
    ownership: (user, args) => {
      // Force student ID to match authenticated user
      if (user.role === "student" && user.studentId) {
        args[0] = user.studentId;
      }
      return user.role === "admin" || (user.role === "student" && Boolean(user.studentId));
    },
  },
  applyToDriveWithForm: {
    role: "authenticated",
    ownership: (user, args) => {
      if (user.role === "student" && user.studentId) {
        if (!args[0]) args[0] = {};
        args[0].studentId = user.studentId;
      }
      return user.role === "admin" || (user.role === "student" && Boolean(user.studentId));
    },
  },
  getStudentAppliedDriveIds: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  getStudentApplications: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  getStudentOffers: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  getStudentApplicationStats: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  acceptOffer: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  setOfferJoiningDate: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  getStudentProfile: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  updateStudentProfile: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
    sanitizeArgs: (user, args) => {
      // Non-admin callers cannot modify academic, batch, or verification columns
      if (user.role !== "admin") {
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
      return args;
    },
  },
  uploadAvatar: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.id,
  },
  getStudentDashboardStats: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  getStudentActivity: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  generateStudentProfilePDF: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  generateStudentReport: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  getStudentProjects: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  createStudentProject: {
    role: "authenticated",
    ownership: (user, args) => {
      if (user.role === "student" && user.studentId) {
        if (!args[0]) args[0] = {};
        args[0].student_id = user.studentId;
      }
      return true;
    },
  },
  updateStudentProject: {
    role: "authenticated",
    ownership: async (user, args) => {
      if (user.role === "admin") return true;
      const projectId = args[0];
      if (!projectId || !user.studentId) return false;
      const projects = await serverServices.getStudentProjects(user.studentId);
      return Array.isArray(projects) && projects.some((p: any) => p.id === projectId);
    },
  },
  deleteStudentProject: {
    role: "authenticated",
    ownership: async (user, args) => {
      if (user.role === "admin") return true;
      const projectId = args[0];
      if (!projectId || !user.studentId) return false;
      const projects = await serverServices.getStudentProjects(user.studentId);
      return Array.isArray(projects) && projects.some((p: any) => p.id === projectId);
    },
  },
  getStudentDocuments: {
    role: "authenticated",
    ownership: (user, args) => user.role === "admin" || args[0] === user.studentId,
  },
  upsertStudentDocument: {
    role: "authenticated",
    ownership: async (user, args) => {
      if (user.role === "admin") return true;
      if (user.role !== "student" || !user.studentId) return false;
      if (!args[0]) args[0] = {};
      const docPayload = args[0];
      if (docPayload.id) {
        const existingDocs = await serverServices.getStudentDocuments(user.studentId);
        if (Array.isArray(existingDocs) && !existingDocs.some((d: any) => d.id === docPayload.id)) {
          return false;
        }
      }
      docPayload.student_id = user.studentId;
      return true;
    },
  },
  deleteStudentDocument: {
    role: "authenticated",
    ownership: async (user, args) => {
      if (user.role === "admin") return true;
      const docId = args[0];
      if (!docId || !user.studentId) return false;
      const docs = await serverServices.getStudentDocuments(user.studentId);
      return Array.isArray(docs) && docs.some((d: any) => d.id === docId);
    },
  },

  // ── Administrative Operations (Strict Admin Role Required) ──
  enqueueJob: { role: "admin" },
  getAllStudents: { role: "admin" },
  createStudent: { role: "admin" },
  deleteStudent: { role: "admin" },
  syncStudentRow: { role: "admin" },
  updateStudentVerification: { role: "admin" },
  flagStudent: { role: "admin" },
  bulkCreateStudents: { role: "admin" },
  bulkUploadResults: { role: "admin" },
  getFilteredStudentCount: { role: "admin" },

  createDrive: { role: "admin" },
  updateDrive: { role: "admin" },
  deleteDrive: { role: "admin" },
  updateDriveStages: { role: "admin" },
  updateAllDriveStages: { role: "admin" },
  createCompany: { role: "admin" },
  updateCompany: { role: "admin" },
  deleteCompany: { role: "admin" },
  createTemplate: { role: "admin" },
  updateTemplate: { role: "admin" },
  deleteTemplate: { role: "admin" },

  getApplications: { role: "admin" },
  updateApplicationStage: { role: "admin" },
  bulkUpdateApplicationStage: { role: "admin" },
  resetApplicationsStage: { role: "admin" },
  updateApplicationCtc: { role: "admin" },
  getOffers: { role: "admin" },
  deleteOffer: { role: "admin" },
  updateOffer: { role: "admin" },
  updateOfferStatus: { role: "admin" },
  updateOfferVerification: { role: "admin" },
  bulkCreateOffers: { role: "admin" },

  createNotice: { role: "admin" },
  updateNotice: { role: "admin" },
  deleteNotice: { role: "admin" },
  toggleNoticePin: { role: "admin" },
  createEvent: { role: "admin" },
  updateEvent: { role: "admin" },
  deleteEvent: { role: "admin" },

  getDashboardStats: { role: "admin" },
  getApplicationStats: { role: "admin" },
  getReportStats: { role: "admin" },
  getTrendData: { role: "admin" },
  getDepartmentAnalytics: { role: "admin" },
  getCompanyAnalytics: { role: "admin" },
  getYearAnalytics: { role: "admin" },
  getCrossAnalytics: { role: "admin" },
  generateSystemReport: { role: "admin" },
  getPendingApprovals: { role: "admin" },
  getAdminTasks: { role: "admin" },

  getAllStudentDocuments: { role: "admin" },
  updateStudentDocumentVerification: { role: "admin" },

  updateSystemSettings: { role: "admin" },
  updateSettingByKey: { role: "admin" },

  // Workflows & Approvals (Admin)
  generateDriveEligibilityShortlist: { role: "admin" },
  autoShortlistDriveApplicants: { role: "admin" },
  scanAndQueueDeadlineReminders: { role: "admin" },
  reviewStudentDocument: { role: "admin" },
  reviewOfferApproval: { role: "admin" },
  reviewDriveApproval: { role: "admin" },

  // Infrastructure & Quota Metrics (Admin)
  getInfrastructureMetrics: { role: "admin" },
};

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

    // 1. Strict Allowlist Gate: Reject unapproved actions or generic database helpers
    const policy = ACTION_POLICIES[action];
    if (!policy) {
      console.warn(`[Security Gate] Blocked unregistered action: '${action}'`);
      return NextResponse.json(
        { success: false, error: `Action '${action}' is not permitted.` },
        { status: 403 }
      );
    }

    // 2. Authentication Enforcement: Require an authenticated session by default
    const authUser = await getAuthenticatedUser(req);
    if (policy.role !== "public" && !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }

    // 3. Minimum Role Enforcement
    if (policy.role === "admin" && authUser?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    // 4. Ownership Boundary Check
    if (policy.ownership && authUser) {
      const isOwner = await policy.ownership(authUser, args);
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You do not have permission to access or modify this record." },
          { status: 403 }
        );
      }
    }

    // 5. Argument Sanitization
    let finalArgs = args;
    if (policy.sanitizeArgs && authUser) {
      finalArgs = policy.sanitizeArgs(authUser, args);
    }

    // 6. Bot Protection Verification (Turnstile)
    if (BOT_PROTECTED_ACTIONS[action]) {
      const token = req.headers.get("cf-turnstile-response") || turnstileToken;
      const remoteIp = req.headers.get("x-forwarded-for") ?? undefined;
      const verification = await verifyTurnstileToken({
        token,
        expectedAction: BOT_PROTECTED_ACTIONS[action],
        remoteIp,
      });

      if (!verification.success) {
        return NextResponse.json(
          { success: false, error: verification.error || "Turnstile verification failed" },
          { status: 403 }
        );
      }
    }

    // 7. Handler Execution
    const handler = serverServices[action];
    if (typeof handler !== "function") {
      return NextResponse.json(
        { success: false, error: `Handler for action '${action}' is not implemented.` },
        { status: 501 }
      );
    }

    const data = await handler(...finalArgs);
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

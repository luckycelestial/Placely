import { apiCall } from "@/lib/api-client";

// Client-side relative time formatter (runs synchronously in browser)
export function formatRelativeTime(dateString: string) {
  if (!dateString) return "N/A";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export function clearStudentsCache() {
  // Client cache purge if needed
}

// Named exports for components importing functions individually
export const deleteNotice = (...args: unknown[]) => apiCall("deleteNotice", ...args);
export const toggleNoticePin = (...args: unknown[]) => apiCall("toggleNoticePin", ...args);
export const createEvent = (...args: unknown[]) => apiCall("createEvent", ...args);
export const updateEvent = (...args: unknown[]) => apiCall("updateEvent", ...args);
export const deleteEvent = (...args: unknown[]) => apiCall("deleteEvent", ...args);
export const createNotice = (...args: unknown[]) => apiCall("createNotice", ...args);
export const updateNotice = (...args: unknown[]) => apiCall("updateNotice", ...args);
export const getStudents = (...args: unknown[]) => apiCall("getStudents", ...args);
export const getAllStudents = (...args: unknown[]) => apiCall("getAllStudents", ...args);
export const getStudentProfile = (...args: unknown[]) => apiCall("getStudentProfile", ...args);
export const updateStudentProfile = (...args: unknown[]) => apiCall("updateStudentProfile", ...args);
export const createStudent = (...args: unknown[]) => apiCall("createStudent", ...args);
export const getNotices = (...args: unknown[]) => apiCall("getNotices", ...args);
export const getNoticesAll = (...args: unknown[]) => apiCall("getNoticesAll", ...args);
export const getEvents = (...args: unknown[]) => apiCall("getEvents", ...args);
export const getEventsAll = (...args: unknown[]) => apiCall("getEventsAll", ...args);
export const getCompanies = (...args: unknown[]) => apiCall("getCompanies", ...args);
export const getDrives = (...args: unknown[]) => apiCall("getDrives", ...args);
export const getOffers = (...args: unknown[]) => apiCall("getOffers", ...args);
export const getApplications = (...args: unknown[]) => apiCall("getApplications", ...args);
export const getDashboardStats = (...args: unknown[]) => apiCall("getDashboardStats", ...args);
export const getStudentDashboardStats = (...args: unknown[]) => apiCall("getStudentDashboardStats", ...args);
export const getStudentApplications = (...args: unknown[]) => apiCall("getStudentApplications", ...args);
export const getStudentOffers = (...args: unknown[]) => apiCall("getStudentOffers", ...args);
export const applyToDrive = (...args: unknown[]) => apiCall("applyToDrive", ...args);
export const acceptOffer = (...args: unknown[]) => apiCall("acceptOffer", ...args);
export const getTableData = (...args: unknown[]) => apiCall("getTableData", ...args);
export const getTableCount = (...args: unknown[]) => apiCall("getTableCount", ...args);
export const updateTableCell = (...args: unknown[]) => apiCall("updateTableCell", ...args);
export const upsertTableData = (...args: unknown[]) => apiCall("upsertTableData", ...args);
export const getStudentProjects = (...args: unknown[]) => apiCall("getStudentProjects", ...args);
export const createStudentProject = (...args: unknown[]) => apiCall("createStudentProject", ...args);
export const deleteStudentProject = (...args: unknown[]) => apiCall("deleteStudentProject", ...args);
export const getAdminTasks = (...args: unknown[]) => apiCall("getAdminTasks", ...args);
export const getNoticeRsvps = (...args: unknown[]) => apiCall("getNoticeRsvps", ...args);
export const getLeaderboardData = (...args: unknown[]) => apiCall("getLeaderboardData", ...args);
export const logAudit = (...args: unknown[]) => apiCall("logAudit", ...args);
export const enqueueJob = (...args: unknown[]) => apiCall("enqueueJob", ...args);
export const runJobProcessingCycle = (...args: unknown[]) => apiCall("runJobProcessingCycle", ...args);

// Dynamic backend proxy covering ALL database operations
export const db: any = new Proxy(
  {
    formatRelativeTime,
    clearStudentsCache,
    deleteNotice,
    toggleNoticePin,
    createEvent,
    updateEvent,
    deleteEvent,
    createNotice,
    updateNotice,
    getStudents,
    getAllStudents,
    getStudentProfile,
    updateStudentProfile,
    createStudent,
    getNotices,
    getEvents,
    getCompanies,
    getDrives,
    getOffers,
    getApplications,
    getDashboardStats,
    getStudentDashboardStats,
    getStudentApplications,
    getStudentOffers,
    applyToDrive,
    acceptOffer,
    getTableData,
    getTableCount,
    updateTableCell,
    upsertTableData,
    getStudentProjects,
    createStudentProject,
    deleteStudentProject,
    getAdminTasks,
    getNoticeRsvps,
    getLeaderboardData,
    logAudit,
  },
  {
    get(target: Record<string, any>, prop: string) {
      if (prop in target) return target[prop];
      return (...args: unknown[]) => apiCall(prop, ...args);
    },
  }
);

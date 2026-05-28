// ---------- Shared Drive types & state resolution ----------

export interface Drive {
  id: string;
  company_id: string;
  role_title: string;
  location: string;
  package_ctc: string;
  application_start?: string | null;
  application_end: string;
  drive_start?: string | null;
  drive_end?: string | null;
  drive_type: string;
  status: string;
  eligibility_rules: {
    branches: string[];
    min_cgpa: number;
    backlogs_allowed: number;
    history_of_arrears: boolean;
  };
  companies: {
    name: string;
    logo_url: string;
    theme_color: string;
  };
  isEligible?: boolean;
  ineligibleReasons?: string[];
}

export interface ResolvedState {
  phase: 'pre_open' | 'open' | 'ongoing' | 'completed';
  isEligible: boolean;
  ineligibleReasons: string[];
  hasApplied: boolean;
  cardBorder: string;
  ctaText: string;
  ctaClass: string;
  ctaDisabled: boolean;
  opacityClass: string;
}

export interface StudentInfo {
  branch: string;
  cgpa: number;
  backlogs: number;
  history_of_arrears: boolean;
}

export interface DriveFilters {
  eligibility: string;
  phase: string;
  location: string;
  minCtc: number;
}

export function resolveDriveState(
  drive: Drive,
  appliedIds: Set<string>,
  studentInfo: StudentInfo
): ResolvedState {
  const now = Date.now();
  const hasApplied = appliedIds.has(drive.id);

  const appStart = drive.application_start ? new Date(drive.application_start).getTime() : null;
  const appEnd = drive.application_end ? new Date(drive.application_end).getTime() : null;
  const drEnd = drive.drive_end ? new Date(drive.drive_end).getTime() : null;

  const rules = drive.eligibility_rules || {};
  const ineligibleReasons: string[] = [];

  if (rules.branches && rules.branches.length > 0 && !rules.branches.includes(studentInfo.branch)) {
    ineligibleReasons.push(`Not open to ${studentInfo.branch} branch`);
  }
  if (rules.min_cgpa && studentInfo.cgpa < rules.min_cgpa) {
    ineligibleReasons.push(`CGPA too low (Requires ${rules.min_cgpa}+)`);
  }
  if (rules.backlogs_allowed !== undefined && studentInfo.backlogs > rules.backlogs_allowed) {
    ineligibleReasons.push(`Too many backlogs (Max ${rules.backlogs_allowed})`);
  }
  if (rules.history_of_arrears === false && studentInfo.history_of_arrears === true) {
    ineligibleReasons.push("Requires no history of arrears");
  }

  const isEligible = ineligibleReasons.length === 0;

  let phase: 'pre_open' | 'open' | 'ongoing' | 'completed' = 'open';
  if (drive.status === 'upcoming' || (appStart && now < appStart)) {
    phase = 'pre_open';
  } else if (drive.status === 'completed' || (drEnd && now > drEnd)) {
    phase = 'completed';
  } else if (appEnd && now > appEnd) {
    phase = 'ongoing';
  } else {
    phase = 'open';
  }

  let cardBorder = "border-border-subtle hover:border-primary/40";
  let ctaText = "";
  let ctaClass = "";
  let ctaDisabled = false;
  let opacityClass = "";

  if (phase === 'pre_open') {
    ctaDisabled = true;
    if (isEligible) {
      cardBorder = "border-emerald-100 hover:border-emerald-200";
      ctaText = "Opening Soon • Eligible";
      ctaClass = "bg-emerald-50/40 text-emerald-600 border border-emerald-200/50 cursor-not-allowed";
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      ctaText = "Opening Soon • Not Eligible";
      ctaClass = "bg-red-50/30 text-red-600 border border-red-200/40 cursor-not-allowed";
    }
  } else if (phase === 'open') {
    if (isEligible) {
      if (hasApplied) {
        cardBorder = "border-emerald-200 hover:border-emerald-300";
        ctaText = "Applied • Open";
        ctaClass = "bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default";
        ctaDisabled = true;
      } else {
        cardBorder = "border-border-subtle hover:border-emerald-400";
        ctaText = "Eligible • Open";
        ctaClass = "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-soft hover:shadow-hover hover:scale-[1.01]";
      }
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      ctaText = "Not Eligible • Open";
      ctaClass = "bg-red-50/30 text-red-700/50 border border-red-200/40 cursor-not-allowed";
      ctaDisabled = true;
    }
  } else if (phase === 'ongoing') {
    if (hasApplied) {
      cardBorder = "border-blue-200 hover:border-blue-400 shadow-sm";
      ctaText = "Applied • Ongoing";
      ctaClass = "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-soft hover:shadow-hover";
      ctaDisabled = false;
    } else if (isEligible) {
      cardBorder = "border-amber-100 hover:border-amber-200";
      opacityClass = "opacity-70";
      ctaText = "Missed • Ongoing";
      ctaClass = "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed";
      ctaDisabled = true;
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      opacityClass = "opacity-70";
      ctaText = "Not Eligible • Ongoing";
      ctaClass = "bg-red-50/30 text-red-700/50 border border-red-200/40 cursor-not-allowed";
      ctaDisabled = true;
    }
  } else if (phase === 'completed') {
    if (hasApplied) {
      cardBorder = "border-emerald-200 hover:border-emerald-400 shadow-sm";
      opacityClass = "opacity-85";
      ctaText = "Attended • Closed";
      ctaClass = "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-soft hover:shadow-hover";
      ctaDisabled = false;
    } else if (isEligible) {
      cardBorder = "border-amber-100 hover:border-amber-200";
      opacityClass = "opacity-50";
      ctaText = "Missed • Closed";
      ctaClass = "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed";
      ctaDisabled = true;
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      opacityClass = "opacity-50";
      ctaText = "Not Eligible • Closed";
      ctaClass = "bg-red-50/30 text-red-700/50 border border-red-200/40 cursor-not-allowed";
      ctaDisabled = true;
    }
  }

  return { phase, isEligible, ineligibleReasons, hasApplied, cardBorder, ctaText, ctaClass, ctaDisabled, opacityClass };
}

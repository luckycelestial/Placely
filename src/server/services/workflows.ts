import 'server-only';
import { serverDb as supabase } from '@/lib/server-db';
import { enqueueJob } from './queue';

export interface FormQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'url';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DriveEligibilityRules {
  minCgpa?: number;
  allowedDepartments?: string[];
  maxActiveArrears?: number;
  allowHistoryOfBacklogs?: boolean;
  targetGraduationYear?: number;
}

/**
 * Validates dynamic placement form inputs against configured question definitions.
 */
export function validatePlacementFormResponses(
  questions: FormQuestion[] = [],
  responses: Record<string, unknown> = {}
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const q of questions) {
    const val = responses[q.id];

    if (q.required) {
      if (val === undefined || val === null || val === '') {
        errors[q.id] = `${q.label} is required.`;
        continue;
      }
    }

    if (val !== undefined && val !== null && val !== '') {
      if (q.type === 'number' && isNaN(Number(val))) {
        errors[q.id] = `${q.label} must be a valid number.`;
      } else if (q.type === 'url') {
        try {
          new URL(String(val));
        } catch {
          errors[q.id] = `${q.label} must be a valid URL (e.g. https://...).`;
        }
      } else if (q.type === 'select' && q.options && !q.options.includes(String(val))) {
        errors[q.id] = `${q.label} must be one of: ${q.options.join(', ')}`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Apply to a placement drive with dynamic custom form responses.
 */
export async function applyToDriveWithForm(params: {
  studentId: string;
  driveId: string;
  responses?: Record<string, unknown>;
}) {
  const { studentId, driveId, responses = {} } = params;

  if (!studentId) {
    throw new Error('Student ID is required.');
  }
  if (!driveId) {
    throw new Error('Drive ID is required.');
  }

  // 1. Fetch drive and questions
  const { data: drive, error: driveErr } = await supabase
    .from('job_drives')
    .select('id, role_title, eligibility_rules, status')
    .eq('id', driveId)
    .single();

  if (driveErr || !drive) {
    throw new Error('Job drive not found.');
  }

  if (drive.status === 'closed' || drive.status === 'archived') {
    throw new Error('This placement drive is closed for applications.');
  }

  // 2. Validate custom questions if configured
  const rules = (drive.eligibility_rules as any) || {};
  const questions: FormQuestion[] = rules.custom_questions || rules.formQuestions || [];

  if (questions.length > 0) {
    const validation = validatePlacementFormResponses(questions, responses);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }
  }

  // 3. Insert or update application
  const notesContent = Object.keys(responses).length > 0
    ? JSON.stringify({ formResponses: responses, submittedAt: new Date().toISOString() })
    : null;

  const { data: application, error: appErr } = await supabase
    .from('applications')
    .insert([
      {
        id: crypto.randomUUID(),
        student_id: studentId,
        drive_id: driveId,
        status: 'Applied',
        current_stage: 'applied',
        applied_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (appErr) {
    // Unique violation handling
    if (appErr.code === '23505') {
      throw new Error('You have already applied to this placement drive.');
    }
    throw new Error(appErr.message || 'Failed to submit application.');
  }

  return application;
}

/**
 * Pure evaluation function for eligibility checks.
 */
export function evaluateStudentEligibility(
  student: {
    cgpa?: number | string | null;
    department?: string | null;
    active_arrears?: number | null;
    history_of_backlogs?: boolean | null;
    year?: number | null;
  },
  criteria: DriveEligibilityRules
): { isEligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const studentCgpa = student.cgpa !== null && student.cgpa !== undefined ? Number(student.cgpa) : 0;
  if (criteria.minCgpa !== undefined && studentCgpa < criteria.minCgpa) {
    reasons.push(`CGPA ${studentCgpa} is below minimum requirement of ${criteria.minCgpa}`);
  }

  if (criteria.allowedDepartments && criteria.allowedDepartments.length > 0) {
    const dept = student.department?.toUpperCase();
    const allowed = criteria.allowedDepartments.map((d) => d.toUpperCase());
    if (!dept || !allowed.includes(dept)) {
      reasons.push(`Department ${student.department || 'Unknown'} is not eligible (${allowed.join(', ')})`);
    }
  }

  const arrears = student.active_arrears ?? 0;
  if (criteria.maxActiveArrears !== undefined && arrears > criteria.maxActiveArrears) {
    reasons.push(`Active arrears (${arrears}) exceeds maximum allowed (${criteria.maxActiveArrears})`);
  }

  if (criteria.allowHistoryOfBacklogs === false && student.history_of_backlogs) {
    reasons.push('History of backlogs is not permitted for this drive');
  }

  if (criteria.targetGraduationYear && student.year && student.year !== criteria.targetGraduationYear) {
    reasons.push(`Graduation year (${student.year}) does not match target (${criteria.targetGraduationYear})`);
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Evaluates all students against a drive's eligibility rules to produce a shortlist.
 */
export async function generateDriveEligibilityShortlist(driveId: string) {
  const { data: drive, error: driveErr } = await supabase
    .from('job_drives')
    .select('id, role_title, eligibility_rules')
    .eq('id', driveId)
    .single();

  if (driveErr || !drive) {
    throw new Error('Drive not found.');
  }

  const criteria: DriveEligibilityRules = (drive.eligibility_rules as any) || {};

  const { data: students, error: studentErr } = await supabase
    .from('students')
    .select('id, name, register_number, department, year, cgpa, active_arrears, history_of_backlogs, college_email')
    .order('register_number');

  if (studentErr) {
    throw new Error(studentErr.message);
  }

  const eligible: any[] = [];
  const ineligible: any[] = [];

  for (const s of students || []) {
    const evalResult = evaluateStudentEligibility(s, criteria);
    if (evalResult.isEligible) {
      eligible.push(s);
    } else {
      ineligible.push({ ...s, ineligibleReasons: evalResult.reasons });
    }
  }

  return {
    driveId,
    roleTitle: drive.role_title,
    criteria,
    totalEvaluated: (students || []).length,
    eligibleCount: eligible.length,
    ineligibleCount: ineligible.length,
    eligible,
    ineligible,
  };
}

/**
 * Automatically shortlists eligible applicants for a drive and updates their stage.
 */
export async function autoShortlistDriveApplicants(driveId: string) {
  const { data: drive, error: driveErr } = await supabase
    .from('job_drives')
    .select('id, eligibility_rules')
    .eq('id', driveId)
    .single();

  if (driveErr || !drive) {
    throw new Error('Drive not found.');
  }

  const criteria: DriveEligibilityRules = (drive.eligibility_rules as any) || {};

  const { data: applications, error: appErr } = await supabase
    .from('applications')
    .select(`
      id,
      student_id,
      status,
      current_stage,
      students (
        id,
        cgpa,
        department,
        active_arrears,
        history_of_backlogs,
        year
      )
    `)
    .eq('drive_id', driveId);

  if (appErr) throw appErr;

  let shortlistedCount = 0;
  let rejectedCount = 0;

  for (const app of applications || []) {
    const student = (app as any).students;
    if (!student) continue;

    const { isEligible } = evaluateStudentEligibility(student, criteria);

    if (isEligible) {
      await supabase
        .from('applications')
        .update({
          status: 'Shortlisted',
          current_stage: 'shortlisted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      shortlistedCount++;
    } else {
      await supabase
        .from('applications')
        .update({
          status: 'Rejected',
          current_stage: 'rejected_eligibility',
          updated_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      rejectedCount++;
    }
  }

  return { driveId, shortlistedCount, rejectedCount };
}

/**
 * Scans active drives approaching deadline and queues reminder jobs.
 */
export async function scanAndQueueDeadlineReminders(windowHours: number = 24) {
  const now = new Date();
  const future = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  const { data: drives, error } = await supabase
    .from('job_drives')
    .select('id, role_title, application_end, status')
    .gte('application_end', now.toISOString())
    .lte('application_end', future.toISOString())
    .eq('status', 'active');

  if (error || !drives) return { checkedCount: 0, remindersQueued: 0 };

  let remindersQueued = 0;
  for (const drive of drives) {
    const hoursLeft = Math.round((new Date(drive.application_end).getTime() - now.getTime()) / (1000 * 60 * 60));
    await enqueueJob('SEND_DEADLINE_REMINDER', {
      driveId: drive.id,
      hoursLeft: Math.max(1, hoursLeft),
    });
    remindersQueued++;
  }

  return { checkedCount: drives.length, remindersQueued };
}

/**
 * Staff workflow to review and verify/reject student uploaded documents.
 */
export async function reviewStudentDocument(params: {
  documentId: string;
  status: 'verified' | 'rejected' | 'pending';
  remarks?: string;
  reviewerId?: string;
}) {
  const { documentId, status, remarks, reviewerId } = params;

  const { data: existing, error: fetchErr } = await supabase
    .from('student_documents')
    .select('id, student_id, document_type, students(user_id, name)')
    .eq('id', documentId)
    .single();

  if (fetchErr || !existing) {
    throw new Error('Document not found.');
  }

  const { data: updated, error: updateErr } = await supabase
    .from('student_documents')
    .update({
      verification_status: status,
      remarks: remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (updateErr) throw updateErr;

  // Notify student of document verification status
  const student = (existing as any).students;
  if (student?.user_id) {
    await supabase.from('notifications').insert([
      {
        id: crypto.randomUUID(),
        user_id: student.user_id,
        title: `Document ${status === 'verified' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Under Review'}`,
        message: `Your ${existing.document_type || 'document'} was marked as ${status}.${remarks ? ` Note: ${remarks}` : ''}`,
        type: status === 'rejected' ? 'warning' : 'info',
        is_read: false,
        link: '/profile',
        created_at: new Date().toISOString(),
      },
    ]);
  }

  // Audit log
  await supabase.from('audit_logs').insert([
    {
      id: crypto.randomUUID(),
      actor_user_id: reviewerId || null,
      entity_type: 'student_document',
      entity_id: documentId,
      action: `document_verification_${status}`,
      new_data_json: { status, remarks },
      created_at: new Date().toISOString(),
    },
  ]);

  return updated;
}

/**
 * Staff workflow to approve or reject student offer letters.
 */
export async function reviewOfferApproval(params: {
  offerId: string;
  approved: boolean;
  remarks?: string;
  reviewerId?: string;
}) {
  const { offerId, approved, remarks, reviewerId } = params;

  const { data: offer, error: fetchErr } = await supabase
    .from('offers')
    .select('id, student_id, role_title, acceptance_status, students(user_id)')
    .eq('id', offerId)
    .single();

  if (fetchErr || !offer) {
    throw new Error('Offer not found.');
  }

  const newStatus = approved ? 'approved' : 'rejected';

  const { data: updated, error: updateErr } = await supabase
    .from('offers')
    .update({
      acceptance_status: newStatus,
      remarks: remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)
    .select()
    .single();

  if (updateErr) throw updateErr;

  const student = (offer as any).students;
  if (student?.user_id) {
    await supabase.from('notifications').insert([
      {
        id: crypto.randomUUID(),
        user_id: student.user_id,
        title: `Offer ${approved ? 'Accepted & Approved' : 'Review Decision'}`,
        message: `Your offer for ${offer.role_title} has been ${newStatus} by the placement office.${remarks ? ` Feedback: ${remarks}` : ''}`,
        type: approved ? 'success' : 'warning',
        is_read: false,
        link: '/offers',
        created_at: new Date().toISOString(),
      },
    ]);
  }

  await supabase.from('audit_logs').insert([
    {
      id: crypto.randomUUID(),
      actor_user_id: reviewerId || null,
      entity_type: 'offer',
      entity_id: offerId,
      action: `offer_${newStatus}`,
      new_data_json: { approved, remarks },
      created_at: new Date().toISOString(),
    },
  ]);

  return updated;
}

/**
 * Staff workflow to approve and publish new placement drives.
 */
export async function reviewDriveApproval(params: {
  driveId: string;
  action: 'approved' | 'rejected';
  feedback?: string;
  reviewerId?: string;
}) {
  const { driveId, action, feedback, reviewerId } = params;

  const status = action === 'approved' ? 'active' : 'draft';

  const { data: updated, error } = await supabase
    .from('job_drives')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', driveId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('audit_logs').insert([
    {
      id: crypto.randomUUID(),
      actor_user_id: reviewerId || null,
      entity_type: 'job_drive',
      entity_id: driveId,
      action: `drive_${action}`,
      new_data_json: { status, feedback },
      created_at: new Date().toISOString(),
    },
  ]);

  return updated;
}

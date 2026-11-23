import "server-only";
import { serverDb } from "@/lib/server-db";
import { bulkCreateStudents } from "./students/bulk";

export type BackgroundJobType =
  | "SEND_BROADCAST_NOTICE"
  | "SEND_APPLICATION_NOTIFICATION"
  | "IMPORT_STUDENT_BATCH"
  | "DRIVE_DEADLINE_SYNC"
  | "DISPATCH_WEBHOOK"
  | "SYNC_EXTERNAL_SHEETS";

export interface BackgroundJobPayloads {
  SEND_BROADCAST_NOTICE: {
    noticeId: string;
    title: string;
    content: string;
    targetDepartment?: string | null;
    targetYear?: number | null;
  };
  SEND_APPLICATION_NOTIFICATION: {
    applicationIds: string[];
    stageName: string;
    status: string;
  };
  IMPORT_STUDENT_BATCH: {
    batchId: string;
    records: Array<Record<string, unknown>>;
  };
  DRIVE_DEADLINE_SYNC: {
    triggeredBy?: string;
  };
  DISPATCH_WEBHOOK: {
    url: string;
    event: string;
    data: Record<string, unknown>;
  };
  SYNC_EXTERNAL_SHEETS: {
    sheetId?: string;
  };
}

export interface EnqueueOptions {
  scheduledFor?: Date;
  maxAttempts?: number;
}

/**
 * Enqueue a new background job into the PostgreSQL background_jobs table.
 * Immediately notifies the background worker via asynchronous fetch.
 */
export async function enqueueJob<T extends BackgroundJobType>(
  jobType: T,
  payload: BackgroundJobPayloads[T],
  options?: EnqueueOptions
) {
  const scheduledFor = options?.scheduledFor?.toISOString() || new Date().toISOString();
  const maxAttempts = options?.maxAttempts ?? 3;

  const { data, error } = await serverDb
    .from("background_jobs")
    .insert([
      {
        id: crypto.randomUUID(),
        job_type: jobType,
        payload,
        status: "pending",
        attempts: 0,
        max_attempts: maxAttempts,
        scheduled_for: scheduledFor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(`[Queue Error] Failed to enqueue job ${jobType}:`, error);
    throw new Error(`Failed to enqueue background job: ${error.message}`);
  }

  // Trigger worker asynchronously without awaiting
  triggerAsyncWorkerWakeup();

  return data;
}

/**
 * Non-blocking trigger to wake up the Cloudflare Worker or local background processor.
 */
function triggerAsyncWorkerWakeup() {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL || "http://127.0.0.1:3000/api/cron/process-jobs";
  const secretKey = process.env.QUEUE_SECRET_KEY || "placely-queue-secret-2026";

  // Detached fire-and-forget fetch
  fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({ trigger: "job_enqueued", timestamp: Date.now() }),
    signal: AbortSignal.timeout(4000),
  }).catch((err) => {
    // Non-fatal: if worker is unreachable immediately, the cron schedule will pick up the job
    console.log(`[Queue Wakeup]: Worker notified (${err?.message || "async dispatched"})`);
  });
}

/**
 * Fetch and lock pending jobs ready to be processed.
 */
export async function claimPendingJobs(limit: number = 10) {
  const now = new Date().toISOString();

  // 1. Fetch candidate jobs
  const { data: candidates, error: fetchErr } = await serverDb
    .from("background_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (fetchErr || !candidates || candidates.length === 0) {
    return [];
  }

  const claimedJobs = [];

  // 2. Mark as running
  for (const job of candidates) {
    const { data: updated, error: updateErr } = await serverDb
      .from("background_jobs")
      .update({
        status: "running",
        attempts: (job.attempts || 0) + 1,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (!updateErr && updated) {
      claimedJobs.push(updated);
    }
  }

  return claimedJobs;
}

/**
 * Execute a single background job by type.
 */
export async function executeJob(job: {
  id: string;
  job_type: string;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
}) {
  console.log(`[Queue Runner] Processing job ${job.id} (${job.job_type})...`);

  try {
    switch (job.job_type) {
      case "SEND_BROADCAST_NOTICE": {
        const { noticeId, title, content, targetDepartment, targetYear } = job.payload;

        // Query target students
        let query = serverDb.from("students").select("id, user_id");
        if (targetDepartment) query = query.eq("department", targetDepartment);
        if (targetYear) query = query.eq("year", targetYear);

        const { data: targetStudents, error } = await query;
        if (error) throw error;

        // Batch create notifications for all matching students
        if (targetStudents && targetStudents.length > 0) {
          const notifications = targetStudents
            .filter((s) => Boolean(s.user_id))
            .map((s) => ({
              id: crypto.randomUUID(),
              user_id: s.user_id,
              title: `Placement Notice: ${title}`,
              message: (content || "").substring(0, 150),
              type: "notice",
              is_read: false,
              link: "/notices",
              created_at: new Date().toISOString(),
            }));

          // Insert in chunks of 100 to prevent payload limits
          const CHUNK_SIZE = 100;
          for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
            const chunk = notifications.slice(i, i + CHUNK_SIZE);
            await serverDb.from("notifications").insert(chunk);
          }
        }
        break;
      }

      case "SEND_APPLICATION_NOTIFICATION": {
        const { applicationIds = [], stageName, status } = job.payload;
        if (applicationIds.length === 0) break;

        const { data: apps, error: appErr } = await serverDb
          .from("applications")
          .select(`
            id,
            student_id,
            students:student_id (user_id, name),
            job_drives:drive_id (
              role_title,
              companies:company_id (name)
            )
          `)
          .in("id", applicationIds);

        if (appErr) throw appErr;

        if (apps && apps.length > 0) {
          const notifications = apps
            .filter((a: any) => Boolean(a.students?.user_id))
            .map((a: any) => {
              const companyName = a.job_drives?.companies?.name || "Company";
              const roleTitle = a.job_drives?.role_title || "Placement Drive";
              return {
                id: crypto.randomUUID(),
                user_id: a.students.user_id,
                title: `Application Update: ${companyName}`,
                message: `Your application for ${roleTitle} is now in stage "${stageName || status}".`,
                type: "application",
                is_read: false,
                link: "/applications",
                created_at: new Date().toISOString(),
              };
            });

          const CHUNK_SIZE = 100;
          for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
            const chunk = notifications.slice(i, i + CHUNK_SIZE);
            await serverDb.from("notifications").insert(chunk);
          }
        }
        break;
      }

      case "IMPORT_STUDENT_BATCH": {
        const { records = [] } = job.payload;
        if (records.length > 0) {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            await bulkCreateStudents(chunk);
          }
        }
        break;
      }

      case "DRIVE_DEADLINE_SYNC": {
        const now = new Date().toISOString();

        // 1. Close job drives whose deadline has expired
        const { data: expiredDrives, error: driveErr } = await serverDb
          .from("job_drives")
          .update({ status: "closed", updated_at: now })
          .lt("deadline", now)
          .eq("status", "active")
          .select("id, role_title");

        if (driveErr) console.warn("[Sync Drives] Expired drive update warning:", driveErr);
        if (expiredDrives && expiredDrives.length > 0) {
          console.log(`[Sync Drives] Closed ${expiredDrives.length} expired job drives.`);
        }

        // 2. Scheduled maintenance: prune completed/failed background jobs older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        await serverDb
          .from("background_jobs")
          .delete()
          .in("status", ["completed", "failed"])
          .lt("created_at", sevenDaysAgo);
        break;
      }

      case "DISPATCH_WEBHOOK": {
        const { url, event, data } = job.payload;
        if (!url) throw new Error("Webhook URL is missing.");

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Placely-Background-Queue/1.0",
          },
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          throw new Error(`Webhook responder returned HTTP ${res.status}: ${res.statusText}`);
        }
        break;
      }

      default:
        console.warn(`[Queue Runner] Unknown job type: ${job.job_type}`);
    }

    // Mark as completed
    await serverDb
      .from("background_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`[Queue Runner] Job ${job.id} completed successfully.`);
    return { success: true, jobId: job.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Queue Runner] Job ${job.id} failed:`, errorMsg);

    const isExhausted = job.attempts >= job.max_attempts;
    await serverDb
      .from("background_jobs")
      .update({
        status: isExhausted ? "failed" : "pending",
        error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return { success: false, jobId: job.id, error: errorMsg };
  }
}

/**
 * Run a full processing batch cycle (processes all currently claimable jobs).
 */
export async function runJobProcessingCycle(limit: number = 20) {
  const jobs = await claimPendingJobs(limit);
  const results = [];

  for (const job of jobs) {
    const res = await executeJob(job as any);
    results.push(res);
  }

  return {
    processedCount: jobs.length,
    results,
  };
}

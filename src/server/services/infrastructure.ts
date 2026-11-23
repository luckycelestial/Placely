import 'server-only';
import { serverDb as supabase } from '@/lib/server-db';

export interface FreeTierQuotas {
  supabase: {
    maxStorageMb: number;
    maxMonthlyActiveUsers: number;
    estimatedStorageMb: number;
    usagePercent: number;
  };
  cloudflareR2: {
    maxStorageGb: number;
    maxClassAOperationsPerMonth: number;
    maxClassBOperationsPerMonth: number;
    costUsd: number;
  };
  cloudflareWorkers: {
    maxRequestsPerDay: number;
    maxCpuTimePerRequestMs: number;
    costUsd: number;
  };
}

/**
 * Returns infrastructure health and usage metrics against the $0 Free Tier boundaries.
 */
export async function getInfrastructureMetrics() {
  const startTime = Date.now();

  // 1. Check database latency and table row counts
  const [
    usersRes,
    studentsRes,
    drivesRes,
    appsRes,
    offersRes,
    documentsRes,
    jobsRes,
    logsRes,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('job_drives').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
    supabase.from('student_documents').select('*', { count: 'exact', head: true }),
    supabase.from('background_jobs').select('*', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
  ]);

  const dbLatencyMs = Date.now() - startTime;

  const rowCounts = {
    users: usersRes.count ?? 0,
    students: studentsRes.count ?? 0,
    job_drives: drivesRes.count ?? 0,
    applications: appsRes.count ?? 0,
    offers: offersRes.count ?? 0,
    student_documents: documentsRes.count ?? 0,
    background_jobs: jobsRes.count ?? 0,
    audit_logs: logsRes.count ?? 0,
  };

  const totalRows = Object.values(rowCounts).reduce((acc, count) => acc + count, 0);

  // Approximate database size: average 2KB per structured row with indexes
  const estimatedBytes = totalRows * 2048;
  const estimatedStorageMb = Number((estimatedBytes / (1024 * 1024)).toFixed(2));

  // Background queue backlog metrics
  const { count: pendingJobsCount } = await supabase
    .from('background_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: failedJobsCount } = await supabase
    .from('background_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  const quotas: FreeTierQuotas = {
    supabase: {
      maxStorageMb: 500, // Supabase free tier 500MB DB
      maxMonthlyActiveUsers: 50000,
      estimatedStorageMb,
      usagePercent: Number(((estimatedStorageMb / 500) * 100).toFixed(2)),
    },
    cloudflareR2: {
      maxStorageGb: 10, // 10 GB free per month
      maxClassAOperationsPerMonth: 1000000, // 1,000,000 writes free
      maxClassBOperationsPerMonth: 10000000, // 10,000,000 reads free
      costUsd: 0.0,
    },
    cloudflareWorkers: {
      maxRequestsPerDay: 100000, // 100k requests/day free
      maxCpuTimePerRequestMs: 10, // 10ms CPU time
      costUsd: 0.0,
    },
  };

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      latencyMs: dbLatencyMs,
      totalRows,
      tableCounts: rowCounts,
    },
    queue: {
      pending: pendingJobsCount ?? 0,
      failed: failedJobsCount ?? 0,
    },
    quotas,
    costOptimizationRecommendations: [
      'Store all binary files (resumes, avatars) exclusively in Cloudflare R2 rather than DB bytea.',
      'Background job records are auto-pruned after 7 days to preserve Supabase 500MB free quota.',
      'Use direct Supabase connection pooling (port 6543) in serverless environments to minimize connection overhead.',
      'Evaluate Neon serverless PostgreSQL when autoscaling to zero or branching is needed.',
    ],
  };
}

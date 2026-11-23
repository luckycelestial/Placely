import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { getInfrastructureMetrics } from '../src/server/services/infrastructure';
import { serverDb } from '../src/lib/server-db';

const prisma = new PrismaClient();

test('Smoke Test: Database Connectivity and RLS Audit', async () => {
  // 1. Query RLS on public tables via Prisma raw query
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string; rowsecurity: boolean }>>(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
  );

  assert.ok(Array.isArray(tables));
  assert.ok(tables.length > 0, 'Must have public tables');

  // Verify all audited application tables have RLS enabled
  const criticalTables = [
    'users',
    'students',
    'job_drives',
    'applications',
    'offers',
    'student_documents',
    'background_jobs',
    'admin_tasks',
    'notice_rsvps',
    'placement_history',
    'student_projects',
  ];

  for (const tableName of criticalTables) {
    const tableInfo = tables.find((t) => t.tablename === tableName);
    if (tableInfo) {
      assert.equal(
        tableInfo.rowsecurity,
        true,
        `Table ${tableName} must have Row Level Security enabled`
      );
    }
  }

  // 2. Query application table via Supabase client
  const { data: students, error } = await serverDb
    .from('students')
    .select('id')
    .limit(1);

  assert.ok(!error, `Supabase client error: ${error?.message}`);
  assert.ok(Array.isArray(students));
});

test('Smoke Test: Infrastructure Metrics & Free Tier Budget Checks', async () => {
  const metrics = await getInfrastructureMetrics();
  assert.equal(metrics.status, 'healthy');
  assert.ok(typeof metrics.database.latencyMs === 'number');
  assert.ok(metrics.database.totalRows >= 0);
  assert.ok(metrics.quotas.supabase.usagePercent <= 100);
  assert.equal(metrics.quotas.cloudflareR2.costUsd, 0.0);
  assert.equal(metrics.quotas.cloudflareWorkers.costUsd, 0.0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueJob, claimPendingJobs, executeJob } from '../src/server/services/queue';
import { serverDb } from '../src/lib/server-db';

test('Queue Service: Enqueue and claim a pending job', async () => {
  const testPayload = {
    url: 'http://127.0.0.1:9999/webhook-test',
    event: 'test_event',
    data: { hello: 'world' },
  };

  const job = await enqueueJob('DISPATCH_WEBHOOK', testPayload, { maxAttempts: 2 });
  assert.ok(job);
  assert.equal(job.job_type, 'DISPATCH_WEBHOOK');
  assert.equal(job.status, 'pending');
  assert.equal(job.max_attempts, 2);

  // Claim job
  const claimed = await claimPendingJobs(20);
  const matched = claimed.find((j: any) => j.id === job.id);
  assert.ok(matched, 'Job should be successfully claimed');
  assert.equal(matched.status, 'running');
  assert.equal(matched.attempts, 1);

  // Clean up
  await serverDb.from('background_jobs').delete().eq('id', job.id);
});

test('Queue Service: Retry and exponential backoff on failure', async () => {
  const badWebhookPayload = {
    url: 'http://invalid-nonexistent-domain-xyz.local/webhook',
    event: 'failure_test',
    data: {},
  };

  const job = await enqueueJob('DISPATCH_WEBHOOK', badWebhookPayload, { maxAttempts: 3 });
  assert.ok(job);

  // Execute failure attempt 1
  const result1 = await executeJob({
    id: job.id,
    job_type: 'DISPATCH_WEBHOOK',
    payload: badWebhookPayload,
    attempts: 1,
    max_attempts: 3,
  });

  assert.equal(result1.success, false);

  const { data: jobAfterAttempt1 } = await serverDb
    .from('background_jobs')
    .select('status, scheduled_for, error')
    .eq('id', job.id)
    .single();

  assert.equal(jobAfterAttempt1?.status, 'pending');
  assert.ok(jobAfterAttempt1?.scheduled_for);
  const scheduledTime = new Date(
    jobAfterAttempt1.scheduled_for.endsWith('Z')
      ? jobAfterAttempt1.scheduled_for
      : jobAfterAttempt1.scheduled_for + 'Z'
  ).getTime();
  assert.ok(scheduledTime > Date.now());

  // Execute exhaustion attempt 3
  const resultExhausted = await executeJob({
    id: job.id,
    job_type: 'DISPATCH_WEBHOOK',
    payload: badWebhookPayload,
    attempts: 3,
    max_attempts: 3,
  });

  assert.equal(resultExhausted.success, false);

  const { data: jobExhausted } = await serverDb
    .from('background_jobs')
    .select('status, error')
    .eq('id', job.id)
    .single();

  assert.equal(jobExhausted?.status, 'failed');
  assert.ok(jobExhausted?.error);

  // Cleanup
  await serverDb.from('background_jobs').delete().eq('id', job.id);
});

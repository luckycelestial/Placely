import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as rpcHandler } from '../src/app/api/rpc/route';
import { POST as uploadHandler, GET as uploadGetHandler } from '../src/app/api/upload/route';
import { executeJob, enqueueJob } from '../src/server/services/queue';
import { serverDb } from '../src/lib/server-db';

test('Authorization: Non-admin users cannot call enqueueJob via RPC', async () => {
  // 1. Unauthenticated
  const reqUnauth = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'enqueueJob',
      args: ['DRIVE_DEADLINE_SYNC', {}],
    }),
  });
  const resUnauth = await rpcHandler(reqUnauth);
  assert.equal(resUnauth.status, 401);

  // 2. Student role
  const reqStudent = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': '00000000-0000-0000-0000-000000000001',
    },
    body: JSON.stringify({
      action: 'enqueueJob',
      args: ['DRIVE_DEADLINE_SYNC', {}],
    }),
  });
  const resStudent = await rpcHandler(reqStudent);
  assert.equal(resStudent.status, 403);
  const data = await resStudent.json();
  assert.match(data.error, /Forbidden: Admin privileges required/);
});

test('Authorization: Student cannot mutate another student projects or documents', async () => {
  const studentA = '00000000-0000-0000-0000-000000000001';
  const foreignProjectId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const foreignDocId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  // Attempt to delete foreign project as studentA
  const reqProject = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': studentA,
    },
    body: JSON.stringify({
      action: 'deleteStudentProject',
      args: [foreignProjectId],
    }),
  });
  const resProject = await rpcHandler(reqProject);
  assert.equal(resProject.status, 403);

  // Attempt to delete foreign document as studentA
  const reqDoc = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': studentA,
    },
    body: JSON.stringify({
      action: 'deleteStudentDocument',
      args: [foreignDocId],
    }),
  });
  const resDoc = await rpcHandler(reqDoc);
  assert.equal(resDoc.status, 403);
});

test('Security: Outbound webhook destination restricts private IPs and metadata endpoints', async () => {
  const forbiddenDestinations = [
    'http://localhost:8080/callback',
    'http://127.0.0.1:3000/webhook',
    'http://169.254.169.254/latest/meta-data/',
    'http://192.168.1.1/admin',
    'http://10.0.0.1/internal',
    'http://internal-service.local/hook',
  ];

  for (const url of forbiddenDestinations) {
    const fakeJob = {
      id: crypto.randomUUID(),
      job_type: 'DISPATCH_WEBHOOK',
      payload: { url, event: 'test', data: {} },
      attempts: 1,
      max_attempts: 1,
    };

    const res = await executeJob(fakeJob as any);
    assert.equal(res.success, false);
    assert.match(res.error || '', /restricted for security|Unsupported webhook protocol/);
  }
});

test('Storage Security: R2 Private Document Download requires authentication and ownership', async () => {
  // 1. Unauthenticated GET request to /api/upload
  const reqUnauth = new NextRequest('http://localhost:3000/api/upload?key=resumes/test-student/resume.pdf');
  const resUnauth = await uploadGetHandler(reqUnauth);
  assert.equal(resUnauth.status, 401);

  // 2. Student requesting another student resume
  const reqStudentOther = new NextRequest('http://localhost:3000/api/upload?key=resumes/student-victim/resume.pdf', {
    headers: {
      'x-placely-student-id': 'student-attacker',
    },
  });
  const resStudentOther = await uploadGetHandler(reqStudentOther);
  assert.equal(resStudentOther.status, 403);

  // 3. Path traversal attack
  const reqTraversal = new NextRequest('http://localhost:3000/api/upload?key=../secret.txt', {
    headers: {
      'x-placely-admin-email': 'admin@placely.test',
    },
  });
  const resTraversal = await uploadGetHandler(reqTraversal);
  assert.equal(resTraversal.status, 400);
});

test('Deadline Scheduler: DRIVE_DEADLINE_SYNC closes expired drives using application_end', async () => {
  const nowIso = new Date().toISOString();
  // 1. Create a temporary expired drive
  const testCompanyId = crypto.randomUUID();
  const compInsert = await serverDb.from('companies').insert([{
    id: testCompanyId,
    name: 'Deadline Test Co',
    updated_at: nowIso,
  }]);
  assert.equal(compInsert.error, null);

  const testDriveId = crypto.randomUUID();
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago

  const driveInsert = await serverDb.from('job_drives').insert([{
    id: testDriveId,
    company_id: testCompanyId,
    title: 'Expired Drive Test',
    role_title: 'Software Engineer',
    drive_type: 'Full-time',
    status: 'active',
    application_end: pastDate,
    updated_at: nowIso,
  }]);
  assert.equal(driveInsert.error, null);

  // 2. Execute DRIVE_DEADLINE_SYNC job
  const syncJob = {
    id: crypto.randomUUID(),
    job_type: 'DRIVE_DEADLINE_SYNC',
    payload: {},
    attempts: 1,
    max_attempts: 1,
  };

  const syncResult = await executeJob(syncJob as any);
  assert.equal(syncResult.success, true);

  // 3. Verify drive was closed
  const { data: driveAfter } = await serverDb
    .from('job_drives')
    .select('status')
    .eq('id', testDriveId)
    .single();

  assert.equal(driveAfter?.status, 'closed');

  // Clean up
  await serverDb.from('job_drives').delete().eq('id', testDriveId);
  await serverDb.from('companies').delete().eq('id', testCompanyId);
});

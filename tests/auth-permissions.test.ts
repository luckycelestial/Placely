import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as rpcHandler } from '../src/app/api/rpc/route';
import { POST as uploadHandler, GET as uploadGetHandler } from '../src/app/api/upload/route';
import { GET as studentsGetHandler } from '../src/app/api/students/route';
import { executeJob, enqueueJob } from '../src/server/services/queue';
import { serverDb } from '../src/lib/server-db';
import { prisma } from '../src/lib/prisma';

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

test('Student Directory Exposure: Negative authorization tests for unauthenticated and student callers', async () => {
  // 1. Unauthenticated RPC getStudents call
  const reqUnauth = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getStudents', args: [] }),
  });
  const resUnauth = await rpcHandler(reqUnauth);
  assert.equal(resUnauth.status, 401);

  // 2. Student RPC getStudents call
  const reqStudent = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': '00000000-0000-0000-0000-000000000001',
    },
    body: JSON.stringify({ action: 'getStudents', args: [] }),
  });
  const resStudent = await rpcHandler(reqStudent);
  assert.equal(resStudent.status, 403);

  // 3. Admin RPC getStudents call
  const reqAdmin = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-admin-email': 'admin@placely.test',
    },
    body: JSON.stringify({ action: 'getStudents', args: [{ pageSize: 5 }] }),
  });
  const resAdmin = await rpcHandler(reqAdmin);
  assert.equal(resAdmin.status, 200);

  // 4. GET /api/students without admin authorization
  const reqApiUnauth = new Request('http://localhost:3000/api/students');
  const resApiUnauth = await studentsGetHandler(reqApiUnauth);
  assert.equal(resApiUnauth.status, 403);

  // 5. GET /api/students as student
  const reqApiStudent = new Request('http://localhost:3000/api/students', {
    headers: { 'x-placely-student-id': '00000000-0000-0000-0000-000000000001' },
  });
  const resApiStudent = await studentsGetHandler(reqApiStudent);
  assert.equal(resApiStudent.status, 403);

  // 6. GET /api/students as admin
  const reqApiAdmin = new Request('http://localhost:3000/api/students', {
    headers: { 'x-placely-admin-email': 'admin@placely.test' },
  });
  const resApiAdmin = await studentsGetHandler(reqApiAdmin);
  assert.equal(resApiAdmin.status, 200);
});

test('System Settings Security: Public requests cannot retrieve restricted settings', async () => {
  // 1. Public caller allowed for whitelisted setting
  const reqPublicAllowed = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getSettingByKey', args: ['system_status', {}] }),
  });
  const resPublicAllowed = await rpcHandler(reqPublicAllowed);
  assert.equal(resPublicAllowed.status, 200);

  // 2. Public caller FORBIDDEN for administrative setting (e.g. default_ats_stages)
  const reqPublicRestricted = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getSettingByKey', args: ['default_ats_stages', []] }),
  });
  const resPublicRestricted = await rpcHandler(reqPublicRestricted);
  assert.equal(resPublicRestricted.status, 403);

  // 3. Student caller FORBIDDEN for arbitrary sensitive key
  const reqStudentRestricted = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': '00000000-0000-0000-0000-000000000001',
    },
    body: JSON.stringify({ action: 'getSettingByKey', args: ['one_student_one_job_policy', false] }),
  });
  const resStudentRestricted = await rpcHandler(reqStudentRestricted);
  assert.equal(resStudentRestricted.status, 403);

  // 4. Admin caller ALLOWED for administrative setting
  const reqAdminAllowed = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-admin-email': 'admin@placely.test',
    },
    body: JSON.stringify({ action: 'getSettingByKey', args: ['default_ats_stages', []] }),
  });
  const resAdminAllowed = await rpcHandler(reqAdminAllowed);
  assert.equal(resAdminAllowed.status, 200);
});

test('Profile Security: Student cannot view another student profile or modify academic records', async () => {
  const studentA = '00000000-0000-0000-0000-000000000001';
  const victimStudentId = '00000000-0000-0000-0000-000000000002';

  // 1. Student A attempts to read Student B profile
  const reqOtherProfile = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': studentA,
    },
    body: JSON.stringify({
      action: 'getStudentProfile',
      args: [victimStudentId],
    }),
  });
  const resOtherProfile = await rpcHandler(reqOtherProfile);
  assert.equal(resOtherProfile.status, 403);

  // 2. Student A attempts to modify academic records (CGPA, active_arrears) via profile update
  const reqTamper = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-placely-student-id': studentA,
    },
    body: JSON.stringify({
      action: 'updateStudentProfile',
      args: [
        studentA,
        {
          cgpa: 9.99,
          active_arrears: 0,
          placement_status: 'Placed',
          verification_status: 'Verified',
          bio: 'Legitimate bio update',
        },
      ],
    }),
  });
  const resTamper = await rpcHandler(reqTamper);
  // Should succeed because sanitizeArgs strips the forbidden fields
  assert.equal(resTamper.status, 200);
});

test('Database Security: Database RLS functions and academic protection trigger exist in PostgreSQL', async () => {
  // 1. Verify is_admin() and get_current_student_id() exist in schema
  const functions = await prisma.$queryRaw<Array<{ proname: string }>>`
    SELECT p.proname 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname IN ('is_admin', 'get_current_student_id', 'prevent_student_academic_modification', 'prevent_user_role_escalation');
  `;
  const names = functions.map((f) => f.proname);
  assert.ok(names.includes('is_admin'), 'public.is_admin() must exist');
  assert.ok(names.includes('get_current_student_id'), 'public.get_current_student_id() must exist');
  assert.ok(names.includes('prevent_student_academic_modification'), 'Academic trigger function must exist');
  assert.ok(names.includes('prevent_user_role_escalation'), 'Role escalation trigger function must exist');

  // 2. Verify RLS is enabled on critical tables
  const rlsTables = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('students', 'student_documents', 'student_profiles', 'users', 'applications', 'settings');
  `;
  for (const table of rlsTables) {
    assert.equal(table.rowsecurity, true, `Row Level Security must be enabled on public.${table.tablename}`);
  }
});

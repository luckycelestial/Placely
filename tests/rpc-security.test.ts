import test from 'node:test';
import assert from 'node:assert/strict';

// Import route handler
import { POST } from '../src/app/api/rpc/route';

test('RPC Security: Rejects request with missing action name', async () => {
  const req = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Action name is required/);
});

test('RPC Security: Rejects unregistered arbitrary / internal actions (HTTP 403)', async () => {
  const forbiddenActions = [
    'executeServerQuery',
    'updateTableCell',
    'upsertTableData',
    'getTableData',
    'getTableCount',
    'runJobProcessingCycle',
    'claimPendingJobs',
    'executeJob',
    'arbitraryDatabaseDump',
  ];

  for (const action of forbiddenActions) {
    const req = new Request('http://localhost:3000/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args: [] }),
    });

    const res = await POST(req);
    assert.equal(res.status, 403, `Action ${action} should return 403`);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /not permitted|forbidden|restricted/i);
  }
});

test('RPC Security: Authenticated endpoints reject unauthenticated requests (HTTP 401)', async () => {
  const authenticatedActions = [
    'getDrives',
    'getStudentApplications',
    'applyToDrive',
    'getStudentOffers',
    'createStudent',
    'deleteStudent',
    'updateDrive',
  ];

  for (const action of authenticatedActions) {
    const req = new Request('http://localhost:3000/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args: ['dummy-id'] }),
    });

    const res = await POST(req);
    assert.equal(res.status, 401, `Action ${action} without session must return 401`);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Authentication required/i);
  }
});

test('RPC Security: Public actions are allowed without session', async () => {
  const req = new Request('http://localhost:3000/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getSettingByKey', args: ['system_status'] }),
  });

  const res = await POST(req);
  // Setting may be null or object, but status should not be 401 or 403
  assert.notEqual(res.status, 401);
  assert.notEqual(res.status, 403);
});

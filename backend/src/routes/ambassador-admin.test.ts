import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import pool from '../db';

jest.mock('../db', () => ({ query: jest.fn(), connect: jest.fn() }));

const mockQuery = pool.query as jest.Mock;
const mockConnect = pool.connect as jest.Mock;

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function makeToken(role: string) {
  return jwt.sign({ sub: 'user-uuid-1', role, name: 'Test User' }, JWT_SECRET, { expiresIn: '1h' });
}

const ambassadorAdminToken = makeToken('ambassador_admin');
const adminToken = makeToken('admin');
const ambassadorToken = makeToken('ambassador');
const memberToken = makeToken('member');

beforeEach(() => jest.clearAllMocks());

// ─── requireAmbassadorAdmin middleware ───────────────────────────────────────

describe('requireAmbassadorAdmin middleware', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/ambassador-admin/ambassadors');
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    const res = await request(app)
      .get('/ambassador-admin/ambassadors')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for ambassador role', async () => {
    const res = await request(app)
      .get('/ambassador-admin/ambassadors')
      .set('Authorization', `Bearer ${ambassadorToken}`);
    expect(res.status).toBe(403);
  });

  it('allows ambassador_admin role', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/ambassador-admin/ambassadors')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`);
    expect(res.status).toBe(200);
  });

  it('allows admin role (superadmin access)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/ambassador-admin/ambassadors')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ─── Scope isolation ─────────────────────────────────────────────────────────

describe('GET /ambassador-admin/ambassadors — scope isolation', () => {
  it('returns only ambassador-role users', async () => {
    const ambassadors = [
      { id: 'a1', name: 'Alice', email: 'alice@test.com', role: 'ambassador', role_title: null, points: 100, avatar_url: null, created_at: new Date().toISOString() },
      { id: 'a2', name: 'Bob', email: 'bob@test.com', role: 'ambassador', role_title: null, points: 50, avatar_url: null, created_at: new Date().toISOString() },
    ];
    mockQuery.mockResolvedValueOnce({ rows: ambassadors });

    const res = await request(app)
      .get('/ambassador-admin/ambassadors')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((u: any) => expect(u.role).toBe('ambassador'));
  });
});

// ─── Silent point deduction ──────────────────────────────────────────────────

describe('POST /ambassador-admin/ambassadors/:id/adjust-points — silent deduction', () => {
  it('adjusts points without inserting a notification', async () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockConnect.mockResolvedValueOnce(mockClient);

    // BEGIN
    mockClient.query.mockResolvedValueOnce({});
    // SELECT ambassador
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'amb-1', name: 'Alice', points: 100 }] });
    // INSERT point_transactions
    mockClient.query.mockResolvedValueOnce({});
    // UPDATE users
    mockClient.query.mockResolvedValueOnce({});
    // COMMIT
    mockClient.query.mockResolvedValueOnce({});
    // SELECT updated user
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'amb-1', name: 'Alice', points: 95 }] });

    const res = await request(app)
      .post('/ambassador-admin/ambassadors/amb-1/adjust-points')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`)
      .send({ delta: -5, reason: 'Late submission' });

    expect(res.status).toBe(200);
    expect(res.body.points).toBe(95);

    // Verify NO notification was inserted — check that none of the client.query calls
    // contain an INSERT INTO notifications
    const allCalls = mockClient.query.mock.calls.map((c: any[]) => (typeof c[0] === 'string' ? c[0] : ''));
    const notificationInserts = allCalls.filter((q: string) => q.toLowerCase().includes('notifications'));
    expect(notificationInserts).toHaveLength(0);
  });

  it('returns 400 when delta is 0', async () => {
    const res = await request(app)
      .post('/ambassador-admin/ambassadors/amb-1/adjust-points')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`)
      .send({ delta: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when user is not an ambassador', async () => {
    const mockClient = { query: jest.fn(), release: jest.fn() };
    mockConnect.mockResolvedValueOnce(mockClient);
    mockClient.query.mockResolvedValueOnce({}); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT — not found
    mockClient.query.mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post('/ambassador-admin/ambassadors/non-ambassador/adjust-points')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`)
      .send({ delta: -5 });
    expect(res.status).toBe(404);
  });
});

// ─── Pending task removal ────────────────────────────────────────────────────

describe('DELETE /ambassador-admin/tasks/:id — pending task removal', () => {
  it('deletes a pending ambassador task', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'task-1', status: 'pending', submitted_by: 'amb-1', role: 'ambassador' }] })
      .mockResolvedValueOnce({ rows: [] }); // DELETE

    const res = await request(app)
      .delete('/ambassador-admin/tasks/task-1')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.task_id).toBe('task-1');
  });

  it('returns 400 when task is not pending', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'task-2', status: 'assigned', submitted_by: 'amb-1', role: 'ambassador' }] });

    const res = await request(app)
      .delete('/ambassador-admin/tasks/task-2')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pending/i);
  });

  it('returns 404 when task belongs to a non-ambassador', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // INNER JOIN filters it out

    const res = await request(app)
      .delete('/ambassador-admin/tasks/task-3')
      .set('Authorization', `Bearer ${ambassadorAdminToken}`);

    expect(res.status).toBe(404);
  });
});

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import pool from '../db';

jest.mock('../db', () => ({
  query: jest.fn(),
}));

const mockQuery = pool.query as jest.Mock;

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function makeToken(role: 'admin' | 'member' | 'ambassador' = 'member', sub = 'user-uuid-1') {
  return jwt.sign({ sub, role, name: 'Alice' }, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /tasks', () => {
  it('returns 201 with the created task on valid submission', async () => {
    const mockTask = {
      id: 'task-uuid-1',
      description: 'Write unit tests',
      submitted_by: 'user-uuid-1',
      status: 'pending',
      submitted_at: new Date().toISOString(),
      screenshot_url: null,
      task_link: null,
    };
    // Mock the insert query (no duplicate check when task_link is not provided)
    mockQuery.mockResolvedValueOnce({ rows: [mockTask] });

    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken()}`)
      .send({ description: 'Write unit tests' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      description: 'Write unit tests',
      status: 'pending',
      submitted_by: 'user-uuid-1',
    });
  });

  it('returns 409 when submitting duplicate task_link', async () => {
    // Mock finding an existing task with the same link
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-task-id' }] });

    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken()}`)
      .send({ description: 'Duplicate task', task_link: 'https://example.com/task1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already submitted');
  });

  it('returns 400 when description is empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken()}`)
      .send({ description: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 400 when description is whitespace-only', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken()}`)
      .send({ description: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 403 when admin tries to submit a task', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken('admin')}`)
      .send({ description: 'Admin task' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Admins do not submit tasks');
  });

  it('returns 401 when no auth cookie is provided', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'Some task' });

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

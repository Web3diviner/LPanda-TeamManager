import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import pool from '../db';

jest.mock('../db', () => ({
  query: jest.fn(),
}));

const mockQuery = pool.query as jest.Mock;

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

function makeToken(role: 'admin' | 'member' = 'member', sub = 'user-uuid-1') {
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
    };
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

  it('returns 400 when description is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 401 when no auth cookie is provided', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'Some task' });

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 500 when the database throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/tasks')
      .set('Cookie', `token=${makeToken()}`)
      .send({ description: 'Valid task' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../index';
import pool from '../db';

// Mock the DB pool so tests don't need a real PostgreSQL instance
jest.mock('../db', () => ({
  query: jest.fn(),
}));

const mockQuery = pool.query as jest.Mock;

const VALID_HASH = bcrypt.hashSync('correct-password', 10);

const MOCK_USER = {
  id: 'user-uuid-1',
  name: 'Alice',
  email: 'alice@example.com',
  password: VALID_HASH,
  role: 'member',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/login', () => {
  it('returns 200 with user info and sets an HTTP-only cookie on valid credentials', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_USER] });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: MOCK_USER.id,
      name: MOCK_USER.name,
      email: MOCK_USER.email,
      role: MOCK_USER.role,
    });
    // Password must NOT be returned
    expect(res.body.password).toBeUndefined();

    // HTTP-only cookie must be set
    const setCookie = res.headers['set-cookie'] as string[] | string;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieStr).toMatch(/token=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });

  it('returns 401 when the password is wrong', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_USER] });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns 401 when the user does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'any-password' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns 400 when the request body is missing required fields', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com' }); // missing password

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when email is not a valid email address', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'some-password' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 when the database throws an unexpected error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'correct-password' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /auth/logout', () => {
  it('returns 200 and clears the token cookie', async () => {
    const res = await request(app).post('/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    // The Set-Cookie header should clear the token (expires in the past or Max-Age=0)
    const setCookie = res.headers['set-cookie'] as string[] | string | undefined;
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie ?? '');
    expect(cookieStr).toMatch(/token=/);
    // supertest surfaces the cleared cookie; value should be empty
    expect(cookieStr).toMatch(/token=;|token=(?:;|$)/);
  });
});

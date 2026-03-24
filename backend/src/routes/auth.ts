import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '8h';

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email],
    );

    const user = result.rows[0];

    // Use a constant-time comparison even when user is not found to prevent timing attacks
    const passwordToCheck = user?.password ?? '$2b$10$invalidhashfortimingprotection000000000000000000000';
    const match = await bcrypt.compare(password, passwordToCheck);

    if (!user || !match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const payload = { sub: user.id, role: user.role, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
    });

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(200).json({ message: 'Logged out' });
});

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'member']).default('member'),
});

// POST /auth/register — Admin only; create a new user account
router.post('/register', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'A user with that email already exists' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO users (id, name, email, password, role, points, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, now())
       RETURNING id, name, email, role`,
      [id, name, email, hash, role],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/users — Admin only; list all users
router.get('/users', authMiddleware, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, role_title, points, created_at FROM users ORDER BY created_at ASC',
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /auth/users/:id — Admin only; update role_title
router.patch('/users/:id', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role_title } = req.body;
  if (typeof role_title !== 'string') {
    res.status(400).json({ error: 'role_title must be a string' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE users SET role_title = $1 WHERE id = $2 RETURNING id, name, email, role, role_title, points`,
      [role_title.trim() || null, id],
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /auth/users/:id — Admin only; delete a user account and all related data
router.delete('/users/:id', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminId = req.user!.sub;
  if (id === adminId) {
    res.status(400).json({ error: 'You cannot delete your own account' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check user exists
    const check = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) { await client.query('ROLLBACK'); res.status(404).json({ error: 'User not found' }); return; }
    // Delete all related data in dependency order
    await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    await client.query('DELETE FROM feedback WHERE user_id = $1', [id]);
    await client.query('DELETE FROM point_transactions WHERE user_id = $1', [id]);
    await client.query('DELETE FROM delegated_tasks WHERE assigned_to = $1 OR created_by = $1', [id]);
    await client.query('DELETE FROM task_timers WHERE created_by = $1', [id]);
    await client.query('DELETE FROM announcements WHERE author_id = $1', [id]);
    // Nullify task references instead of deleting tasks (preserve task history)
    await client.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [id]);
    await client.query('UPDATE tasks SET submitted_by = NULL WHERE submitted_by = $1', [id]);
    // Finally delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;

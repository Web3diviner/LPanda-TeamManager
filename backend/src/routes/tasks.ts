import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { PointsService } from '../services/points';

const router = Router();

const CreateTaskSchema = z.object({
  description: z.string().min(1).refine((s) => s.trim().length > 0),
  screenshot_url: z.string().optional().nullable(),
  task_link: z.string().url().optional().nullable().or(z.literal('')),
});

const AssignTaskSchema = z.object({
  assigned_to: z.string().uuid(),
  deadline: z.string().min(1),
});

// ── IMPORTANT: static routes BEFORE /:id ──────────────────────────────────────

// GET /tasks/assignment-counts — Admin: task counts per member
router.get('/assignment-counts', authMiddleware, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name,
              COUNT(t.id) FILTER (WHERE t.status = 'assigned')  AS assigned,
              COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed,
              COUNT(t.id) FILTER (WHERE t.status = 'missed')    AS missed,
              COUNT(t.id) FILTER (WHERE t.status = 'pending')   AS pending
       FROM users u
       LEFT JOIN tasks t ON t.assigned_to = u.id
       WHERE u.role IN ('member', 'ambassador')
       GROUP BY u.id, u.name
       ORDER BY u.name ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Assignment counts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /tasks — Return tasks with submitter and assignee names
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    let result;
    if (user.role === 'admin') {
      result = await pool.query(
        `SELECT t.id, t.description, t.status, t.deadline, t.submitted_at, t.completed_at,
                t.screenshot_url, t.task_link,
                t.submitted_by, su.name AS submitted_by_name,
                t.assigned_to, au.name AS assigned_to_name
         FROM tasks t
         LEFT JOIN users su ON su.id = t.submitted_by
         LEFT JOIN users au ON au.id = t.assigned_to
         ORDER BY t.submitted_at DESC`,
      );
    } else {
      result = await pool.query(
        `SELECT t.id, t.description, t.status, t.deadline, t.submitted_at, t.completed_at,
                t.screenshot_url, t.task_link,
                t.submitted_by, su.name AS submitted_by_name,
                t.assigned_to, au.name AS assigned_to_name
         FROM tasks t
         LEFT JOIN users su ON su.id = t.submitted_by
         LEFT JOIN users au ON au.id = t.assigned_to
         WHERE t.submitted_by = $1 OR t.assigned_to = $1
         ORDER BY t.submitted_at DESC`,
        [user.sub],
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks — Members only
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  if (req.user!.role === 'admin') {
    res.status(403).json({ error: 'Admins do not submit tasks.' });
    return;
  }
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }
  const { description, screenshot_url, task_link } = parsed.data;
  const submittedBy = req.user!.sub;
  const id = randomUUID();
  try {
    const result = await pool.query(
      `INSERT INTO tasks (id, description, submitted_by, status, submitted_at, screenshot_url, task_link)
       VALUES ($1, $2, $3, 'pending', now(), $4, $5)
       RETURNING id, description, submitted_by, status, submitted_at, screenshot_url, task_link`,
      [id, description, submittedBy, screenshot_url ?? null, task_link || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Task submission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /tasks/:id/assign — Admin assigns a submitted task
router.patch('/:id/assign', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = AssignTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }
  const { assigned_to, deadline } = parsed.data;
  const { id } = req.params;
  try {
    const taskResult = await pool.query('SELECT id, status, description FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) { res.status(404).json({ error: 'Task not found' }); return; }
    const task = taskResult.rows[0];
    if (task.status === 'completed' || task.status === 'missed') {
      res.status(409).json({ error: 'Cannot reassign a completed or missed task' }); return;
    }
    const result = await pool.query(
      `UPDATE tasks SET assigned_to=$1, deadline=$2, status='assigned' WHERE id=$3
       RETURNING id, description, submitted_by, assigned_to, deadline, status, submitted_at, screenshot_url, task_link`,
      [assigned_to, deadline, id],
    );
    // Notify the assignee
    await pool.query(
      `INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`,
      [randomUUID(), assigned_to, `📌 You have been assigned a task: "${task.description}"`],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Task assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /tasks/:id/confirm — Admin confirms a submitted task and awards points
router.patch('/:id/confirm', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const taskResult = await client.query(
      'SELECT id, submitted_by, assigned_to, deadline, status, description FROM tasks WHERE id = $1 FOR UPDATE', [id],
    );
    if (taskResult.rows.length === 0) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Task not found' }); return; }
    const task = taskResult.rows[0];
    if (task.status === 'completed') { await client.query('ROLLBACK'); res.status(409).json({ error: 'Task is already completed' }); return; }
    if (task.status === 'missed') { await client.query('ROLLBACK'); res.status(409).json({ error: 'Cannot confirm a missed task' }); return; }

    const completedAt = new Date();
    const updateResult = await client.query(
      `UPDATE tasks SET status='completed', completed_at=$1 WHERE id=$2
       RETURNING id, description, submitted_by, assigned_to, deadline, status, submitted_at, completed_at`,
      [completedAt, id],
    );

    // Award points to whoever submitted the task
    const recipientId = task.submitted_by;
    if (recipientId) {
      await PointsService.award(recipientId, id, client);
      // Notify the member
      await client.query(
        `INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`,
        [randomUUID(), recipientId, `✅ Your task "${task.description}" has been confirmed! Points awarded.`],
      );
    }

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Task confirm error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;

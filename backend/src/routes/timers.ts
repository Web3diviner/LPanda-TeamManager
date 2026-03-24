import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

const TimerSchema = z.object({
  label: z.string().min(1),
  ends_at: z.string().min(1),
});

// GET /timers — all active timers (everyone)
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.label, t.ends_at, t.active, t.created_at, u.name AS created_by_name
       FROM task_timers t LEFT JOIN users u ON u.id = t.created_by
       WHERE t.active = true AND t.ends_at > now()
       ORDER BY t.ends_at ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get timers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /timers — admin creates a timer
router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = TimerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'label and ends_at are required' }); return; }
  try {
    const result = await pool.query(
      `INSERT INTO task_timers (id, label, ends_at, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [randomUUID(), parsed.data.label, parsed.data.ends_at, req.user!.sub],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create timer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /timers/:id — admin removes a timer
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(`UPDATE task_timers SET active=false WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete timer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

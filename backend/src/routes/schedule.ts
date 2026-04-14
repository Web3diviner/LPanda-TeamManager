import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

const ItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  day_of_week: z.enum(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']),
  time_slot: z.string().min(1),
});

// GET /schedule — all users can view
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name AS created_by_name FROM schedule_items s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY CASE s.day_of_week
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
       END, s.time_slot ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /schedule — admin only
router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = ItemSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() }); return; }
  const { title, description, day_of_week, time_slot } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO schedule_items (id, title, description, day_of_week, time_slot, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [randomUUID(), title, description ?? null, day_of_week, time_slot, req.user!.sub],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /schedule/:id — admin only
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM schedule_items WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ambassador-specific schedule routes
// GET /schedule/ambassador — ambassador schedule items
router.get('/ambassador', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name AS created_by_name FROM ambassador_schedule_items s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY CASE s.day_of_week
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
       END, s.time_slot ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get ambassador schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /schedule/ambassador — admin only, add ambassador schedule item
router.post('/ambassador', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = ItemSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() }); return; }
  const { title, description, day_of_week, time_slot } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO ambassador_schedule_items (id, title, description, day_of_week, time_slot, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [randomUUID(), title, description ?? null, day_of_week, time_slot, req.user!.sub],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create ambassador schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /schedule/ambassador/:id — admin only, remove ambassador schedule item
router.delete('/ambassador/:id', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM ambassador_schedule_items WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Schedule item not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete ambassador schedule error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

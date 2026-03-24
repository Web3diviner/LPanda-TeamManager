import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

const CreateAnnouncementSchema = z.object({
  content: z.string().min(1).refine((s) => s.trim().length > 0, {
    message: 'Content must not be empty or whitespace-only',
  }),
});

// GET /announcements — return all announcements ordered by created_at DESC
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.content, a.created_at, a.author_id, u.name AS author_name
       FROM announcements a
       JOIN users u ON u.id = a.author_id
       ORDER BY a.created_at DESC`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get announcements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /announcements — Admin only; create announcement
router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateAnnouncementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const { content } = parsed.data;
  const authorId = req.user!.sub;
  const id = randomUUID();

  try {
    const result = await pool.query(
      `INSERT INTO announcements (id, author_id, content, created_at)
       VALUES ($1, $2, $3, now())
       RETURNING id, author_id, content, created_at`,
      [id, authorId, content],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /announcements/:id — Admin only; delete announcement
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id',
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

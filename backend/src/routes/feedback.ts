import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

const FeedbackSchema = z.object({ message: z.string().min(1) });
const RemarkSchema = z.object({ admin_remark: z.string().min(1) });

// GET /feedback — admin sees all; members see their own
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    let result;
    if (req.user!.role === 'admin') {
      result = await pool.query(
        `SELECT f.id, f.message, f.admin_remark, f.created_at, u.name AS user_name
         FROM feedback f JOIN users u ON u.id=f.user_id
         ORDER BY f.created_at DESC`,
      );
    } else {
      result = await pool.query(
        `SELECT f.id, f.message, f.admin_remark, f.created_at
         FROM feedback f WHERE f.user_id=$1 ORDER BY f.created_at DESC`,
        [req.user!.sub],
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /feedback — member submits feedback
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const parsed = FeedbackSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Message is required' }); return; }
  try {
    const result = await pool.query(
      `INSERT INTO feedback (id, user_id, message) VALUES ($1,$2,$3) RETURNING *`,
      [randomUUID(), req.user!.sub, parsed.data.message],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Post feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /feedback/:id/remark — admin adds remark
router.patch('/:id/remark', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = RemarkSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Remark is required' }); return; }
  try {
    const result = await pool.query(
      `UPDATE feedback SET admin_remark=$1 WHERE id=$2 RETURNING *`,
      [parsed.data.admin_remark, req.params.id],
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Remark error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

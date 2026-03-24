import { Router, Request, Response } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /notifications — user's own notifications
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, message, read, created_at FROM notifications
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user!.sub],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /notifications/read-all — mark all as read
router.patch('/read-all', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(`UPDATE notifications SET read=true WHERE user_id=$1`, [req.user!.sub]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

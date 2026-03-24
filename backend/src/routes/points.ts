import { Router, Request, Response } from 'express';
import pool from '../db';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /points/me — current user's balance and transaction history
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub;

  try {
    const userResult = await pool.query(
      'SELECT points FROM users WHERE id = $1',
      [userId],
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const transactionsResult = await pool.query(
      `SELECT id, task_id, delta, reason, created_at
       FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    res.json({
      points: userResult.rows[0].points,
      transactions: transactionsResult.rows,
    });
  } catch (err) {
    console.error('Get points/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /points/leaderboard — all users ordered by points DESC, name ASC
router.get('/leaderboard', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, points
       FROM users
       ORDER BY points DESC, name ASC`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

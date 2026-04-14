import { Router, Request, Response } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /recap/weekly — aggregate point_transactions from the past 7 days
router.get('/weekly', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  try {
    // Overall totals for the past 7 days
    const totalsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE delta > 0) AS "totalCompleted",
         COALESCE(SUM(delta) FILTER (WHERE delta > 0), 0) AS "totalAwarded",
         COALESCE(ABS(SUM(delta) FILTER (WHERE delta < 0)), 0) AS "totalDeducted"
       FROM point_transactions
       WHERE created_at >= now() - INTERVAL '7 days'`,
    );

    const totals = totalsResult.rows[0];

    // Per-member breakdown joined with user names
    let perMemberResult;
    if (user.role === 'admin') {
      perMemberResult = await pool.query(
        `SELECT pt.user_id AS "userId", u.name, COALESCE(SUM(pt.delta), 0) AS "netChange"
         FROM point_transactions pt
         JOIN users u ON u.id = pt.user_id
         WHERE pt.created_at >= now() - INTERVAL '7 days'
         GROUP BY pt.user_id, u.name
         ORDER BY u.name ASC`,
      );
    } else {
      perMemberResult = await pool.query(
        `SELECT pt.user_id AS "userId", u.name, COALESCE(SUM(pt.delta), 0) AS "netChange"
         FROM point_transactions pt
         JOIN users u ON u.id = pt.user_id
         WHERE pt.created_at >= now() - INTERVAL '7 days'
           AND pt.user_id = $1
         GROUP BY pt.user_id, u.name`,
        [user.sub],
      );
    }

    res.json({
      totalCompleted: Number(totals.totalCompleted),
      totalAwarded: Number(totals.totalAwarded),
      totalDeducted: Number(totals.totalDeducted),
      perMember: perMemberResult.rows.map((r) => ({
        userId: r.userId,
        name: r.name,
        netChange: Number(r.netChange),
      })),
    });
  } catch (err) {
    console.error('Weekly recap error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /recap/ambassador-weekly — aggregate point_transactions from the past 7 days for ambassadors only
router.get('/ambassador-weekly', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  try {
    // Overall totals for ambassadors for the past 7 days
    const totalsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE pt.delta > 0) AS "totalCompleted",
         COALESCE(SUM(pt.delta) FILTER (WHERE pt.delta > 0), 0) AS "totalAwarded",
         COALESCE(ABS(SUM(pt.delta) FILTER (WHERE pt.delta < 0)), 0) AS "totalDeducted"
       FROM point_transactions pt
       JOIN users u ON u.id = pt.user_id
       WHERE pt.created_at >= now() - INTERVAL '7 days'
         AND u.role = 'ambassador'`,
    );

    const totals = totalsResult.rows[0];

    // Per-ambassador breakdown joined with user names
    let perMemberResult;
    if (user.role === 'admin') {
      perMemberResult = await pool.query(
        `SELECT pt.user_id AS "userId", u.name, COALESCE(SUM(pt.delta), 0) AS "netChange"
         FROM point_transactions pt
         JOIN users u ON u.id = pt.user_id
         WHERE pt.created_at >= now() - INTERVAL '7 days'
           AND u.role = 'ambassador'
         GROUP BY pt.user_id, u.name
         ORDER BY u.name ASC`,
      );
    } else {
      perMemberResult = await pool.query(
        `SELECT pt.user_id AS "userId", u.name, COALESCE(SUM(pt.delta), 0) AS "netChange"
         FROM point_transactions pt
         JOIN users u ON u.id = pt.user_id
         WHERE pt.created_at >= now() - INTERVAL '7 days'
           AND u.role = 'ambassador'
           AND pt.user_id = $1
         GROUP BY pt.user_id, u.name`,
        [user.sub],
      );
    }

    res.json({
      totalCompleted: Number(totals.totalCompleted),
      totalAwarded: Number(totals.totalAwarded),
      totalDeducted: Number(totals.totalDeducted),
      perMember: perMemberResult.rows.map((r) => ({
        userId: r.userId,
        name: r.name,
        netChange: Number(r.netChange),
      })),
    });
  } catch (err) {
    console.error('Ambassador weekly recap error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

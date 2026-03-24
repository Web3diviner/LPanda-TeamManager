import cron from 'node-cron';
import pool from './db';
import { PointsService } from './services/points';

async function processMissedDeadlines(): Promise<void> {
  // Query tasks that are 'assigned' and past their deadline (idempotent: skip 'missed')
  const result = await pool.query(
    `SELECT id, assigned_to FROM tasks
     WHERE status = 'assigned' AND deadline < now()`,
  );

  for (const task of result.rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Re-check status inside transaction to ensure idempotency
      const check = await client.query(
        `SELECT id, assigned_to, status FROM tasks WHERE id = $1 FOR UPDATE`,
        [task.id],
      );

      if (check.rows.length === 0 || check.rows[0].status !== 'assigned') {
        await client.query('ROLLBACK');
        continue;
      }

      await PointsService.deduct(task.assigned_to, task.id, client);

      await client.query(
        `UPDATE tasks SET status = 'missed' WHERE id = $1`,
        [task.id],
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Scheduler error processing task ${task.id}:`, err);
    } finally {
      client.release();
    }
  }
}

export function startScheduler(): void {
  cron.schedule('* * * * *', async () => {
    try {
      await processMissedDeadlines();
    } catch (err) {
      console.error('Scheduler run error:', err);
    }
  });
  console.log('Deadline scheduler started');
}

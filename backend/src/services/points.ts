import { PoolClient } from 'pg';
import { randomUUID } from 'crypto';

function autoRemark(delta: number): string {
  return delta >= 3 ? 'Satisfactory' : 'Fair';
}

export const PointsService = {
  async award(userId: string, taskId: string, client: PoolClient): Promise<void> {
    const delta = 3.0;
    const id = randomUUID();
    await client.query(
      `INSERT INTO point_transactions (id, user_id, task_id, delta, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [id, userId, taskId, delta, 'completion'],
    );
    await client.query(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, userId]);
    // Auto-remark on delegated task if applicable
    await client.query(
      `UPDATE delegated_tasks SET admin_remark=$1 WHERE id=$2 AND admin_remark IS NULL`,
      [autoRemark(delta), taskId],
    ).catch(() => { /* not a delegated task, ignore */ });
  },

  async deduct(userId: string, taskId: string, client: PoolClient): Promise<void> {
    const delta = -1.5;
    const id = randomUUID();
    await client.query(
      `INSERT INTO point_transactions (id, user_id, task_id, delta, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [id, userId, taskId, delta, 'missed_deadline'],
    );
    await client.query(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, userId]);
    await client.query(
      `UPDATE delegated_tasks SET admin_remark=$1 WHERE id=$2 AND admin_remark IS NULL`,
      [autoRemark(delta), taskId],
    ).catch(() => { /* not a delegated task, ignore */ });
  },
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const points_1 = require("../services/points");
const router = (0, express_1.Router)();
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// ─── Ambassadors ────────────────────────────────────────────────────────────
// GET /ambassador-admin/ambassadors — Get all ambassadors
router.get('/ambassadors', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT id, name, email, role, role_title, points, avatar_url, created_at
       FROM users
       WHERE role = 'ambassador'
       ORDER BY name ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get ambassadors error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /ambassador-admin/ambassadors/:id — Get ambassador profile
router.get('/ambassadors/:id', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query(`SELECT id, name, email, role, role_title, points, avatar_url, created_at
       FROM users
       WHERE id = $1 AND role = 'ambassador'`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Ambassador not found' });
            return;
        }
        const ambassador = result.rows[0];
        // Also fetch point transaction history
        const txResult = await db_1.default.query(`SELECT id, delta, reason, task_id, created_at
       FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC`, [id]);
        res.json({ ...ambassador, transactions: txResult.rows });
    }
    catch (err) {
        console.error('Get ambassador profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /ambassador-admin/ambassadors/:id — Delete ambassador account
router.delete('/ambassadors/:id', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const check = await client.query(`SELECT id FROM users WHERE id = $1 AND role = 'ambassador'`, [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Ambassador not found' });
            return;
        }
        await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await client.query('DELETE FROM feedback WHERE user_id = $1', [id]);
        await client.query('DELETE FROM point_transactions WHERE user_id = $1', [id]);
        await client.query('DELETE FROM delegated_tasks WHERE assigned_to = $1 OR created_by = $1', [id]);
        await client.query('DELETE FROM task_timers WHERE created_by = $1', [id]);
        await client.query('DELETE FROM announcements WHERE author_id = $1', [id]);
        await client.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [id]);
        await client.query('UPDATE tasks SET submitted_by = NULL WHERE submitted_by = $1', [id]);
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.status(204).send();
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete ambassador error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// POST /ambassador-admin/ambassadors/:id/adjust-points — SILENT point adjustment
router.post('/ambassadors/:id/adjust-points', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    const { delta, reason } = req.body;
    if (typeof delta !== 'number' || delta === 0) {
        res.status(400).json({ error: 'delta must be a non-zero number' });
        return;
    }
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const check = await client.query(`SELECT id, name, points FROM users WHERE id = $1 AND role = 'ambassador'`, [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Ambassador not found' });
            return;
        }
        const txReason = reason || (delta < 0 ? 'ambassador_admin_deduction' : 'ambassador_admin_award');
        await client.query(`INSERT INTO point_transactions (id, user_id, task_id, delta, reason, created_at) VALUES ($1,$2,NULL,$3,$4,now())`, [(0, crypto_1.randomUUID)(), id, delta, txReason]);
        await client.query(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, id]);
        // NO notification — silent operation
        await client.query('COMMIT');
        const updated = await db_1.default.query('SELECT id, name, points FROM users WHERE id = $1', [id]);
        res.json(updated.rows[0]);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Adjust points error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// ─── Tasks ───────────────────────────────────────────────────────────────────
// GET /ambassador-admin/pending-tasks — Get all pending tasks from ambassadors
router.get('/pending-tasks', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT t.id, t.description, t.status, t.deadline, t.submitted_at, t.completed_at,
              t.screenshot_url, t.task_link,
              t.submitted_by, su.name AS submitted_by_name,
              t.assigned_to, au.name AS assigned_to_name
       FROM tasks t
       INNER JOIN users su ON su.id = t.submitted_by
       LEFT JOIN users au ON au.id = t.assigned_to
       WHERE su.role = 'ambassador' AND t.status = 'pending'
       ORDER BY t.submitted_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get pending tasks error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /ambassador-admin/tasks — All ambassador tasks (all statuses)
router.get('/tasks', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT t.id, t.description, t.status, t.deadline, t.submitted_at, t.completed_at,
              t.screenshot_url, t.task_link,
              t.submitted_by, su.name AS submitted_by_name,
              t.assigned_to, au.name AS assigned_to_name
       FROM tasks t
       INNER JOIN users su ON su.id = t.submitted_by AND su.role = 'ambassador'
       LEFT JOIN users au ON au.id = t.assigned_to
       ORDER BY t.submitted_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get all ambassador tasks error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /ambassador-admin/tasks/:id/assign — Assign pending task to ambassador
router.post('/tasks/:id/assign', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    const { assigned_to, deadline } = req.body;
    if (!assigned_to || !deadline) {
        res.status(400).json({ error: 'assigned_to and deadline are required' });
        return;
    }
    try {
        const assigneeCheck = await db_1.default.query(`SELECT id, name FROM users WHERE id = $1 AND role = 'ambassador'`, [assigned_to]);
        if (assigneeCheck.rows.length === 0) {
            res.status(400).json({ error: 'assigned_to must be an ambassador' });
            return;
        }
        const taskResult = await db_1.default.query(`UPDATE tasks SET status = 'assigned', assigned_to = $1, deadline = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING *`, [assigned_to, deadline, id]);
        if (taskResult.rows.length === 0) {
            res.status(404).json({ error: 'Pending task not found' });
            return;
        }
        await db_1.default.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), assigned_to, `📋 A task has been assigned to you by the ambassador admin.`]);
        res.json(taskResult.rows[0]);
    }
    catch (err) {
        console.error('Assign task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /ambassador-admin/tasks/:id/confirm — Confirm/complete ambassador task
router.post('/tasks/:id/confirm', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const taskResult = await client.query(`SELECT t.*, su.role AS submitter_role, su.name AS submitter_name
       FROM tasks t
       INNER JOIN users su ON su.id = t.submitted_by
       WHERE t.id = $1 FOR UPDATE`, [id]);
        if (taskResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        const task = taskResult.rows[0];
        if (task.submitter_role !== 'ambassador') {
            await client.query('ROLLBACK');
            res.status(403).json({ error: 'Task submitter is not an ambassador' });
            return;
        }
        await client.query(`UPDATE tasks SET status = 'completed', completed_at = now() WHERE id = $1`, [id]);
        await points_1.PointsService.award(task.submitted_by, id, client);
        await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), task.submitted_by, `⭐ Your task has been confirmed! Points awarded.`]);
        await client.query('COMMIT');
        res.json({ message: 'Task confirmed and points awarded' });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Confirm task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// DELETE /ambassador-admin/tasks/:id — Remove a pending task without notification
router.delete('/tasks/:id', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const taskResult = await db_1.default.query(`SELECT t.id, t.status, t.submitted_by, su.role
       FROM tasks t
       INNER JOIN users su ON su.id = t.submitted_by
       WHERE t.id = $1 AND su.role = 'ambassador'`, [id]);
        if (taskResult.rows.length === 0) {
            res.status(404).json({ error: 'Task not found or user is not an ambassador' });
            return;
        }
        const task = taskResult.rows[0];
        if (task.status !== 'pending') {
            res.status(400).json({ error: 'Only pending tasks can be removed' });
            return;
        }
        await db_1.default.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ message: 'Task removed successfully', task_id: id });
    }
    catch (err) {
        console.error('Delete task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ─── Delegated Tasks ─────────────────────────────────────────────────────────
// GET /ambassador-admin/delegated — List delegated tasks for ambassadors
router.get('/delegated', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT d.id, d.title, d.description, d.status, d.deadline, d.created_at, d.completed_at, d.admin_remark,
              d.assigned_to, au.name AS assigned_to_name,
              d.created_by, cu.name AS created_by_name
       FROM delegated_tasks d
       INNER JOIN users au ON au.id = d.assigned_to AND au.role = 'ambassador'
       LEFT JOIN users cu ON cu.id = d.created_by
       ORDER BY d.created_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get delegated tasks error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /ambassador-admin/delegated — Create delegated task for ambassadors
router.post('/delegated', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { title, description, assigned_to, deadline } = req.body;
    if (!title || !assigned_to || !Array.isArray(assigned_to) || assigned_to.length === 0 || !deadline) {
        res.status(400).json({ error: 'title, assigned_to (array), and deadline are required' });
        return;
    }
    const createdBy = req.user.sub;
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // Validate all assignees are ambassadors
        for (const assigneeId of assigned_to) {
            const check = await client.query(`SELECT id FROM users WHERE id = $1 AND role = 'ambassador'`, [assigneeId]);
            if (check.rows.length === 0) {
                await client.query('ROLLBACK');
                res.status(400).json({ error: `User ${assigneeId} is not an ambassador` });
                return;
            }
        }
        const createdTasks = [];
        for (const assigneeId of assigned_to) {
            const id = (0, crypto_1.randomUUID)();
            const result = await client.query(`INSERT INTO delegated_tasks (id, title, description, assigned_to, created_by, deadline)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [id, title, description || null, assigneeId, createdBy, deadline]);
            await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), assigneeId, `🎯 New task delegated to you: "${title}"`]);
            createdTasks.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json(createdTasks);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Create delegated task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// DELETE /ambassador-admin/delegated/:id — Delete delegated task
router.delete('/delegated/:id', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db_1.default.query(`SELECT d.id FROM delegated_tasks d
       INNER JOIN users au ON au.id = d.assigned_to AND au.role = 'ambassador'
       WHERE d.id = $1`, [id]);
        if (check.rows.length === 0) {
            res.status(404).json({ error: 'Delegated task not found or not assigned to an ambassador' });
            return;
        }
        await db_1.default.query('DELETE FROM delegated_tasks WHERE id = $1', [id]);
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete delegated task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ─── Leaderboard ─────────────────────────────────────────────────────────────
// GET /ambassador-admin/leaderboard — Ambassador leaderboard
router.get('/leaderboard', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT id, name, points, avatar_url
       FROM users
       WHERE role = 'ambassador'
       ORDER BY points DESC, name ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get leaderboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ─── Schedule ────────────────────────────────────────────────────────────────
// GET /ambassador-admin/schedule — View ambassador schedule
router.get('/schedule', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT s.id, s.title, s.description, s.day_of_week, s.time_slot, s.created_at,
              s.created_by, u.name AS created_by_name
       FROM ambassador_schedule_items s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.day_of_week, s.time_slot`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /ambassador-admin/schedule — Create schedule item
router.post('/schedule', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { title, description, day_of_week, time_slot } = req.body;
    if (!title || !time_slot) {
        res.status(400).json({ error: 'title and time_slot are required' });
        return;
    }
    if (!VALID_DAYS.includes(day_of_week)) {
        res.status(400).json({ error: `day_of_week must be one of: ${VALID_DAYS.join(', ')}` });
        return;
    }
    try {
        const id = (0, crypto_1.randomUUID)();
        const result = await db_1.default.query(`INSERT INTO ambassador_schedule_items (id, title, description, day_of_week, time_slot, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING *`, [id, title, description || null, day_of_week, time_slot, req.user.sub]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create schedule item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /ambassador-admin/schedule/:id — Delete schedule item
router.delete('/schedule/:id', auth_1.authMiddleware, auth_1.requireAmbassadorAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query(`DELETE FROM ambassador_schedule_items WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Schedule item not found' });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete schedule item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

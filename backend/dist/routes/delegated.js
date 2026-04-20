"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const points_1 = require("../services/points");
const router = (0, express_1.Router)();
const DelegateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    assigned_to: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    deadline: zod_1.z.string().min(1),
    admin_remark: zod_1.z.string().optional().nullable(),
});
const RemarkSchema = zod_1.z.object({
    admin_remark: zod_1.z.string().min(1),
});
// GET /delegated — All delegated tasks (visible to everyone)
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const user = req.user;
    try {
        let query = `
      SELECT d.id, d.title, d.description, d.status, d.deadline, d.created_at, d.completed_at, d.admin_remark,
             d.assigned_to, au.name AS assigned_to_name, au.role AS assigned_to_role,
             d.created_by, cu.name AS created_by_name
      FROM delegated_tasks d
      LEFT JOIN users au ON au.id = d.assigned_to
      LEFT JOIN users cu ON cu.id = d.created_by
      ORDER BY d.created_at DESC
    `;
        let result;
        if (user.role === 'admin') {
            result = await db_1.default.query(query);
        }
        else if (user.role === 'ambassador') {
            result = await db_1.default.query(query + ' WHERE au.role = $1', ['ambassador']);
        }
        else {
            result = await db_1.default.query(query + ' WHERE d.assigned_to = $1', [user.sub]);
        }
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get delegated tasks error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /delegated — Admin creates and delegates a task
router.post('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = DelegateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
        return;
    }
    const { title, description, assigned_to, deadline, admin_remark } = parsed.data;
    const createdBy = req.user.sub;
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const createdTasks = [];
        for (const assignee of assigned_to) {
            const id = (0, crypto_1.randomUUID)();
            const result = await client.query(`INSERT INTO delegated_tasks (id, title, description, assigned_to, created_by, deadline, admin_remark)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`, [id, title, description, assignee, createdBy, deadline, admin_remark ?? null]);
            await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), assignee, `🎯 New task delegated to you: "${title}"`]);
            createdTasks.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json(createdTasks);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Delegate task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// PATCH /delegated/:id/complete — Member marks delegated task complete (no points yet)
router.patch('/:id/complete', auth_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.sub;
    try {
        const r = await db_1.default.query('SELECT * FROM delegated_tasks WHERE id=$1', [id]);
        if (r.rows.length === 0) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const task = r.rows[0];
        if (task.assigned_to !== userId) {
            res.status(403).json({ error: 'Not assigned to you' });
            return;
        }
        if (task.status === 'completed') {
            res.status(409).json({ error: 'Already completed' });
            return;
        }
        const completedAt = new Date();
        const updated = await db_1.default.query(`UPDATE delegated_tasks SET status='completed', completed_at=$1 WHERE id=$2 RETURNING *`, [completedAt, id]);
        // Notify admins that task is completed and needs approval
        const admins = await db_1.default.query('SELECT id FROM users WHERE role=$1', ['admin']);
        for (const admin of admins.rows) {
            await db_1.default.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), admin.id, `✅ Delegated task "${task.title}" completed by ${req.user.name}. Awaiting approval.`]);
        }
        res.json(updated.rows[0]);
    }
    catch (err) {
        console.error('Complete delegated task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /delegated/:id/approve — Admin approves completed delegated task and awards points
router.patch('/:id/approve', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const r = await client.query('SELECT * FROM delegated_tasks WHERE id=$1 FOR UPDATE', [id]);
        if (r.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const task = r.rows[0];
        if (task.status !== 'completed') {
            await client.query('ROLLBACK');
            res.status(409).json({ error: 'Task not completed yet' });
            return;
        }
        // Award points if completed on time
        if (task.completed_at && task.deadline && new Date(task.completed_at) < new Date(task.deadline)) {
            await points_1.PointsService.award(task.assigned_to, null, client);
            // Notify the assignee
            await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), task.assigned_to, `⭐ Points awarded for completing "${task.title}" on time!`]);
        }
        else {
            // Notify even if late
            await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), task.assigned_to, `✅ Task "${task.title}" approved, but no points (completed late).`]);
        }
        // Update status to 'approved' to prevent re-approval
        await client.query(`UPDATE delegated_tasks SET status='approved' WHERE id=$1`, [id]);
        await client.query('COMMIT');
        res.json({ message: 'Task approved and points awarded.' });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Approve delegated task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
// PATCH /delegated/:id/remark — Admin adds/updates remark
router.patch('/:id/remark', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = RemarkSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Remark is required' });
        return;
    }
    const { id } = req.params;
    try {
        const result = await db_1.default.query(`UPDATE delegated_tasks SET admin_remark=$1 WHERE id=$2 RETURNING *`, [parsed.data.admin_remark, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Remark error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /delegated/:id — Admin cancels/deletes a delegated task
router.delete('/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM delegated_tasks WHERE id=$1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('Cancel delegated task error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

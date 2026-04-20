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
const router = (0, express_1.Router)();
const ItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().nullable(),
    day_of_week: zod_1.z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    time_slot: zod_1.z.string().min(1),
});
// GET /schedule — all users can view
router.get('/', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT s.*, u.name AS created_by_name FROM schedule_items s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY CASE s.day_of_week
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
       END, s.time_slot ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /schedule — admin only
router.post('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = ItemSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
    }
    const { title, description, day_of_week, time_slot } = parsed.data;
    try {
        const result = await db_1.default.query(`INSERT INTO schedule_items (id, title, description, day_of_week, time_slot, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [(0, crypto_1.randomUUID)(), title, description ?? null, day_of_week, time_slot, req.user.sub]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /schedule/:id — admin only
router.delete('/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        await db_1.default.query('DELETE FROM schedule_items WHERE id = $1', [req.params.id]);
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Ambassador-specific schedule routes
// GET /schedule/ambassador — ambassador schedule items
router.get('/ambassador', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT s.*, u.name AS created_by_name FROM ambassador_schedule_items s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY CASE s.day_of_week
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
       END, s.time_slot ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get ambassador schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /schedule/ambassador — admin only, add ambassador schedule item
router.post('/ambassador', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = ItemSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
    }
    const { title, description, day_of_week, time_slot } = parsed.data;
    try {
        const result = await db_1.default.query(`INSERT INTO ambassador_schedule_items (id, title, description, day_of_week, time_slot, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [(0, crypto_1.randomUUID)(), title, description ?? null, day_of_week, time_slot, req.user.sub]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create ambassador schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /schedule/ambassador/:id — admin only, remove ambassador schedule item
router.delete('/ambassador/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM ambassador_schedule_items WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Schedule item not found' });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete ambassador schedule error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

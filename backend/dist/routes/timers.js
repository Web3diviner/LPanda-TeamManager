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
const TimerSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    ends_at: zod_1.z.string().min(1),
});
// GET /timers — all active timers (everyone)
router.get('/', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT t.id, t.label, t.ends_at, t.active, t.created_at, u.name AS created_by_name
       FROM task_timers t LEFT JOIN users u ON u.id = t.created_by
       WHERE t.active = true AND t.ends_at > now()
       ORDER BY t.ends_at ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get timers error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /timers — admin creates a timer
router.post('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = TimerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'label and ends_at are required' });
        return;
    }
    try {
        const result = await db_1.default.query(`INSERT INTO task_timers (id, label, ends_at, created_by) VALUES ($1,$2,$3,$4) RETURNING *`, [(0, crypto_1.randomUUID)(), parsed.data.label, parsed.data.ends_at, req.user.sub]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create timer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /timers/:id — admin removes a timer
router.delete('/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        await db_1.default.query(`UPDATE task_timers SET active=false WHERE id=$1`, [req.params.id]);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('Delete timer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

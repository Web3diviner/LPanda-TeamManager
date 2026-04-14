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
const CreateAnnouncementSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).refine((s) => s.trim().length > 0, {
        message: 'Content must not be empty or whitespace-only',
    }),
});
// GET /announcements — return all announcements ordered by created_at DESC
router.get('/', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT a.id, a.content, a.created_at, a.author_id, u.name AS author_name
       FROM announcements a
       JOIN users u ON u.id = a.author_id
       ORDER BY a.created_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get announcements error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /announcements — Admin only; create announcement
router.post('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = CreateAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
        return;
    }
    const { content } = parsed.data;
    const authorId = req.user.sub;
    const id = (0, crypto_1.randomUUID)();
    try {
        const result = await db_1.default.query(`INSERT INTO announcements (id, author_id, content, created_at)
       VALUES ($1, $2, $3, now())
       RETURNING id, author_id, content, created_at`, [id, authorId, content]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /announcements/:id — Admin only; delete announcement
router.delete('/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Announcement not found' });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete announcement error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

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
const FeedbackSchema = zod_1.z.object({ message: zod_1.z.string().min(1) });
const RemarkSchema = zod_1.z.object({ admin_remark: zod_1.z.string().min(1) });
// GET /feedback — admin sees all; members see their own
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin') {
            result = await db_1.default.query(`SELECT f.id, f.message, f.admin_remark, f.created_at, u.name AS user_name
         FROM feedback f JOIN users u ON u.id=f.user_id
         ORDER BY f.created_at DESC`);
        }
        else {
            result = await db_1.default.query(`SELECT f.id, f.message, f.admin_remark, f.created_at
         FROM feedback f WHERE f.user_id=$1 ORDER BY f.created_at DESC`, [req.user.sub]);
        }
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get feedback error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /feedback — member submits feedback
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const parsed = FeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }
    try {
        const result = await db_1.default.query(`INSERT INTO feedback (id, user_id, message) VALUES ($1,$2,$3) RETURNING *`, [(0, crypto_1.randomUUID)(), req.user.sub, parsed.data.message]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Post feedback error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /feedback/:id/remark — admin adds remark
router.patch('/:id/remark', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = RemarkSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Remark is required' });
        return;
    }
    try {
        const result = await db_1.default.query(`UPDATE feedback SET admin_remark=$1 WHERE id=$2 RETURNING *`, [parsed.data.admin_remark, req.params.id]);
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
exports.default = router;

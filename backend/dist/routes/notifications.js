"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /notifications — user's own notifications
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT id, message, read, created_at FROM notifications
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [req.user.sub]);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /notifications/read-all — mark all as read
router.patch('/read-all', auth_1.authMiddleware, async (req, res) => {
    try {
        await db_1.default.query(`UPDATE notifications SET read=true WHERE user_id=$1`, [req.user.sub]);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

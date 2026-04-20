"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /points/me — current user's balance and transaction history
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    const userId = req.user.sub;
    try {
        const userResult = await db_1.default.query('SELECT points FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const transactionsResult = await db_1.default.query(`SELECT id, task_id, delta, reason, created_at
       FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC`, [userId]);
        res.json({
            balance: userResult.rows[0].points,
            points: userResult.rows[0].points,
            transactions: transactionsResult.rows,
        });
    }
    catch (err) {
        console.error('Get points/me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /points/leaderboard — all users ordered by points DESC, name ASC
router.get('/leaderboard', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT id, name, points
       FROM users
       ORDER BY points DESC, name ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /points/ambassador-leaderboard — ambassadors only ordered by points DESC, name ASC
router.get('/ambassador-leaderboard', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT id, name, points
       FROM users
       WHERE role = 'ambassador'
       ORDER BY points DESC, name ASC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get ambassador leaderboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

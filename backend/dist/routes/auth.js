"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '8h';
router.post('/login', async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
        return;
    }
    const { email, password } = parsed.data;
    try {
        const result = await db_1.default.query('SELECT id, name, email, password, role FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        // Use a constant-time comparison even when user is not found to prevent timing attacks
        const passwordToCheck = user?.password ?? '$2b$10$invalidhashfortimingprotection000000000000000000000';
        const match = await bcrypt_1.default.compare(password, passwordToCheck);
        if (!user || !match) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const payload = { sub: user.id, role: user.role, name: user.name };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/logout', (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ message: 'Logged out' });
});
const RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['admin', 'member', 'ambassador', 'ambassador_admin']).default('member'),
});
// POST /auth/register â€” Admin only; create a new user account
router.post('/register', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
        return;
    }
    const { name, email, password, role } = parsed.data;
    try {
        const existing = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'A user with that email already exists' });
            return;
        }
        const hash = await bcrypt_1.default.hash(password, 10);
        const id = (0, crypto_1.randomUUID)();
        const result = await db_1.default.query(`INSERT INTO users (id, name, email, password, role, points, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, now())
       RETURNING id, name, email, role`, [id, name, email, hash, role]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /auth/profile â€” update own avatar
router.patch('/profile', auth_1.authMiddleware, async (req, res) => {
    const { avatar_url } = req.body;
    if (typeof avatar_url !== 'string') {
        res.status(400).json({ error: 'avatar_url must be a string' });
        return;
    }
    try {
        const result = await db_1.default.query(`UPDATE users SET avatar_url=$1 WHERE id=$2 RETURNING id, name, email, role, avatar_url`, [avatar_url || null, req.user.sub]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /auth/me â€” get own profile including avatar
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.default.query(`SELECT id, name, email, role, avatar_url FROM users WHERE id=$1`, [req.user.sub]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /auth/users/:id/adjust-points â€” Admin only; manually add or deduct points
router.post('/users/:id/adjust-points', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { delta, reason } = req.body;
    if (typeof delta !== 'number' || delta === 0) {
        res.status(400).json({ error: 'delta must be a non-zero number' });
        return;
    }
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        const txId = (0, crypto_1.randomUUID)();
        await client.query(`INSERT INTO point_transactions (id, user_id, task_id, delta, reason, created_at) VALUES ($1,$2,NULL,$3,$4,now())`, [txId, id, delta, reason || (delta > 0 ? 'manual_award' : 'manual_deduction')]);
        await client.query(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, id]);
        // Notify the user
        const msg = delta > 0
            ? `â­ Admin awarded you ${delta} point${Math.abs(delta) !== 1 ? 's' : ''}.`
            : `ðŸ“‰ Admin deducted ${Math.abs(delta)} point${Math.abs(delta) !== 1 ? 's' : ''} from your account.`;
        await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1,$2,$3)`, [(0, crypto_1.randomUUID)(), id, msg]);
        await client.query('COMMIT');
        const updated = await db_1.default.query('SELECT id, name, points FROM users WHERE id=$1', [id]);
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
// POST /auth/reset â€” Admin only; wipe all activity
router.post('/reset', auth_1.authMiddleware, auth_1.requireAdmin, async (_req, res) => {
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM notifications');
        await client.query('DELETE FROM feedback');
        await client.query('DELETE FROM point_transactions');
        await client.query('DELETE FROM delegated_tasks');
        await client.query('DELETE FROM task_timers');
        await client.query('DELETE FROM announcements');
        await client.query('DELETE FROM tasks');
        await client.query('UPDATE users SET points = 0');
        await client.query('COMMIT');
        res.json({ message: 'Site activity reset successfully.' });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Reset error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
router.get('/users', auth_1.authMiddleware, auth_1.requireAdmin, async (_req, res) => {
    try {
        const result = await db_1.default.query('SELECT id, name, email, role, role_title, points, created_at FROM users ORDER BY created_at ASC');
        res.json(result.rows);
    }
    catch (err) {
        console.error('List users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /auth/users/:id â€” Admin only; update role_title
router.patch('/users/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role_title } = req.body;
    if (typeof role_title !== 'string') {
        res.status(400).json({ error: 'role_title must be a string' });
        return;
    }
    try {
        const result = await db_1.default.query(`UPDATE users SET role_title = $1 WHERE id = $2 RETURNING id, name, email, role, role_title, points`, [role_title.trim() || null, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /auth/users/:id/password â€” Admin only; reset a user's password
router.patch('/users/:id/password', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
    }
    try {
        const hash = await bcrypt_1.default.hash(password, 10);
        const result = await db_1.default.query('UPDATE users SET password=$1 WHERE id=$2 RETURNING id', [hash, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ message: 'Password updated' });
    }
    catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/users/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.sub;
    if (id === adminId) {
        res.status(400).json({ error: 'You cannot delete your own account' });
        return;
    }
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // Check user exists
        const check = await client.query('SELECT id FROM users WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Delete all related data in dependency order
        await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
        await client.query('DELETE FROM feedback WHERE user_id = $1', [id]);
        await client.query('DELETE FROM point_transactions WHERE user_id = $1', [id]);
        await client.query('DELETE FROM delegated_tasks WHERE assigned_to = $1 OR created_by = $1', [id]);
        await client.query('DELETE FROM task_timers WHERE created_by = $1', [id]);
        await client.query('DELETE FROM announcements WHERE author_id = $1', [id]);
        // Nullify task references instead of deleting tasks (preserve task history)
        await client.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [id]);
        await client.query('UPDATE tasks SET submitted_by = NULL WHERE submitted_by = $1', [id]);
        // Finally delete the user
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.status(204).send();
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.default = router;

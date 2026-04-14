"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /meetings — all users can view summaries
router.get('/', auth_1.authMiddleware, async (_req, res) => {
    try {
        const result = await db_1.default.query(`SELECT m.*, u.name AS created_by_name FROM meeting_summaries m
       LEFT JOIN users u ON u.id = m.created_by
       ORDER BY m.created_at DESC`);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Get meetings error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /meetings/room — create a meeting record with a Jitsi room URL
router.post('/room', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { title, room_url } = req.body;
    if (!title) {
        res.status(400).json({ error: 'title is required' });
        return;
    }
    try {
        const id = (0, crypto_1.randomUUID)();
        const result = await db_1.default.query(`INSERT INTO meeting_summaries (id, title, room_url, created_by) VALUES ($1,$2,$3,$4) RETURNING *`, [id, title, room_url ?? null, req.user.sub]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Create room error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /meetings/:id/summarize — transcribe + summarize via OpenAI
router.post('/:id/summarize', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    const { transcript } = req.body;
    if (!transcript) {
        res.status(400).json({ error: 'transcript is required' });
        return;
    }
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
        return;
    }
    try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                        role: 'user',
                        content: `You are a meeting assistant. Given the following meeting transcript, provide:
1. A concise summary (3-5 sentences)
2. A numbered list of action points with owner names if mentioned

Transcript:
${transcript}

Respond in this exact JSON format:
{"summary": "...", "action_points": "1. ...\n2. ..."}`,
                    }],
                temperature: 0.3,
            }),
        });
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content ?? '';
        let summary = '';
        let action_points = '';
        try {
            const parsed = JSON.parse(content);
            summary = parsed.summary ?? '';
            action_points = parsed.action_points ?? '';
        }
        catch {
            summary = content;
        }
        const result = await db_1.default.query(`UPDATE meeting_summaries SET transcript=$1, summary=$2, action_points=$3 WHERE id=$4 RETURNING *`, [transcript, summary, action_points, req.params.id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Summarize error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /meetings/:id — admin only
router.delete('/:id', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        await db_1.default.query('DELETE FROM meeting_summaries WHERE id = $1', [req.params.id]);
        res.status(204).send();
    }
    catch (err) {
        console.error('Delete meeting error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;

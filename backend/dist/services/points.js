"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsService = void 0;
const crypto_1 = require("crypto");
function autoRemark(delta) {
    return delta >= 3 ? 'Satisfactory' : 'Fair';
}
exports.PointsService = {
    async award(userId, taskId, client) {
        const delta = 3.0;
        const id = (0, crypto_1.randomUUID)();
        await client.query(`INSERT INTO point_transactions (id, user_id, task_id, delta, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`, [id, userId, taskId, delta, 'completion']);
        await client.query(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, userId]);
    },
    async deduct(userId, taskId, client) {
        const delta = -1.5;
        const id = (0, crypto_1.randomUUID)();
        await client.query(`INSERT INTO point_transactions (id, user_id, task_id, delta, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`, [id, userId, taskId, delta, 'missed_deadline']);
        await client.query(`UPDATE users SET points = points + $1 WHERE id = $2`, [delta, userId]);
    },
};

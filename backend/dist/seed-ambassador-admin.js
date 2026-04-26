"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Run once to create the first ambassador_admin account.
 * Usage: npx ts-node src/seed-ambassador-admin.ts
 *
 * Set these env vars or edit the defaults below:
 *   AMBASSADOR_ADMIN_NAME, AMBASSADOR_ADMIN_EMAIL, AMBASSADOR_ADMIN_PASSWORD
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("./db"));
const name = process.env.AMBASSADOR_ADMIN_NAME ?? 'Ambassador Admin';
const email = process.env.AMBASSADOR_ADMIN_EMAIL ?? 'ambassador@gmail.com';
const password = process.env.AMBASSADOR_ADMIN_PASSWORD ?? 'ambassadoradmin123';
async function seed() {
    const existing = await db_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        console.log(`Ambassador admin already exists: ${email}`);
        await db_1.default.end();
        return;
    }
    const hash = await bcrypt_1.default.hash(password, 10);
    const id = (0, crypto_1.randomUUID)();
    await db_1.default.query(`INSERT INTO users (id, name, email, password, role, points, created_at)
     VALUES ($1, $2, $3, $4, 'ambassador_admin', 0, now())`, [id, name, email, hash]);
    console.log('✓ Ambassador admin account created');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('\nUse these credentials to log in at /ambassador-admin/login');
    await db_1.default.end();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});

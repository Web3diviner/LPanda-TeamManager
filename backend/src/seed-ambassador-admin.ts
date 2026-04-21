/**
 * Run once to create the first ambassador_admin account.
 * Usage: npx ts-node src/seed-ambassador-admin.ts
 *
 * Set these env vars or edit the defaults below:
 *   AMBASSADOR_ADMIN_NAME, AMBASSADOR_ADMIN_EMAIL, AMBASSADOR_ADMIN_PASSWORD
 */
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import pool from './db';

const name = process.env.AMBASSADOR_ADMIN_NAME ?? 'Ambassador Admin';
const email = process.env.AMBASSADOR_ADMIN_EMAIL ?? 'ambassador-admin@example.com';
const password = process.env.AMBASSADOR_ADMIN_PASSWORD ?? 'ambassadoradmin123';

async function seed() {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`Ambassador admin already exists: ${email}`);
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO users (id, name, email, password, role, points, created_at)
     VALUES ($1, $2, $3, $4, 'ambassador_admin', 0, now())`,
    [id, name, email, hash],
  );

  console.log('✓ Ambassador admin account created');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('\nUse these credentials to log in at /ambassador-admin/login');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

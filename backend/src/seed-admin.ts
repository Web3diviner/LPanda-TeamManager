/**
 * Run once to create the first admin account.
 * Usage: npx ts-node src/seed-admin.ts
 *
 * Set these env vars or edit the defaults below:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import pool from './db';

const name = process.env.ADMIN_NAME ?? 'Admin';
const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.ADMIN_PASSWORD ?? 'admin123';

async function seed() {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`Admin already exists: ${email}`);
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO users (id, name, email, password, role, points, created_at)
     VALUES ($1, $2, $3, $4, 'admin', 0, now())`,
    [id, name, email, hash],
  );

  console.log('✓ Admin account created');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('\nLog in and use the Users page to create team member accounts.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

/**
 * Quick diagnostic script to check ambassador admin account
 * Usage: npx ts-node check-ambassador-admin.ts
 */
import pool from './src/db';

async function check() {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE role = $1',
      ['ambassador_admin']
    );

    if (result.rows.length === 0) {
      console.log('❌ No ambassador_admin user found in database');
      console.log('\nTo create one, run:');
      console.log('  npx ts-node src/seed-ambassador-admin.ts');
    } else {
      console.log('✓ Found ambassador_admin user(s):');
      result.rows.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
      });
      console.log('\nDefault credentials from seed script:');
      console.log('  Email: ambassador@gmail.com');
      console.log('  Password: ambassadoradmin123');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();

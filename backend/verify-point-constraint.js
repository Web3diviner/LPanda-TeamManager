const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.seyybjzthonalvvmoiiq:LPandadatabse@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query(`
      SELECT tc.constraint_name, cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'point_transactions'
        AND tc.constraint_type = 'CHECK';
    `);

    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('ERROR', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

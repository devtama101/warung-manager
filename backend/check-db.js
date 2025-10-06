import postgres from 'postgres';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/warung_pos';
const sql = postgres(connectionString);

async function checkTables() {
  try {
    console.log('=== Checking tables in database ===');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('Tables found:');
    tables.forEach(t => console.log('  -', t.table_name));

    console.log('\n=== Expected tables from schema ===');
    const expectedTables = [
      'users', 'employees', 'devices', 'orders', 'menu_items',
      'inventory_items', 'daily_reports', 'sync_logs', 'inventory_events',
      'inventory_snapshots', 'sync_queue_v2', 'conflict_logs'
    ];
    expectedTables.forEach(t => console.log('  -', t));

    console.log('\n=== Missing tables ===');
    const foundTables = tables.map(t => t.table_name);
    const missing = expectedTables.filter(t => !foundTables.includes(t));
    if (missing.length > 0) {
      console.log('Missing:', missing);
    } else {
      console.log('All expected tables exist!');
    }

    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
  }
}

checkTables();
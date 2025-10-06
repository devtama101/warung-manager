import postgres from 'postgres';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/warung_pos';
const sql = postgres(connectionString);

async function fixDatabase() {
  try {
    console.log('Creating missing inventory_snapshots table...');

    await sql`
      CREATE TABLE IF NOT EXISTS inventory_snapshots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        inventory_id INTEGER NOT NULL REFERENCES inventory_items(id),
        stock_level DECIMAL(10,3) NOT NULL,
        unit TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        device_id TEXT REFERENCES devices(device_id) NOT NULL,
        verified_by TEXT NOT NULL,
        notes TEXT
      )
    `;

    console.log('inventory_snapshots table created successfully!');

    console.log('\n=== Dropping old Indonesian tables ===');
    const oldTables = ['inventory', 'menu', 'pesanan', 'menu_ingredients', 'order_items'];

    for (const table of oldTables) {
      try {
        await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
        console.log(`Dropped ${table}`);
      } catch (error) {
        console.log(`Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('\n=== Final table check ===');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('Final tables:');
    tables.forEach(t => console.log('  -', t.table_name));

    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
  }
}

fixDatabase();
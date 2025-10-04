import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/warung_pos';

async function migrate() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Starting migration: username -> email...');

    // Rename column in users table
    await db.execute(sql`ALTER TABLE users RENAME COLUMN username TO email`);
    console.log('✓ Renamed users.username to users.email');

    // Rename column in employees table
    await db.execute(sql`ALTER TABLE employees RENAME COLUMN username TO email`);
    console.log('✓ Renamed employees.username to employees.email');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();

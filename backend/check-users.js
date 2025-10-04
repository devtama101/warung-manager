import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/warung_pos';
const sql = postgres(connectionString);

async function checkUsers() {
  try {
    const users = await sql`SELECT id, email, warung_nama, role FROM users LIMIT 5`;
    console.log('Users in database:', JSON.stringify(users, null, 2));

    const employees = await sql`SELECT id, email, name, user_id, is_active FROM employees LIMIT 5`;
    console.log('\nEmployees in database:', JSON.stringify(employees, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkUsers();

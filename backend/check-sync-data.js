import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/warung_pos';
const sql = postgres(connectionString);

async function checkSyncData() {
  try {
    const pesanan = await sql`SELECT COUNT(*) FROM pesanan`;
    const menu = await sql`SELECT COUNT(*) FROM menu`;
    const inventory = await sql`SELECT COUNT(*) FROM inventory`;
    const syncLogs = await sql`SELECT COUNT(*) FROM sync_logs`;

    console.log('📊 Data counts:');
    console.log('- pesanan:', pesanan[0].count);
    console.log('- menu:', menu[0].count);
    console.log('- inventory:', inventory[0].count);
    console.log('- sync_logs:', syncLogs[0].count);

    console.log('\n📦 Recent pesanan (last 5):');
    const recentPesanan = await sql`SELECT id, local_id, user_id, device_id, nomor_meja, total, status, created_at FROM pesanan ORDER BY created_at DESC LIMIT 5`;
    console.log(JSON.stringify(recentPesanan, null, 2));

    console.log('\n🍔 Recent menu (last 5):');
    const recentMenu = await sql`SELECT id, local_id, user_id, device_id, nama, kategori, harga, created_at FROM menu ORDER BY created_at DESC LIMIT 5`;
    console.log(JSON.stringify(recentMenu, null, 2));

    console.log('\n📦 Recent inventory (last 5):');
    const recentInventory = await sql`SELECT id, local_id, user_id, device_id, nama, kategori, stok, created_at FROM inventory ORDER BY created_at DESC LIMIT 5`;
    console.log(JSON.stringify(recentInventory, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkSyncData();

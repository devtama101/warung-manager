import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { users, employees, devices, menu, inventory, pesanan, dailyReports } from './src/db/schema.ts';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/warung_pos';
const SALT_ROUNDS = 10;

async function seed() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🗑️  Wiping database...');

    // Delete all data (in correct order due to foreign keys)
    await db.delete(dailyReports);
    await db.delete(pesanan);
    await db.delete(menu);
    await db.delete(inventory);
    await db.delete(employees);
    await db.delete(devices);
    await db.delete(users);

    console.log('✅ Database wiped successfully');
    console.log('');
    console.log('🌱 Seeding database with sample data...');

    // 1. Create Owner/Admin
    const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    const [owner] = await db.insert(users).values({
      email: 'owner@warung.com',
      password: hashedPassword,
      role: 'admin',
      warungNama: 'Warung Maju Jaya',
      warungAlamat: 'Jl. Raya No. 123, Jakarta'
    }).returning();

    console.log('✅ Created owner:', { email: owner.email, warungNama: owner.warungNama });

    // 2. Create Employees
    const empPassword = await bcrypt.hash('emp123', SALT_ROUNDS);

    const [employee1] = await db.insert(employees).values({
      userId: owner.id,
      email: 'kasir1@warung.com',
      password: empPassword,
      name: 'Budi Santoso',
      deviceId: 'emp_kasir1_001',
      deviceName: 'Kasir 1',
      isActive: true
    }).returning();

    const [employee2] = await db.insert(employees).values({
      userId: owner.id,
      email: 'kasir2@warung.com',
      password: empPassword,
      name: 'Siti Aminah',
      deviceId: 'emp_kasir2_002',
      deviceName: 'Kasir 2',
      isActive: true
    }).returning();

    console.log('✅ Created employees:', [
      { email: employee1.email, name: employee1.name },
      { email: employee2.email, name: employee2.name }
    ]);

    // 3. Create Devices
    await db.insert(devices).values([
      {
        userId: owner.id,
        deviceId: employee1.deviceId,
        deviceName: employee1.deviceName,
        lastSeenAt: new Date()
      },
      {
        userId: owner.id,
        deviceId: employee2.deviceId,
        deviceName: employee2.deviceName,
        lastSeenAt: new Date()
      }
    ]);

    console.log('✅ Created devices for employees');

    // 4. Create Inventory (Bahan Baku)
    const [bahanNasi] = await db.insert(inventory).values({
      userId: owner.id,
      deviceId: employee1.deviceId,
      nama: 'Beras',
      kategori: 'bahan_baku',
      stok: 50,
      unit: 'kg',
      stokMinimum: 10,
      hargaBeli: 12000,
      supplier: 'Toko Beras Sari'
    }).returning();

    const [bahanAyam] = await db.insert(inventory).values({
      userId: owner.id,
      deviceId: employee1.deviceId,
      nama: 'Ayam',
      kategori: 'bahan_baku',
      stok: 20,
      unit: 'kg',
      stokMinimum: 5,
      hargaBeli: 35000,
      supplier: 'Pasar Induk'
    }).returning();

    console.log('✅ Created inventory items:', [
      { nama: bahanNasi.nama, stok: bahanNasi.stok },
      { nama: bahanAyam.nama, stok: bahanAyam.stok }
    ]);

    // 5. Create Menu Items
    const [nasiGoreng] = await db.insert(menu).values({
      userId: owner.id,
      deviceId: employee1.deviceId,
      nama: 'Nasi Goreng Ayam',
      kategori: 'makanan',
      harga: 25000,
      tersedia: true,
      ingredients: [
        { inventoryId: bahanNasi.id, inventoryNama: bahanNasi.nama, qty: 0.2, unit: 'kg' },
        { inventoryId: bahanAyam.id, inventoryNama: bahanAyam.nama, qty: 0.1, unit: 'kg' }
      ]
    }).returning();

    const [esTeh] = await db.insert(menu).values({
      userId: owner.id,
      deviceId: employee1.deviceId,
      nama: 'Es Teh Manis',
      kategori: 'minuman',
      harga: 5000,
      tersedia: true,
      ingredients: []
    }).returning();

    console.log('✅ Created menu items:', [
      { nama: nasiGoreng.nama, harga: nasiGoreng.harga },
      { nama: esTeh.nama, harga: esTeh.harga }
    ]);

    // 6. Create Sample Orders
    const now = new Date();

    const [order1] = await db.insert(pesanan).values({
      userId: owner.id,
      deviceId: employee1.deviceId,
      nomorMeja: 'A1',
      items: [
        {
          menuId: nasiGoreng.id,
          menuNama: nasiGoreng.nama,
          qty: 2,
          harga: 25000,
          subtotal: 50000
        },
        {
          menuId: esTeh.id,
          menuNama: esTeh.nama,
          qty: 2,
          harga: 5000,
          subtotal: 10000
        }
      ],
      total: 60000,
      status: 'completed',
      tanggal: now
    }).returning();

    const [order2] = await db.insert(pesanan).values({
      userId: owner.id,
      deviceId: employee2.deviceId,
      nomorMeja: 'B2',
      items: [
        {
          menuId: nasiGoreng.id,
          menuNama: nasiGoreng.nama,
          qty: 1,
          harga: 25000,
          subtotal: 25000
        }
      ],
      total: 25000,
      status: 'completed',
      tanggal: now
    }).returning();

    console.log('✅ Created sample orders:', [
      { nomorMeja: order1.nomorMeja, total: order1.total },
      { nomorMeja: order2.nomorMeja, total: order2.total }
    ]);

    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('📝 Sample Login Credentials:');
    console.log('');
    console.log('👨‍💼 Owner/Admin:');
    console.log('   Email: owner@warung.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 Employee 1 (Kasir 1):');
    console.log('   Email: kasir1@warung.com');
    console.log('   Password: emp123');
    console.log('');
    console.log('👤 Employee 2 (Kasir 2):');
    console.log('   Email: kasir2@warung.com');
    console.log('   Password: emp123');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.end();
  }
}

seed();

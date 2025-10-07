import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { users, employees, devices } from './src/db/schema.ts';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/warung_pos';
const SALT_ROUNDS = 10;

async function seedUsers() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🌱 Seeding admin and employee users...');

    // 1. Create Owner/Admin
    const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    const [owner] = await db.insert(users).values({
      email: 'admin@warung.com',
      password: hashedPassword,
      role: 'admin',
      warungNama: 'Warung Test',
      warungAlamat: 'Jakarta, Indonesia'
    }).returning();

    console.log('✅ Created admin:', { email: owner.email, warungNama: owner.warungNama });

    // 2. Create Employee
    const empPassword = await bcrypt.hash('employee123', SALT_ROUNDS);

    const [employee] = await db.insert(employees).values({
      userId: owner.id,
      email: 'employee@warung.com',
      password: empPassword,
      name: 'Test Employee',
      deviceId: 'emp_device_001',
      deviceName: 'Kasir Device 1',
      isActive: true
    }).returning();

    console.log('✅ Created employee:', { email: employee.email, name: employee.name });

    // 3. Create Device record for employee
    await db.insert(devices).values({
      userId: owner.id,
      deviceId: employee.deviceId,
      deviceName: employee.deviceName,
      lastSeenAt: new Date()
    });

    console.log('✅ Created device for employee');

    console.log('');
    console.log('🎉 Users seeded successfully!');
    console.log('');
    console.log('📝 Login Credentials:');
    console.log('');
    console.log('👨‍💼 Admin Login:');
    console.log('   Email: admin@warung.com');
    console.log('   Password: admin123');
    console.log('   URL: http://localhost:5173/admin/login');
    console.log('');
    console.log('👤 Employee Login:');
    console.log('   Email: employee@warung.com');
    console.log('   Password: employee123');
    console.log('   URL: http://localhost:5173/login');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.end();
  }
}

seedUsers();
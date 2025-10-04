import { Hono } from 'hono';
import { db } from '../db';
import { employees } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();
const SALT_ROUNDS = 10;

// Get all employees for current warung (admin only)
app.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const employeeList = await db
      .select({
        id: employees.id,
        email: employees.email,
        name: employees.name,
        deviceId: employees.deviceId,
        deviceName: employees.deviceName,
        isActive: employees.isActive,
        lastSeenAt: employees.lastSeenAt,
        createdAt: employees.createdAt
      })
      .from(employees)
      .where(eq(employees.userId, userId));

    return c.json({
      success: true,
      data: employeeList
    });
  } catch (error) {
    console.error('Failed to get employees:', error);
    return c.json({ success: false, message: 'Failed to get employees' }, 500);
  }
});

// Add new employee (admin only)
app.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { email, password, name, deviceName } = await c.req.json();

    if (!email || !password || !name || !deviceName) {
      return c.json({
        success: false,
        message: 'Email, password, nama, dan device name wajib diisi'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({
        success: false,
        message: 'Format email tidak valid'
      }, 400);
    }

    // Check if email already exists
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);

    if (existingEmployee.length > 0) {
      return c.json({
        success: false,
        message: 'Email sudah digunakan'
      }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate unique device ID
    const deviceId = `emp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create employee
    const [newEmployee] = await db
      .insert(employees)
      .values({
        userId,
        email,
        password: hashedPassword,
        name,
        deviceId,
        deviceName,
        isActive: true
      })
      .returning({
        id: employees.id,
        email: employees.email,
        name: employees.name,
        deviceId: employees.deviceId,
        deviceName: employees.deviceName,
        isActive: employees.isActive,
        createdAt: employees.createdAt
      });

    return c.json({
      success: true,
      data: newEmployee,
      message: 'Karyawan berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Failed to create employee:', error);
    return c.json({ success: false, message: 'Failed to create employee' }, 500);
  }
});

// Update employee status (admin only)
app.put('/:id/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const employeeId = parseInt(c.req.param('id'));
    const { isActive } = await c.req.json();

    // Verify employee belongs to this user
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(
        eq(employees.id, employeeId),
        eq(employees.userId, userId)
      ))
      .limit(1);

    if (!employee) {
      return c.json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      }, 404);
    }

    // Update status
    await db
      .update(employees)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(employees.id, employeeId));

    return c.json({
      success: true,
      message: `Karyawan berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
    });
  } catch (error) {
    console.error('Failed to update employee status:', error);
    return c.json({ success: false, message: 'Failed to update employee status' }, 500);
  }
});

// Delete employee (admin only)
app.delete('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const employeeId = parseInt(c.req.param('id'));

    // Verify employee belongs to this user
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(
        eq(employees.id, employeeId),
        eq(employees.userId, userId)
      ))
      .limit(1);

    if (!employee) {
      return c.json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      }, 404);
    }

    // Delete employee
    await db.delete(employees).where(eq(employees.id, employeeId));

    return c.json({
      success: true,
      message: 'Karyawan berhasil dihapus'
    });
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return c.json({ success: false, message: 'Failed to delete employee' }, 500);
  }
});

// Reset employee password (admin only)
app.put('/:id/password', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const employeeId = parseInt(c.req.param('id'));
    const { newPassword } = await c.req.json();

    if (!newPassword) {
      return c.json({
        success: false,
        message: 'Password baru wajib diisi'
      }, 400);
    }

    // Verify employee belongs to this user
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(
        eq(employees.id, employeeId),
        eq(employees.userId, userId)
      ))
      .limit(1);

    if (!employee) {
      return c.json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      }, 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await db
      .update(employees)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(employees.id, employeeId));

    return c.json({
      success: true,
      message: 'Password karyawan berhasil direset'
    });
  } catch (error) {
    console.error('Failed to reset employee password:', error);
    return c.json({ success: false, message: 'Failed to reset password' }, 500);
  }
});

export default app;

import { Hono } from 'hono';
import { db } from '../db/index';
import { users, devices, employees } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const SALT_ROUNDS = 10;

// Register new warung user
auth.post('/register', async (c) => {
  try {
    const { email, password, warungNama, warungAlamat } = await c.req.json();

    // Validate input
    if (!email || !password || !warungNama) {
      return c.json({ error: 'Email, password, and warung name are required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      warungNama,
      warungAlamat: warungAlamat || null
    }).returning({
      id: users.id,
      email: users.email,
      warungNama: users.warungNama,
      warungAlamat: users.warungAlamat,
      createdAt: users.createdAt
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return c.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Unified Login - supports both admin and employee
auth.post('/login', async (c) => {
  try {
    const { email, password, deviceId, deviceName } = await c.req.json();

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Try to find admin user first
    const admin = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (admin) {
      // Admin login
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return c.json({ error: 'Invalid username or password' }, 401);
      }

      // Register or update device if provided
      if (deviceId && deviceName) {
        const existingDevice = await db.query.devices.findFirst({
          where: eq(devices.deviceId, deviceId)
        });

        if (existingDevice) {
          await db.update(devices)
            .set({ lastSeenAt: new Date() })
            .where(eq(devices.deviceId, deviceId));
        } else {
          await db.insert(devices).values({
            userId: admin.id,
            deviceId,
            deviceName,
            lastSeenAt: new Date()
          });
        }
      }

      // Generate JWT token for admin
      const token = jwt.sign(
        {
          userId: admin.id,
          email: admin.email,
          role: 'admin',
          warungId: admin.id
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return c.json({
        success: true,
        message: 'Login successful',
        data: {
          role: 'admin',
          user: {
            id: admin.id,
            email: admin.email,
            warungNama: admin.warungNama,
            warungAlamat: admin.warungAlamat,
            createdAt: admin.createdAt
          },
          token,
          deviceId
        }
      });
    }

    // Try to find employee
    const employee = await db.query.employees.findFirst({
      where: eq(employees.email, email)
    });

    if (!employee) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Check if employee is active
    if (!employee.isActive) {
      return c.json({ error: 'Akun karyawan tidak aktif. Hubungi pemilik warung.' }, 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Update employee last seen
    await db.update(employees)
      .set({ lastSeenAt: new Date() })
      .where(eq(employees.id, employee.id));

    // Get warung info from owner
    const owner = await db.query.users.findFirst({
      where: eq(users.id, employee.userId)
    });

    // Generate JWT token for employee
    const token = jwt.sign(
      {
        employeeId: employee.id,
        userId: employee.userId, // Owner's userId
        email: employee.email,
        role: 'employee',
        deviceId: employee.deviceId,
        warungId: employee.userId
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        role: 'employee',
        user: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          warungNama: owner?.warungNama || '',
          warungAlamat: owner?.warungAlamat || null,
          createdAt: employee.createdAt
        },
        token,
        deviceId: employee.deviceId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Verify token - supports both admin and employee
auth.post('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: number;
      employeeId?: number;
      email: string;
      role: string;
      deviceId?: string;
    };

    if (decoded.role === 'admin') {
      // Verify admin user
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId!)
      });

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json({
        success: true,
        data: {
          role: 'admin',
          user: {
            id: user.id,
            email: user.email,
            warungNama: user.warungNama,
            warungAlamat: user.warungAlamat
          },
          deviceId: decoded.deviceId
        }
      });
    } else {
      // Verify employee
      const employee = await db.query.employees.findFirst({
        where: eq(employees.id, decoded.employeeId!)
      });

      if (!employee || !employee.isActive) {
        return c.json({ error: 'Employee not found or inactive' }, 404);
      }

      // Get warung info
      const owner = await db.query.users.findFirst({
        where: eq(users.id, employee.userId)
      });

      return c.json({
        success: true,
        data: {
          role: 'employee',
          user: {
            id: employee.id,
            email: employee.email,
            name: employee.name,
            warungNama: owner?.warungNama || '',
            warungAlamat: owner?.warungAlamat || null
          },
          deviceId: employee.deviceId
        }
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default auth;

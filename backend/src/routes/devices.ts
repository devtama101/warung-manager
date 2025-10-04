import { Hono } from 'hono';
import { db } from '../db/index';
import { devices } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const deviceRoutes = new Hono();

// All device routes require authentication
deviceRoutes.use('/*', authMiddleware);

// Get all devices for the current user
deviceRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    const userDevices = await db.query.devices.findMany({
      where: eq(devices.userId, userId),
      orderBy: (devices, { desc }) => [desc(devices.lastSeenAt)]
    });

    return c.json({
      success: true,
      data: userDevices
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return c.json({ error: 'Failed to fetch devices' }, 500);
  }
});

// Update device name
deviceRoutes.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const deviceId = parseInt(c.req.param('id'));
    const { deviceName } = await c.req.json();

    if (!deviceName || deviceName.trim().length === 0) {
      return c.json({ error: 'Device name is required' }, 400);
    }

    // Verify the device belongs to the user
    const device = await db.query.devices.findFirst({
      where: and(
        eq(devices.id, deviceId),
        eq(devices.userId, userId)
      )
    });

    if (!device) {
      return c.json({ error: 'Device not found' }, 404);
    }

    // Update device name
    await db.update(devices)
      .set({ deviceName: deviceName.trim() })
      .where(eq(devices.id, deviceId));

    return c.json({
      success: true,
      message: 'Device name updated successfully'
    });
  } catch (error) {
    console.error('Update device error:', error);
    return c.json({ error: 'Failed to update device' }, 500);
  }
});

// Delete device
deviceRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const deviceId = parseInt(c.req.param('id'));

    // Verify the device belongs to the user
    const device = await db.query.devices.findFirst({
      where: and(
        eq(devices.id, deviceId),
        eq(devices.userId, userId)
      )
    });

    if (!device) {
      return c.json({ error: 'Device not found' }, 404);
    }

    // Delete the device
    await db.delete(devices).where(eq(devices.id, deviceId));

    return c.json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    console.error('Delete device error:', error);
    return c.json({ error: 'Failed to remove device' }, 500);
  }
});

// Register a new device for the current user
deviceRoutes.post('/register', async (c) => {
  try {
    const userId = c.get('userId');
    const { deviceId, deviceName } = await c.req.json();

    if (!deviceId || !deviceName) {
      return c.json({ error: 'Device ID and device name are required' }, 400);
    }

    // Check if device already exists
    const existingDevice = await db.query.devices.findFirst({
      where: eq(devices.deviceId, deviceId)
    });

    if (existingDevice) {
      // Update last seen time
      await db.update(devices)
        .set({ lastSeenAt: new Date() })
        .where(eq(devices.deviceId, deviceId));
    } else {
      // Create new device
      await db.insert(devices).values({
        userId,
        deviceId,
        deviceName,
        lastSeenAt: new Date()
      });
    }

    return c.json({
      success: true,
      message: 'Device registered successfully'
    });
  } catch (error) {
    console.error('Register device error:', error);
    return c.json({ error: 'Failed to register device' }, 500);
  }
});

export default deviceRoutes;

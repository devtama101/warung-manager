import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';
import { db } from './db/index';
import { devices, pesanan, menu, inventory, syncLogs, dailyReports } from './db/schema';
import { eq } from 'drizzle-orm';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import deviceRoutes from './routes/devices';
import employeeRoutes from './routes/employees';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

// Enable CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Warung POS API'
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Warung POS API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      sync: '/api/sync/*',
      data: '/api/data/*'
    }
  });
});

// Auth routes
app.route('/api/auth', authRoutes);

// Admin routes
app.route('/api/admin', adminRoutes);

// Device routes
app.route('/api/devices', deviceRoutes);

// Employee routes
app.route('/api/employees', employeeRoutes);

// Sync routes - with authentication
app.post('/api/sync/:table', authMiddleware, async (c) => {
  try {
    const table = c.req.param('table');
    const { action, recordId, data, timestamp, deviceId } = await c.req.json();

    // Get userId from auth middleware
    const userId = c.get('userId') as number;

    // Validate table name
    const validTables = ['pesanan', 'menu', 'inventory', 'dailyReport'];
    if (!validTables.includes(table)) {
      return c.json({ error: 'Invalid table' }, 400);
    }

    // Get device info to verify it belongs to the user
    const device = await db.query.devices.findFirst({
      where: eq(devices.deviceId, deviceId)
    });

    if (!device) {
      return c.json({ error: 'Device not found' }, 404);
    }

    if (device.userId !== userId) {
      return c.json({ error: 'Device does not belong to user' }, 403);
    }

    console.log(`Sync request: ${action} on ${table} for user ${userId}, device ${deviceId}`, {
      recordId,
      data,
      timestamp
    });

    // Process the sync action based on table
    let result;
    let syncError = null;

    try {
      switch (table) {
        case 'pesanan':
          result = await handlePesananSync(action, userId, deviceId, data);
          break;
        case 'menu':
          result = await handleMenuSync(action, userId, deviceId, data);
          break;
        case 'inventory':
          result = await handleInventorySync(action, userId, deviceId, data);
          break;
        case 'dailyReport':
          result = await handleDailyReportSync(action, userId, deviceId, data);
          break;
        default:
          return c.json({ error: 'Invalid table' }, 400);
      }

      if (!result.success) {
        syncError = result.error || 'Unknown error';
      }
    } catch (error) {
      syncError = error instanceof Error ? error.message : 'Unknown error';
      result = { success: false, error: syncError };
    }

    // Log the sync operation
    try {
      await db.insert(syncLogs).values({
        userId,
        deviceId,
        action: action as 'CREATE' | 'UPDATE' | 'DELETE',
        table,
        recordId: recordId || data?.id,
        data,
        success: result.success,
        error: syncError,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log sync operation:', logError);
      // Don't fail the request if logging fails
    }

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      message: `${action} operation on ${table} processed successfully`,
      data: {
        serverId: result.serverId,
        synced: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Sync endpoint error:', error);
    return c.json({ error: 'Failed to process sync request' }, 500);
  }
});

// Helper functions for handling sync operations
async function handlePesananSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newPesanan] = await db.insert(pesanan).values({
          userId,
          deviceId,
          localId: data.id,
          nomorMeja: data.nomorMeja,
          items: data.items,
          total: data.total,
          status: data.status,
          tanggal: new Date(data.tanggal),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        }).returning({ id: pesanan.id });
        console.log(`Created pesanan with localId ${data.id}, serverId ${newPesanan.id}`);
        return { success: true, serverId: newPesanan.id };

      case 'UPDATE':
        // Check if pesanan exists, if not create it
        const existingPesanan = await db.query.pesanan.findFirst({
          where: eq(pesanan.localId, data.id)
        });

        if (existingPesanan) {
          await db.update(pesanan)
            .set({
              status: data.status,
              updatedAt: new Date(data.updatedAt)
            })
            .where(eq(pesanan.localId, data.id));
          console.log(`Updated existing pesanan with localId ${data.id}, serverId ${existingPesanan.id}`);
          return { success: true, serverId: existingPesanan.id };
        } else {
          const [newPesanan] = await db.insert(pesanan).values({
            userId,
            deviceId,
            localId: data.id,
            nomorMeja: data.nomorMeja,
            items: data.items,
            total: data.total,
            status: data.status,
            tanggal: new Date(data.tanggal),
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          }).returning({ id: pesanan.id });
          console.log(`Created new pesanan with localId ${data.id}, serverId ${newPesanan.id}`);
          return { success: true, serverId: newPesanan.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Pesanan sync error:', error);
    return { success: false, error: 'Failed to sync pesanan' };
  }
}

async function handleMenuSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newMenu] = await db.insert(menu).values({
          userId,
          deviceId,
          localId: data.id,
          nama: data.nama,
          kategori: data.kategori,
          harga: data.harga,
          tersedia: data.tersedia,
          gambar: data.gambar,
          ingredients: data.ingredients,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        }).returning({ id: menu.id });
        console.log(`Created menu with localId ${data.id}, serverId ${newMenu.id}`);
        return { success: true, serverId: newMenu.id };

      case 'UPDATE':
        // Check if menu exists, if not create it
        const existingMenu = await db.query.menu.findFirst({
          where: eq(menu.localId, data.id)
        });

        if (existingMenu) {
          await db.update(menu)
            .set({
              nama: data.nama,
              kategori: data.kategori,
              harga: data.harga,
              tersedia: data.tersedia,
              gambar: data.gambar,
              ingredients: data.ingredients,
              updatedAt: new Date(data.updatedAt)
            })
            .where(eq(menu.localId, data.id));
          console.log(`Updated existing menu with localId ${data.id}, serverId ${existingMenu.id}`);
          return { success: true, serverId: existingMenu.id };
        } else {
          const [newMenu] = await db.insert(menu).values({
            userId,
            deviceId,
            localId: data.id,
            nama: data.nama,
            kategori: data.kategori,
            harga: data.harga,
            tersedia: data.tersedia,
            gambar: data.gambar,
            ingredients: data.ingredients,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          }).returning({ id: menu.id });
          console.log(`Created new menu with localId ${data.id}, serverId ${newMenu.id}`);
          return { success: true, serverId: newMenu.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Menu sync error:', error);
    return { success: false, error: 'Failed to sync menu' };
  }
}

async function handleInventorySync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newInventory] = await db.insert(inventory).values({
          userId,
          deviceId,
          localId: data.id,
          nama: data.nama,
          kategori: data.kategori,
          stok: data.stok,
          unit: data.unit,
          stokMinimum: data.stokMinimum,
          hargaBeli: data.hargaBeli,
          supplier: data.supplier,
          tanggalBeli: data.tanggalBeli ? new Date(data.tanggalBeli) : null,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        }).returning({ id: inventory.id });
        console.log(`Created inventory with localId ${data.id}, serverId ${newInventory.id}`);
        return { success: true, serverId: newInventory.id };

      case 'UPDATE':
        // Check if inventory exists, if not create it
        const existingInventory = await db.query.inventory.findFirst({
          where: eq(inventory.localId, data.id)
        });

        if (existingInventory) {
          await db.update(inventory)
            .set({
              nama: data.nama,
              kategori: data.kategori,
              stok: data.stok,
              unit: data.unit,
              stokMinimum: data.stokMinimum,
              hargaBeli: data.hargaBeli,
              supplier: data.supplier,
              tanggalBeli: data.tanggalBeli ? new Date(data.tanggalBeli) : null,
              updatedAt: new Date(data.updatedAt)
            })
            .where(eq(inventory.localId, data.id));
          console.log(`Updated existing inventory with localId ${data.id}, serverId ${existingInventory.id}`);
          return { success: true, serverId: existingInventory.id };
        } else {
          const [newInventory] = await db.insert(inventory).values({
            userId,
            deviceId,
            localId: data.id,
            nama: data.nama,
            kategori: data.kategori,
            stok: data.stok,
            unit: data.unit,
            stokMinimum: data.stokMinimum,
            hargaBeli: data.hargaBeli,
            supplier: data.supplier,
            tanggalBeli: data.tanggalBeli ? new Date(data.tanggalBeli) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          }).returning({ id: inventory.id });
          console.log(`Created new inventory with localId ${data.id}, serverId ${newInventory.id}`);
          return { success: true, serverId: newInventory.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Inventory sync error:', error);
    return { success: false, error: 'Failed to sync inventory' };
  }
}

async function handleDailyReportSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newReport] = await db.insert(dailyReports).values({
          userId,
          deviceId,
          tanggal: new Date(data.tanggal),
          totalPenjualan: data.totalPenjualan,
          totalPesanan: data.totalPesanan,
          totalModal: data.totalModal,
          keuntungan: data.keuntungan,
          itemTerlaris: data.itemTerlaris,
          createdAt: new Date(data.createdAt)
        }).returning({ id: dailyReports.id });
        console.log(`Created daily report for ${data.tanggal}, serverId ${newReport.id}`);
        return { success: true, serverId: newReport.id };

      case 'UPDATE':
        // Find existing report by date and device
        const existingReport = await db.query.dailyReports.findFirst({
          where: eq(dailyReports.tanggal, new Date(data.tanggal))
        });

        if (existingReport) {
          await db.update(dailyReports)
            .set({
              totalPenjualan: data.totalPenjualan,
              totalPesanan: data.totalPesanan,
              totalModal: data.totalModal,
              keuntungan: data.keuntungan,
              itemTerlaris: data.itemTerlaris
            })
            .where(eq(dailyReports.id, existingReport.id));
          console.log(`Updated daily report for ${data.tanggal}, serverId ${existingReport.id}`);
          return { success: true, serverId: existingReport.id };
        } else {
          // Create if not exists
          const [newReport] = await db.insert(dailyReports).values({
            userId,
            deviceId,
            tanggal: new Date(data.tanggal),
            totalPenjualan: data.totalPenjualan,
            totalPesanan: data.totalPesanan,
            totalModal: data.totalModal,
            keuntungan: data.keuntungan,
            itemTerlaris: data.itemTerlaris,
            createdAt: new Date(data.createdAt)
          }).returning({ id: dailyReports.id });
          console.log(`Created daily report for ${data.tanggal}, serverId ${newReport.id}`);
          return { success: true, serverId: newReport.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Daily report sync error:', error);
    return { success: false, error: 'Failed to sync daily report' };
  }
}

// Data routes
app.get('/api/data/latest', async (c) => {
  return c.json({
    message: 'Data pull endpoint - to be implemented',
    data: {
      pesanan: [],
      menu: [],
      inventory: [],
      dailyReports: []
    }
  });
});

app.get('/api/data/sync-status', async (c) => {
  return c.json({
    success: true,
    data: {
      lastSyncAt: new Date().toISOString(),
      pendingSyncs: 0,
      failedSyncs: 0
    }
  });
});

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});

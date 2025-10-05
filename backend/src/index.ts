import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { db } from './db/index';
import { devices, pesanan, menu, inventory, syncLogs, dailyReports, conflictLogs, inventoryEvents } from './db/schema';
import { eq } from 'drizzle-orm';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import deviceRoutes from './routes/devices';
import employeeRoutes from './routes/employees';
import resetRoutes from './routes/reset';
import uploadRoutes from './routes/upload';
import { authMiddleware } from './middleware/auth';
import './types';

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

// Reset routes (dangerous - only for development/testing)
app.route('/api/reset', resetRoutes);

// Upload routes
app.route('/api/upload', uploadRoutes);

// Serve static files for uploads
app.get('/uploads/*', async (c) => {
  const path = c.req.path.replace('/uploads/', '');
  const filePath = `./uploads/${path}`;

  try {
    // Read file
    const fileBuffer = await readFile(filePath);

    // Return file with appropriate content type
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' :
                      path.endsWith('.png') ? 'image/png' :
                      path.endsWith('.webp') ? 'image/webp' : 'application/octet-stream'
      }
    });
  } catch (error) {
    return c.json({ error: 'File not found' }, 404);
  }
});

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
          updatedAt: new Date(data.updatedAt),
          version: 1,
          lastModifiedBy: deviceId
        }).returning({ id: pesanan.id });
        console.log(`Created pesanan with localId ${data.id}, serverId ${newPesanan.id}`);
        return { success: true, serverId: newPesanan.id };

      case 'UPDATE':
        // Check if pesanan exists, if not create it
        const existingPesanan = await db.query.pesanan.findFirst({
          where: eq(pesanan.localId, data.id)
        });

        if (existingPesanan) {
          // Optimistic locking: check version
          const clientVersion = data.version || 1;
          if (existingPesanan.version !== clientVersion) {
            // Version conflict - log it
            await db.insert(conflictLogs).values({
              userId,
              deviceId,
              entityType: 'pesanan',
              entityId: existingPesanan.id,
              conflictType: 'VERSION_MISMATCH',
              clientData: data,
              serverData: existingPesanan,
              resolution: 'SERVER_WINS',
              resolvedBy: 'system',
              timestamp: new Date(),
              resolvedAt: new Date(),
              notes: `Client version ${clientVersion} vs Server version ${existingPesanan.version}`
            });

            console.warn(`Version conflict for pesanan localId ${data.id}: client ${clientVersion} vs server ${existingPesanan.version}`);

            // Return server data with conflict flag
            return {
              success: true,
              serverId: existingPesanan.id,
              conflict: true,
              serverData: existingPesanan,
              message: 'Version conflict resolved with server data'
            };
          }

          // Update with version increment
          await db.update(pesanan)
            .set({
              status: data.status,
              updatedAt: new Date(data.updatedAt),
              version: existingPesanan.version + 1,
              lastModifiedBy: deviceId
            })
            .where(eq(pesanan.localId, data.id));
          console.log(`Updated existing pesanan with localId ${data.id}, serverId ${existingPesanan.id}, version ${existingPesanan.version + 1}`);
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
            updatedAt: new Date(data.updatedAt),
            version: 1,
            lastModifiedBy: deviceId
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
          updatedAt: new Date(data.updatedAt),
          version: 1,
          lastModifiedBy: deviceId
        }).returning({ id: menu.id });
        console.log(`Created menu with localId ${data.id}, serverId ${newMenu.id}`);
        return { success: true, serverId: newMenu.id };

      case 'UPDATE':
        // Check if menu exists, if not create it
        const existingMenu = await db.query.menu.findFirst({
          where: eq(menu.localId, data.id)
        });

        if (existingMenu) {
          // Optimistic locking: check version
          const clientVersion = data.version || 1;
          if (existingMenu.version !== clientVersion) {
            // Version conflict - log it
            await db.insert(conflictLogs).values({
              userId,
              deviceId,
              entityType: 'menu',
              entityId: existingMenu.id,
              conflictType: 'VERSION_MISMATCH',
              clientData: data,
              serverData: existingMenu,
              resolution: 'SERVER_WINS',
              resolvedBy: 'system',
              timestamp: new Date(),
              resolvedAt: new Date(),
              notes: `Client version ${clientVersion} vs Server version ${existingMenu.version}`
            });

            console.warn(`Version conflict for menu localId ${data.id}: client ${clientVersion} vs server ${existingMenu.version}`);

            // Return server data with conflict flag
            return {
              success: true,
              serverId: existingMenu.id,
              conflict: true,
              serverData: existingMenu,
              message: 'Version conflict resolved with server data'
            };
          }

          // Update with version increment
          await db.update(menu)
            .set({
              nama: data.nama,
              kategori: data.kategori,
              harga: data.harga,
              tersedia: data.tersedia,
              gambar: data.gambar,
              ingredients: data.ingredients,
              updatedAt: new Date(data.updatedAt),
              version: existingMenu.version + 1,
              lastModifiedBy: deviceId
            })
            .where(eq(menu.localId, data.id));
          console.log(`Updated existing menu with localId ${data.id}, serverId ${existingMenu.id}, version ${existingMenu.version + 1}`);
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
            updatedAt: new Date(data.updatedAt),
            version: 1,
            lastModifiedBy: deviceId
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
          updatedAt: new Date(data.updatedAt),
          version: 1,
          lastModifiedBy: deviceId
        }).returning({ id: inventory.id });

        // Create initial inventory event
        await db.insert(inventoryEvents).values({
          userId,
          inventoryId: newInventory.id,
          eventType: 'INITIAL',
          quantity: data.stok,
          unit: data.unit,
          reason: 'Initial stock setup',
          referenceType: 'manual_setup',
          deviceId,
          timestamp: new Date(),
          syncedAt: new Date(),
          version: 1
        });

        console.log(`Created inventory with localId ${data.id}, serverId ${newInventory.id}`);
        return { success: true, serverId: newInventory.id };

      case 'UPDATE':
        // Check if inventory exists, if not create it
        const existingInventory = await db.query.inventory.findFirst({
          where: eq(inventory.localId, data.id)
        });

        if (existingInventory) {
          // Optimistic locking: check version
          const clientVersion = data.version || 1;
          if (existingInventory.version !== clientVersion) {
            // Version conflict - log it
            await db.insert(conflictLogs).values({
              userId,
              deviceId,
              entityType: 'inventory',
              entityId: existingInventory.id,
              conflictType: 'VERSION_MISMATCH',
              clientData: data,
              serverData: existingInventory,
              resolution: 'SERVER_WINS',
              resolvedBy: 'system',
              timestamp: new Date(),
              resolvedAt: new Date(),
              notes: `Client version ${clientVersion} vs Server version ${existingInventory.version}`
            });

            console.warn(`Version conflict for inventory localId ${data.id}: client ${clientVersion} vs server ${existingInventory.version}`);

            // Return server data with conflict flag
            return {
              success: true,
              serverId: existingInventory.id,
              conflict: true,
              serverData: existingInventory,
              message: 'Version conflict resolved with server data'
            };
          }

          // Calculate stock difference for event sourcing
          const stockDiff = Number(data.stok) - Number(existingInventory.stok);

          // Update with version increment
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
              updatedAt: new Date(data.updatedAt),
              version: existingInventory.version + 1,
              lastModifiedBy: deviceId
            })
            .where(eq(inventory.localId, data.id));

          // Create inventory event for stock change
          if (stockDiff !== 0) {
            await db.insert(inventoryEvents).values({
              userId,
              inventoryId: existingInventory.id,
              eventType: stockDiff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
              quantity: Math.abs(stockDiff),
              unit: data.unit,
              reason: 'Manual adjustment',
              referenceType: 'manual_adjustment',
              deviceId,
              timestamp: new Date(),
              syncedAt: new Date(),
              version: existingInventory.version + 1
            });
          }

          console.log(`Updated existing inventory with localId ${data.id}, serverId ${existingInventory.id}, version ${existingInventory.version + 1}`);
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
            updatedAt: new Date(data.updatedAt),
            version: 1,
            lastModifiedBy: deviceId
          }).returning({ id: inventory.id });

          // Create initial inventory event
          await db.insert(inventoryEvents).values({
            userId,
            inventoryId: newInventory.id,
            eventType: 'INITIAL',
            quantity: data.stok,
            unit: data.unit,
            reason: 'Initial stock setup',
            referenceType: 'manual_setup',
            deviceId,
            timestamp: new Date(),
            syncedAt: new Date(),
            version: 1
          });

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

const port = parseInt(process.env.PORT || '3002');

console.log(`🚀 Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});

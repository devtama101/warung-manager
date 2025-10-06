import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { db } from './db/index';
import { devices, orders, menuItems, inventoryItems, syncLogs, dailyReports, conflictLogs, inventoryEvents } from './db/schema';
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

// Enable CORS with proper security
const allowedOrigins = [
  'http://localhost:3002',
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use('/*', cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Warung Manager API'
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Warung Manager API',
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
    return new Response(fileBuffer.buffer as ArrayBuffer, {
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
    const validTables = ['orders', 'menuItems', 'inventoryItems', 'dailyReports'];
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
        case 'orders':
          result = await handleOrdersSync(action, userId, deviceId, data);
          break;
        case 'menuItems':
          result = await handleMenuItemsSync(action, userId, deviceId, data);
          break;
        case 'inventoryItems':
          result = await handleInventoryItemsSync(action, userId, deviceId, data);
          break;
        case 'dailyReports':
          result = await handleDailyReportsSync(action, userId, deviceId, data);
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
async function handleOrdersSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newOrder] = await db.insert(orders).values({
          userId,
          deviceId,
          localId: data.id,
          tableNumber: data.tableNumber,
          items: data.items,
          total: data.total,
          status: data.status,
          orderDate: new Date(data.orderDate),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          version: 1,
          lastModifiedBy: deviceId
        }).returning({ id: orders.id });
        console.log(`Created order with localId ${data.id}, serverId ${newOrder.id}`);
        return { success: true, serverId: newOrder.id };

      case 'UPDATE':
        // Check if order exists, if not create it
        const existingOrder = await db.query.orders.findFirst({
          where: eq(orders.localId, data.id)
        });

        if (existingOrder) {
          // Optimistic locking: check version
          const clientVersion = data.version || 1;
          if (existingOrder.version !== clientVersion) {
            // Version conflict - log it
            await db.insert(conflictLogs).values({
              userId,
              deviceId,
              entityType: 'orders',
              entityId: existingOrder.id,
              conflictType: 'VERSION_MISMATCH',
              clientData: data,
              serverData: existingOrder,
              resolution: 'SERVER_WINS',
              resolvedBy: 'system',
              timestamp: new Date(),
              resolvedAt: new Date(),
              notes: `Client version ${clientVersion} vs Server version ${existingOrder.version}`
            });

            console.warn(`Version conflict for order localId ${data.id}: client ${clientVersion} vs server ${existingOrder.version}`);

            // Return server data with conflict flag
            return {
              success: true,
              serverId: existingOrder.id,
              conflict: true,
              serverData: existingOrder,
              message: 'Version conflict resolved with server data'
            };
          }

          // Update with version increment
          await db.update(orders)
            .set({
              status: data.status,
              updatedAt: new Date(data.updatedAt),
              version: existingOrder.version + 1,
              lastModifiedBy: deviceId
            })
            .where(eq(orders.localId, data.id));
          console.log(`Updated existing order with localId ${data.id}, serverId ${existingOrder.id}, version ${existingOrder.version + 1}`);
          return { success: true, serverId: existingOrder.id };
        } else {
          const [newOrder] = await db.insert(orders).values({
            userId,
            deviceId,
            localId: data.id,
            tableNumber: data.tableNumber,
            items: data.items,
            total: data.total,
            status: data.status,
            orderDate: new Date(data.orderDate),
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            version: 1,
            lastModifiedBy: deviceId
          }).returning({ id: orders.id });
          console.log(`Created new order with localId ${data.id}, serverId ${newOrder.id}`);
          return { success: true, serverId: newOrder.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Order sync error:', error);
    return { success: false, error: 'Failed to sync order' };
  }
}

async function handleMenuItemsSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newMenuItem] = await db.insert(menuItems).values({
          userId,
          deviceId,
          localId: data.id,
          name: data.name,
          category: data.category,
          price: data.price,
          available: data.available,
          image: data.image,
          ingredients: data.ingredients,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          version: 1,
          lastModifiedBy: deviceId
        }).returning({ id: menuItems.id });
        console.log(`Created menu item with localId ${data.id}, serverId ${newMenuItem.id}`);
        return { success: true, serverId: newMenuItem.id };

      case 'UPDATE':
        // Check if menu item exists, if not create it
        const existingMenuItem = await db.query.menuItems.findFirst({
          where: eq(menuItems.localId, data.id)
        });

        if (existingMenuItem) {
          // Optimistic locking: check version
          const clientVersion = data.version || 1;
          if (existingMenuItem.version !== clientVersion) {
            // Version conflict - log it
            await db.insert(conflictLogs).values({
              userId,
              deviceId,
              entityType: 'menuItems',
              entityId: existingMenuItem.id,
              conflictType: 'VERSION_MISMATCH',
              clientData: data,
              serverData: existingMenuItem,
              resolution: 'SERVER_WINS',
              resolvedBy: 'system',
              timestamp: new Date(),
              resolvedAt: new Date(),
              notes: `Client version ${clientVersion} vs Server version ${existingMenuItem.version}`
            });

            console.warn(`Version conflict for menu item localId ${data.id}: client ${clientVersion} vs server ${existingMenuItem.version}`);

            // Return server data with conflict flag
            return {
              success: true,
              serverId: existingMenuItem.id,
              conflict: true,
              serverData: existingMenuItem,
              message: 'Version conflict resolved with server data'
            };
          }

          // Update with version increment
          await db.update(menuItems)
            .set({
              name: data.name,
              category: data.category,
              price: data.price,
              available: data.available,
              image: data.image,
              ingredients: data.ingredients,
              updatedAt: new Date(data.updatedAt),
              version: existingMenuItem.version + 1,
              lastModifiedBy: deviceId
            })
            .where(eq(menuItems.localId, data.id));
          console.log(`Updated existing menu item with localId ${data.id}, serverId ${existingMenuItem.id}, version ${existingMenuItem.version + 1}`);
          return { success: true, serverId: existingMenuItem.id };
        } else {
          const [newMenuItem] = await db.insert(menuItems).values({
            userId,
            deviceId,
            localId: data.id,
            name: data.name,
            category: data.category,
            price: data.price,
            available: data.available,
            image: data.image,
            ingredients: data.ingredients,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            version: 1,
            lastModifiedBy: deviceId
          }).returning({ id: menuItems.id });
          console.log(`Created new menu item with localId ${data.id}, serverId ${newMenuItem.id}`);
          return { success: true, serverId: newMenuItem.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Menu item sync error:', error);
    return { success: false, error: 'Failed to sync menu item' };
  }
}

async function handleInventoryItemsSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newInventoryItem] = await db.insert(inventoryItems).values({
          userId,
          deviceId,
          localId: data.id,
          name: data.name,
          category: data.category,
          stock: data.stock,
          unit: data.unit,
          minimumStock: data.minimumStock,
          purchasePrice: data.purchasePrice,
          supplier: data.supplier,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          version: 1,
          lastModifiedBy: deviceId
        }).returning({ id: inventoryItems.id });

        // Create initial inventory event
        await db.insert(inventoryEvents).values({
          userId,
          inventoryId: newInventoryItem.id,
          eventType: 'INITIAL',
          quantity: data.stock,
          unit: data.unit,
          reason: 'Initial stock setup',
          referenceType: 'manual_setup',
          deviceId,
          timestamp: new Date(),
          syncedAt: new Date(),
          version: 1
        });

        console.log(`Created inventory item with localId ${data.id}, serverId ${newInventoryItem.id}`);
        return { success: true, serverId: newInventoryItem.id };

      case 'UPDATE':
        // Check if inventory item exists, if not create it
        const existingInventoryItem = await db.query.inventoryItems.findFirst({
          where: eq(inventoryItems.localId, data.id)
        });

        if (existingInventoryItem) {
          // Optimistic locking: check version
          const clientVersion = data.version || 1;
          if (existingInventoryItem.version !== clientVersion) {
            // Version conflict - log it
            await db.insert(conflictLogs).values({
              userId,
              deviceId,
              entityType: 'inventoryItems',
              entityId: existingInventoryItem.id,
              conflictType: 'VERSION_MISMATCH',
              clientData: data,
              serverData: existingInventoryItem,
              resolution: 'SERVER_WINS',
              resolvedBy: 'system',
              timestamp: new Date(),
              resolvedAt: new Date(),
              notes: `Client version ${clientVersion} vs Server version ${existingInventoryItem.version}`
            });

            console.warn(`Version conflict for inventory item localId ${data.id}: client ${clientVersion} vs server ${existingInventoryItem.version}`);

            // Return server data with conflict flag
            return {
              success: true,
              serverId: existingInventoryItem.id,
              conflict: true,
              serverData: existingInventoryItem,
              message: 'Version conflict resolved with server data'
            };
          }

          // Calculate stock difference for event sourcing
          const stockDiff = Number(data.stock) - Number(existingInventoryItem.stock);

          // Update with version increment
          await db.update(inventoryItems)
            .set({
              name: data.name,
              category: data.category,
              stock: data.stock,
              unit: data.unit,
              minimumStock: data.minimumStock,
              purchasePrice: data.purchasePrice,
              supplier: data.supplier,
              purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
              updatedAt: new Date(data.updatedAt),
              version: existingInventoryItem.version + 1,
              lastModifiedBy: deviceId
            })
            .where(eq(inventoryItems.localId, data.id));

          // Create inventory event for stock change
          if (stockDiff !== 0) {
            await db.insert(inventoryEvents).values({
              userId,
              inventoryId: existingInventoryItem.id,
              eventType: stockDiff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
              quantity: Math.abs(stockDiff).toString(),
              unit: data.unit,
              reason: 'Manual adjustment',
              referenceType: 'manual_adjustment',
              deviceId,
              timestamp: new Date(),
              syncedAt: new Date(),
              version: existingInventoryItem.version + 1
            });
          }

          console.log(`Updated existing inventory item with localId ${data.id}, serverId ${existingInventoryItem.id}, version ${existingInventoryItem.version + 1}`);
          return { success: true, serverId: existingInventoryItem.id };
        } else {
          const [newInventoryItem] = await db.insert(inventoryItems).values({
            userId,
            deviceId,
            localId: data.id,
            name: data.name,
            category: data.category,
            stock: data.stock,
            unit: data.unit,
            minimumStock: data.minimumStock,
            purchasePrice: data.purchasePrice,
            supplier: data.supplier,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            version: 1,
            lastModifiedBy: deviceId
          }).returning({ id: inventoryItems.id });

          // Create initial inventory event
          await db.insert(inventoryEvents).values({
            userId,
            inventoryId: newInventoryItem.id,
            eventType: 'INITIAL',
            quantity: data.stock,
            unit: data.unit,
            reason: 'Initial stock setup',
            referenceType: 'manual_setup',
            deviceId,
            timestamp: new Date(),
            syncedAt: new Date(),
            version: 1
          });

          console.log(`Created new inventory item with localId ${data.id}, serverId ${newInventoryItem.id}`);
          return { success: true, serverId: newInventoryItem.id };
        }

      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Inventory item sync error:', error);
    return { success: false, error: 'Failed to sync inventory item' };
  }
}

async function handleDailyReportsSync(action: string, userId: number, deviceId: string, data: any) {
  try {
    switch (action) {
      case 'CREATE':
        const [newReport] = await db.insert(dailyReports).values({
          userId,
          deviceId,
          reportDate: new Date(data.reportDate),
          totalSales: data.totalSales,
          totalOrders: data.totalOrders,
          totalCost: data.totalCost,
          profit: data.profit,
          bestSellingItem: data.bestSellingItem,
          createdAt: new Date(data.createdAt),
          lastModifiedBy: deviceId
        }).returning({ id: dailyReports.id });
        console.log(`Created daily report for ${data.reportDate}, serverId ${newReport.id}`);
        return { success: true, serverId: newReport.id };

      case 'UPDATE':
        // Find existing report by date and device
        const existingReport = await db.query.dailyReports.findFirst({
          where: eq(dailyReports.reportDate, new Date(data.reportDate))
        });

        if (existingReport) {
          await db.update(dailyReports)
            .set({
              totalSales: data.totalSales,
              totalOrders: data.totalOrders,
              totalCost: data.totalCost,
              profit: data.profit,
              bestSellingItem: data.bestSellingItem
            })
            .where(eq(dailyReports.id, existingReport.id));
          console.log(`Updated daily report for ${data.reportDate}, serverId ${existingReport.id}`);
          return { success: true, serverId: existingReport.id };
        } else {
          // Create if not exists
          const [newReport] = await db.insert(dailyReports).values({
            userId,
            deviceId,
            reportDate: new Date(data.reportDate),
            totalSales: data.totalSales,
            totalOrders: data.totalOrders,
            totalCost: data.totalCost,
            profit: data.profit,
            bestSellingItem: data.bestSellingItem,
            createdAt: new Date(data.createdAt),
            lastModifiedBy: deviceId
          }).returning({ id: dailyReports.id });
          console.log(`Created daily report for ${data.reportDate}, serverId ${newReport.id}`);
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
app.get('/api/data/latest', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as number;

    // Get latest data for the authenticated user
    const latestOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: [desc(orders.updatedAt)],
      limit: 50
    });

    const latestMenuItems = await db.query.menuItems.findMany({
      where: eq(menuItems.userId, userId),
      orderBy: [desc(menuItems.updatedAt)],
      limit: 50
    });

    const latestInventoryItems = await db.query.inventoryItems.findMany({
      where: eq(inventoryItems.userId, userId),
      orderBy: [desc(inventoryItems.updatedAt)],
      limit: 50
    });

    const latestDailyReports = await db.query.dailyReports.findMany({
      where: eq(dailyReports.userId, userId),
      orderBy: [desc(dailyReports.reportDate)],
      limit: 30
    });

    // Convert decimal fields to numbers for frontend compatibility
    const convertDecimalFields = (items: any[]) => {
      return items.map(item => ({
        ...item,
        total: item.total ? Number(item.total) : 0,
        price: item.price ? Number(item.price) : 0,
        stock: item.stock ? Number(item.stock) : 0,
        minimumStock: item.minimumStock ? Number(item.minimumStock) : 0,
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : 0,
        totalSales: item.totalSales ? Number(item.totalSales) : 0,
        totalCost: item.totalCost ? Number(item.totalCost) : 0,
        profit: item.profit ? Number(item.profit) : 0,
      }));
    };

    return c.json({
      success: true,
      data: {
        orders: convertDecimalFields(latestOrders),
        menuItems: convertDecimalFields(latestMenuItems),
        inventoryItems: convertDecimalFields(latestInventoryItems),
        dailyReports: convertDecimalFields(latestDailyReports)
      }
    });
  } catch (error) {
    console.error('Data pull endpoint error:', error);
    return c.json({ error: 'Failed to fetch latest data' }, 500);
  }
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

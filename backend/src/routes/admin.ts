import { Hono } from 'hono';
import { db } from '../db/index';
import { users, devices, pesanan, menu, inventory, syncLogs } from '../db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const admin = new Hono();

// All admin routes require authentication
admin.use('/*', authMiddleware);

// Get all users (warungs)
admin.get('/users', async (c) => {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      with: {
        // This will be handled separately as Drizzle relations need to be defined
      }
    });

    // Get device count and order count for each user
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const [deviceCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(devices)
          .where(eq(devices.userId, user.id));

        const [orderStats] = await db
          .select({
            totalOrders: sql<number>`count(*)`,
            totalRevenue: sql<number>`coalesce(sum(${pesanan.total}), 0)`
          })
          .from(pesanan)
          .where(eq(pesanan.userId, user.id));

        const [lastOrder] = await db
          .select({ tanggal: pesanan.tanggal })
          .from(pesanan)
          .where(eq(pesanan.userId, user.id))
          .orderBy(desc(pesanan.tanggal))
          .limit(1);

        return {
          id: user.id,
          username: user.username,
          warungNama: user.warungNama,
          warungAlamat: user.warungAlamat,
          createdAt: user.createdAt,
          deviceCount: Number(deviceCount?.count || 0),
          totalOrders: Number(orderStats?.totalOrders || 0),
          totalRevenue: Number(orderStats?.totalRevenue || 0),
          lastOrderDate: lastOrder?.tanggal || null
        };
      })
    );

    return c.json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user details by ID
admin.get('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get devices
    const userDevices = await db.query.devices.findMany({
      where: eq(devices.userId, userId),
      orderBy: [desc(devices.lastSeenAt)]
    });

    // Get order statistics
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        completedOrders: sql<number>`count(*) filter (where ${pesanan.status} = 'completed')`,
        pendingOrders: sql<number>`count(*) filter (where ${pesanan.status} = 'pending')`,
        cancelledOrders: sql<number>`count(*) filter (where ${pesanan.status} = 'cancelled')`,
        totalRevenue: sql<number>`coalesce(sum(${pesanan.total}) filter (where ${pesanan.status} = 'completed'), 0)`
      })
      .from(pesanan)
      .where(eq(pesanan.userId, userId));

    // Get menu items count
    const [menuCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(menu)
      .where(eq(menu.userId, userId));

    // Get inventory items count
    const [inventoryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
      .where(eq(inventory.userId, userId));

    // Get recent orders
    const recentOrders = await db.query.pesanan.findMany({
      where: eq(pesanan.userId, userId),
      orderBy: [desc(pesanan.tanggal)],
      limit: 10
    });

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          warungNama: user.warungNama,
          warungAlamat: user.warungAlamat,
          createdAt: user.createdAt
        },
        devices: userDevices,
        stats: {
          totalOrders: Number(orderStats?.totalOrders || 0),
          completedOrders: Number(orderStats?.completedOrders || 0),
          pendingOrders: Number(orderStats?.pendingOrders || 0),
          cancelledOrders: Number(orderStats?.cancelledOrders || 0),
          totalRevenue: Number(orderStats?.totalRevenue || 0),
          menuItems: Number(menuCount?.count || 0),
          inventoryItems: Number(inventoryCount?.count || 0)
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return c.json({ error: 'Failed to fetch user details' }, 500);
  }
});

// Get revenue analytics
admin.get('/revenue', async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || 'month'; // today, month, 3months, year
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get total revenue stats
    const [totalStats] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${pesanan.total}), 0)`,
        totalOrders: sql<number>`count(*)`,
        activeUsers: sql<number>`count(distinct ${pesanan.userId})`
      })
      .from(pesanan)
      .where(
        and(
          gte(pesanan.tanggal, startDate),
          eq(pesanan.status, 'completed')
        )
      );

    const avgOrderValue = Number(totalStats?.totalOrders || 0) > 0
      ? Number(totalStats?.totalRevenue || 0) / Number(totalStats?.totalOrders || 0)
      : 0;

    // Get revenue by user
    const revenueByUser = await db
      .select({
        userId: pesanan.userId,
        totalRevenue: sql<number>`sum(${pesanan.total})`,
        totalOrders: sql<number>`count(*)`
      })
      .from(pesanan)
      .where(
        and(
          gte(pesanan.tanggal, startDate),
          eq(pesanan.status, 'completed')
        )
      )
      .groupBy(pesanan.userId)
      .orderBy(desc(sql`sum(${pesanan.total})`))
      .limit(10);

    // Get user names for revenue by user
    const revenueByUserWithNames = await Promise.all(
      revenueByUser.map(async (item) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, item.userId)
        });
        return {
          userId: item.userId,
          userName: user?.warungNama || 'Unknown',
          totalRevenue: Number(item.totalRevenue),
          totalOrders: Number(item.totalOrders),
          avgOrderValue: Number(item.totalRevenue) / Number(item.totalOrders)
        };
      })
    );

    // Get revenue by menu - calculate in app since JSON unnesting is problematic
    const completedOrders = await db
      .select()
      .from(pesanan)
      .where(
        and(
          gte(pesanan.tanggal, startDate),
          eq(pesanan.status, 'completed')
        )
      );

    // Aggregate menu revenue
    const menuRevenueMap = new Map<string, { revenue: number; qty: number }>();
    completedOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const existing = menuRevenueMap.get(item.menuNama) || { revenue: 0, qty: 0 };
          menuRevenueMap.set(item.menuNama, {
            revenue: existing.revenue + Number(item.subtotal || 0),
            qty: existing.qty + Number(item.qty || 0)
          });
        });
      }
    });

    const revenueByMenuFormatted = Array.from(menuRevenueMap.entries())
      .map(([menuNama, data]) => ({
        menuNama,
        totalRevenue: data.revenue,
        totalQty: data.qty,
        avgPrice: data.qty > 0 ? data.revenue / data.qty : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 20);

    // Get monthly revenue trend for 3months/year view
    let monthlyRevenue = [];
    if (timeRange === '3months' || timeRange === 'year') {
      const months = timeRange === '3months' ? 3 : 12;
      monthlyRevenue = await db
        .select({
          month: sql<string>`to_char(${pesanan.tanggal}, 'Mon YYYY')`,
          revenue: sql<number>`sum(${pesanan.total})`,
          orders: sql<number>`count(*)`
        })
        .from(pesanan)
        .where(
          and(
            gte(pesanan.tanggal, startDate),
            eq(pesanan.status, 'completed')
          )
        )
        .groupBy(sql`to_char(${pesanan.tanggal}, 'Mon YYYY')`)
        .orderBy(sql`to_char(${pesanan.tanggal}, 'Mon YYYY')`);
    }

    return c.json({
      success: true,
      data: {
        totalRevenue: Number(totalStats?.totalRevenue || 0),
        totalOrders: Number(totalStats?.totalOrders || 0),
        activeUsers: Number(totalStats?.activeUsers || 0),
        avgOrderValue,
        revenueByUser: revenueByUserWithNames,
        revenueByMenu: revenueByMenuFormatted,
        monthlyRevenue: monthlyRevenue.map(m => ({
          month: m.month,
          revenue: Number(m.revenue),
          orders: Number(m.orders)
        }))
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    return c.json({ error: 'Failed to fetch revenue analytics' }, 500);
  }
});

// Get system statistics
admin.get('/stats', async (c) => {
  try {
    // Get database statistics
    const [userStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [deviceStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(devices);

    const [orderStats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${pesanan.status} = 'completed')`,
        pending: sql<number>`count(*) filter (where ${pesanan.status} = 'pending')`,
        cancelled: sql<number>`count(*) filter (where ${pesanan.status} = 'cancelled')`,
        totalRevenue: sql<number>`coalesce(sum(${pesanan.total}), 0)`
      })
      .from(pesanan);

    const [menuStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(menu);

    const [inventoryStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory);

    // Get recent activity
    const recentOrders = await db.query.pesanan.findMany({
      orderBy: [desc(pesanan.tanggal)],
      limit: 10,
      with: {
        user: {
          columns: {
            warungNama: true
          }
        }
      }
    });

    // Get active devices (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [activeDeviceStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(devices)
      .where(gte(devices.lastSeenAt, twentyFourHoursAgo));

    return c.json({
      success: true,
      data: {
        database: {
          totalUsers: Number(userStats?.count || 0),
          totalDevices: Number(deviceStats?.count || 0),
          activeDevices: Number(activeDeviceStats?.count || 0),
          totalOrders: Number(orderStats?.total || 0),
          completedOrders: Number(orderStats?.completed || 0),
          pendingOrders: Number(orderStats?.pending || 0),
          cancelledOrders: Number(orderStats?.cancelled || 0),
          totalRevenue: Number(orderStats?.totalRevenue || 0),
          totalMenuItems: Number(menuStats?.count || 0),
          totalInventoryItems: Number(inventoryStats?.count || 0)
        },
        recentActivity: recentOrders.map(order => ({
          id: order.id,
          tanggal: order.tanggal,
          total: order.total,
          status: order.status,
          warungNama: order.user?.warungNama || 'Unknown'
        }))
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return c.json({ error: 'Failed to fetch system statistics' }, 500);
  }
});

// Get sync logs
admin.get('/sync-logs', async (c) => {
  try {
    const logs = await db.query.syncLogs.findMany({
      orderBy: [desc(syncLogs.timestamp)],
      limit: 100
    });

    return c.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get sync logs error:', error);
    return c.json({ error: 'Failed to fetch sync logs' }, 500);
  }
});

// Get synced data
admin.get('/synced-data', async (c) => {
  try {
    const allPesanan = await db.query.pesanan.findMany({
      orderBy: [desc(pesanan.createdAt)],
      limit: 50
    });

    const allMenu = await db.query.menu.findMany({
      orderBy: [desc(menu.createdAt)],
      limit: 50
    });

    const allInventory = await db.query.inventory.findMany({
      orderBy: [desc(inventory.createdAt)],
      limit: 50
    });

    return c.json({
      success: true,
      pesanan: allPesanan,
      menu: allMenu,
      inventory: allInventory
    });
  } catch (error) {
    console.error('Get synced data error:', error);
    return c.json({ error: 'Failed to fetch synced data' }, 500);
  }
});

// Delete synced record
admin.delete('/synced-data/:table/:id', async (c) => {
  try {
    const table = c.req.param('table');
    const id = parseInt(c.req.param('id'));

    switch (table) {
      case 'pesanan':
        await db.delete(pesanan).where(eq(pesanan.id, id));
        break;
      case 'menu':
        await db.delete(menu).where(eq(menu.id, id));
        break;
      case 'inventory':
        await db.delete(inventory).where(eq(inventory.id, id));
        break;
      default:
        return c.json({ error: 'Invalid table' }, 400);
    }

    return c.json({
      success: true,
      message: `Record deleted from ${table}`
    });
  } catch (error) {
    console.error('Delete synced record error:', error);
    return c.json({ error: 'Failed to delete record' }, 500);
  }
});

export default admin;

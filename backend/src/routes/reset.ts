import { Hono } from 'hono';
import { db } from '../db/index';
import { pesanan, dailyReports, syncLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const reset = new Hono();

// All reset routes require authentication
reset.use('/*', authMiddleware);

// Clear all order data (pesanan, dailyReports, syncLogs for orders)
reset.delete('/orders', async (c) => {
  try {
    const userId = c.get('userId') as number;

    // Delete all sync logs for this user
    await db.delete(syncLogs).where(eq(syncLogs.userId, userId));

    // Delete all daily reports for this user
    await db.delete(dailyReports).where(eq(dailyReports.userId, userId));

    // Delete all pesanan for this user
    const deletedOrders = await db.delete(pesanan).where(eq(pesanan.userId, userId)).returning({ id: pesanan.id });

    return c.json({
      success: true,
      message: `Successfully deleted ${deletedOrders.length} orders and all related data`,
      data: {
        deletedOrdersCount: deletedOrders.length,
        userId
      }
    });
  } catch (error) {
    console.error('Reset orders error:', error);
    return c.json({ error: 'Failed to reset orders' }, 500);
  }
});

// Clear all data for a user (pesanan, menu, inventory, reports, logs)
reset.delete('/all', async (c) => {
  try {
    const userId = c.get('userId') as number;

    // Import other tables
    const { menu, inventory } = await import('../db/schema');

    // Delete all sync logs for this user
    await db.delete(syncLogs).where(eq(syncLogs.userId, userId));

    // Delete all daily reports for this user
    await db.delete(dailyReports).where(eq(dailyReports.userId, userId));

    // Delete all pesanan for this user
    const deletedOrders = await db.delete(pesanan).where(eq(pesanan.userId, userId)).returning({ id: pesanan.id });

    // Delete all menu for this user
    const deletedMenu = await db.delete(menu).where(eq(menu.userId, userId)).returning({ id: menu.id });

    // Delete all inventory for this user
    const deletedInventory = await db.delete(inventory).where(eq(inventory.userId, userId)).returning({ id: inventory.id });

    return c.json({
      success: true,
      message: 'Successfully deleted all data for user',
      data: {
        deletedOrdersCount: deletedOrders.length,
        deletedMenuCount: deletedMenu.length,
        deletedInventoryCount: deletedInventory.length,
        userId
      }
    });
  } catch (error) {
    console.error('Reset all data error:', error);
    return c.json({ error: 'Failed to reset all data' }, 500);
  }
});

export default reset;
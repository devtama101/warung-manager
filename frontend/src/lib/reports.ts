import { db, DailyReport, getDeviceId } from '../db/schema';
import { syncManager } from './sync';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export type { DailyReport };

export interface ChartData {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface MenuRevenueData {
  menuName: string;
  totalQty: number;
  totalRevenue: number;
  avgPrice: number;
}

// Generate daily report for a specific date
export async function generateDailyReport(reportDate: Date): Promise<DailyReport> {
  const startDate = startOfDay(reportDate);
  const endDate = endOfDay(reportDate);

  // 1. Get all completed orders for the date
  const orders = await db.orders
    .where('orderDate')
    .between(startDate, endDate, true, true)
    .and(p => p.status === 'completed')
    .toArray();

  // 2. Calculate total sales
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  // 3. Calculate COGS (Cost of Goods Sold)
  let totalCost = 0;
  for (const order of orders) {
    for (const item of order.items) {
      // Get menu
      const menuItem = await db.menuItems.get(item.menuId);
      if (!menuItem) continue;

      // Calculate cost from ingredients
      for (const ing of menuItem.ingredients) {
        const inventoryItem = await db.inventoryItems.get(ing.inventoryId);
        if (!inventoryItem) continue;
        const cost = (ing.quantity * item.quantity) * inventoryItem.purchasePrice;
        totalCost += cost;
      }
    }
  }

  // 4. Calculate profit
  const profit = totalSales - totalCost;

  // 5. Find best-seller
  const itemCounts = new Map<string, number>();
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts.set(
        item.menuName,
        (itemCounts.get(item.menuName) || 0) + item.quantity
      );
    });
  });
  const bestSellingItem = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // 6. Create report
  const now = new Date();
  const deviceId = getDeviceId();

  const report: DailyReport = {
    reportDate: startDate,
    totalSales,
    totalOrders: orders.length,
    totalCost,
    profit,
    bestSellingItem,
    createdAt: now,
    syncStatus: 'pending',
    deviceId
  };

  // Check if report already exists for this date
  const existingReport = await db.dailyReports
    .where('reportDate')
    .equals(startDate)
    .first();

  if (existingReport) {
    // Update existing report
    await db.dailyReports.update(existingReport.id!, report);
    await syncManager.addToQueue('UPDATE', 'dailyReports', existingReport.id!, report);
    return { ...report, id: existingReport.id };
  } else {
    // Create new report
    const reportId = await db.dailyReports.add(report);
    await syncManager.addToQueue('CREATE', 'dailyReports', reportId, report);
    return { ...report, id: reportId };
  }
}

// Generate report for today
export async function generateTodayReport(): Promise<DailyReport> {
  return await generateDailyReport(new Date());
}

// Get report by date
export async function getReportByDate(date: Date): Promise<DailyReport | undefined> {
  const startDate = startOfDay(date);
  return await db.dailyReports
    .where('reportDate')
    .equals(startDate)
    .first();
}

// Get reports for date range
export async function getReportsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<DailyReport[]> {
  return await db.dailyReports
    .where('reportDate')
    .between(startOfDay(startDate), endOfDay(endDate), true, true)
    .reverse()
    .toArray();
}

// Get 7-day trend data
export async function get7DayTrend(): Promise<ChartData[]> {
  const today = new Date();
  const data: ChartData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const report = await getReportByDate(date);

    data.push({
      date: format(date, 'MMM d'),
      revenue: report?.totalSales || 0,
      profit: report?.profit || 0,
      orders: report?.totalOrders || 0
    });
  }

  return data;
}

// Get monthly summary
export async function getMonthlySummary(year: number, month: number): Promise<{
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  averageDailyRevenue: number;
}> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const reports = await getReportsByDateRange(startDate, endDate);

  const totalRevenue = reports.reduce((sum, r) => sum + r.totalSales, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.totalOrders, 0);
  const averageDailyRevenue = reports.length > 0 ? totalRevenue / reports.length : 0;

  return {
    totalRevenue,
    totalProfit,
    totalOrders,
    averageDailyRevenue
  };
}

// Get menu revenue breakdown for today
export async function getMenuRevenueBreakdown(reportDate: Date = new Date()): Promise<MenuRevenueData[]> {
  const startDate = startOfDay(reportDate);
  const endDate = endOfDay(reportDate);

  // Get all completed orders for the date
  const orders = await db.orders
    .where('orderDate')
    .between(startDate, endDate, true, true)
    .and(p => p.status === 'completed')
    .toArray();

  // Aggregate revenue by menu item
  const menuRevenueMap = new Map<string, { qty: number; revenue: number }>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = menuRevenueMap.get(item.menuName) || { qty: 0, revenue: 0 };
      menuRevenueMap.set(item.menuName, {
        qty: existing.qty + item.quantity,
        revenue: existing.revenue + item.subtotal
      });
    });
  });

  // Convert to array and sort by revenue (descending)
  const menuRevenueData: MenuRevenueData[] = Array.from(menuRevenueMap.entries())
    .map(([menuName, data]) => ({
      menuName,
      totalQty: data.qty,
      totalRevenue: data.revenue,
      avgPrice: data.revenue / data.qty
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return menuRevenueData;
}

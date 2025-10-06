import { db, Order, OrderItem, getDeviceId } from '../db/schema';
import { syncManager } from './sync';
import { deductStockFromOrder } from './inventory';
import { startOfDay, endOfDay } from 'date-fns';

export type { Order, OrderItem };

// Create order
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number> {
  const now = new Date();
  const deviceId = getDeviceId();

  const orderId = await db.orders.add({
    ...orderData,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    deviceId
  });

  // Add to sync queue
  await syncManager.addToQueue('CREATE', 'orders', orderId, {
    ...orderData,
    createdAt: now,
    updatedAt: now
  });

  return orderId;
}

// Get today's orders
export async function getTodayOrders(): Promise<Order[]> {
  const today = new Date();
  const startDate = startOfDay(today);
  const endDate = endOfDay(today);

  const orders = await db.orders
    .where('orderDate')
    .between(startDate, endDate, true, true)
    .reverse()
    .toArray();

  return orders;
}

// Get orders by date range
export async function getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
  const orders = await db.orders
    .where('orderDate')
    .between(startOfDay(startDate), endOfDay(endDate), true, true)
    .reverse()
    .toArray();

  return orders;
}

// Get orders by status
export async function getOrdersByStatus(status: 'pending' | 'completed' | 'cancelled'): Promise<Order[]> {
  return await db.orders
    .where('status')
    .equals(status)
    .reverse()
    .toArray();
}

// Update order status
export async function updateOrderStatus(orderId: number, status: 'pending' | 'completed' | 'cancelled'): Promise<void> {
  const now = new Date();

  await db.orders.update(orderId, {
    status,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const order = await db.orders.get(orderId);
  if (order) {
    await syncManager.addToQueue('UPDATE', 'orders', orderId, order);
  }
}

// Complete order (and deduct inventory)
export async function completeOrder(orderId: number): Promise<void> {
  const order = await db.orders.get(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'completed') {
    throw new Error('Order already completed');
  }

  // Update status
  await updateOrderStatus(orderId, 'completed');

  // Deduct inventory
  await deductStockFromOrder(order);
}

// Cancel order
export async function cancelOrder(orderId: number): Promise<void> {
  await updateOrderStatus(orderId, 'cancelled');
}

// Get order by ID
export async function getOrderById(orderId: number): Promise<Order | undefined> {
  return await db.orders.get(orderId);
}

// Delete order
export async function deleteOrder(orderId: number): Promise<void> {
  await db.orders.delete(orderId);
  await syncManager.addToQueue('DELETE', 'orders', orderId, { id: orderId });
}

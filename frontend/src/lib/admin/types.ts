// Admin Dashboard Types

export interface User {
  id: string;
  email: string;
  warungNama: string;
  ownerName: string;
  phone?: string;
  planType: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'expired' | 'trial' | 'cancelled';
  subscriptionStart: Date;
  subscriptionEnd: Date;
  createdAt: Date;
  lastActive: Date;
  deviceCount: number;
}

export interface UserStats {
  totalRevenue: number;
  totalOrders: number;
  totalMenuItems: number;
  totalInventoryItems: number;
  averageOrderValue: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  growthRate: number; // percentage
}

export interface PlanFeatures {
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: {
    maxDevices: number;
    maxMenuItems: number;
    maxUsers: number;
    advancedReports: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  newUsersThisMonth: number;
  churnRate: number;
  planDistribution: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
}

export interface RevenueData {
  month: string;
  revenue: number;
  newUsers: number;
  churnedUsers: number;
}

import { User, AdminDashboardStats, RevenueData, UserStats } from './types';

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'warung.sejahtera@email.com',
    warungNama: 'Warung Sejahtera',
    ownerName: 'Budi Santoso',
    phone: '081234567890',
    planType: 'premium',
    subscriptionStatus: 'active',
    subscriptionStart: new Date('2024-01-15'),
    subscriptionEnd: new Date('2025-01-15'),
    createdAt: new Date('2024-01-15'),
    lastActive: new Date('2025-01-03'),
    deviceCount: 3
  },
  {
    id: '2',
    email: 'makan.enak@email.com',
    warungNama: 'Warung Makan Enak',
    ownerName: 'Siti Aminah',
    phone: '082345678901',
    planType: 'basic',
    subscriptionStatus: 'active',
    subscriptionStart: new Date('2024-06-10'),
    subscriptionEnd: new Date('2025-06-10'),
    createdAt: new Date('2024-06-10'),
    lastActive: new Date('2025-01-04'),
    deviceCount: 2
  },
  {
    id: '3',
    email: 'nasi.padang@email.com',
    warungNama: 'Rumah Makan Padang',
    ownerName: 'Ahmad Rifai',
    phone: '083456789012',
    planType: 'enterprise',
    subscriptionStatus: 'active',
    subscriptionStart: new Date('2023-12-01'),
    subscriptionEnd: new Date('2024-12-01'),
    createdAt: new Date('2023-12-01'),
    lastActive: new Date('2025-01-04'),
    deviceCount: 5
  },
  {
    id: '4',
    email: 'kopi.corner@email.com',
    warungNama: 'Kopi Corner',
    ownerName: 'Dewi Lestari',
    phone: '084567890123',
    planType: 'free',
    subscriptionStatus: 'trial',
    subscriptionStart: new Date('2024-12-25'),
    subscriptionEnd: new Date('2025-01-08'),
    createdAt: new Date('2024-12-25'),
    lastActive: new Date('2025-01-03'),
    deviceCount: 1
  },
  {
    id: '5',
    email: 'soto.ayam@email.com',
    warungNama: 'Soto Ayam Pak Haji',
    ownerName: 'Haji Mahmud',
    phone: '085678901234',
    planType: 'basic',
    subscriptionStatus: 'expired',
    subscriptionStart: new Date('2024-01-01'),
    subscriptionEnd: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    lastActive: new Date('2024-12-28'),
    deviceCount: 2
  }
];

export const mockAdminStats: AdminDashboardStats = {
  totalUsers: 247,
  activeUsers: 189,
  trialUsers: 34,
  totalRevenue: 458750000, // Rp 458.75 juta
  monthlyRecurringRevenue: 42350000, // Rp 42.35 juta
  newUsersThisMonth: 23,
  churnRate: 4.2,
  planDistribution: {
    free: 34,
    basic: 128,
    premium: 67,
    enterprise: 18
  }
};

export const mockRevenueData: RevenueData[] = [
  { month: 'Jul', revenue: 35500000, newUsers: 18, churnedUsers: 3 },
  { month: 'Aug', revenue: 38200000, newUsers: 22, churnedUsers: 5 },
  { month: 'Sep', revenue: 39800000, newUsers: 19, churnedUsers: 4 },
  { month: 'Oct', revenue: 41200000, newUsers: 25, churnedUsers: 6 },
  { month: 'Nov', revenue: 40500000, newUsers: 21, churnedUsers: 8 },
  { month: 'Dec', revenue: 42350000, newUsers: 23, churnedUsers: 5 }
];

// Mock user statistics
export const getUserStats = (userId: string): UserStats => {
  // In real app, this would fetch from API
  return {
    totalRevenue: Math.random() * 50000000,
    totalOrders: Math.floor(Math.random() * 5000),
    totalMenuItems: Math.floor(Math.random() * 50) + 10,
    totalInventoryItems: Math.floor(Math.random() * 100) + 20,
    averageOrderValue: Math.random() * 100000 + 20000,
    revenueThisMonth: Math.random() * 5000000,
    ordersThisMonth: Math.floor(Math.random() * 500),
    growthRate: Math.random() * 30 - 5 // -5% to +25%
  };
};

// Mock functions
export const getAllUsers = async (): Promise<User[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUsers;
};

export const getAdminStats = async (): Promise<AdminDashboardStats> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockAdminStats;
};

export const getRevenueData = async (): Promise<RevenueData[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRevenueData;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUsers.find(u => u.id === id);
};

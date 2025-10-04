import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WarungUser {
  id: number;
  username: string;
  warungNama: string;
  warungAlamat?: string;
  createdAt: string;
  deviceCount: number;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string | null;
}

export function Users() {
  const [users, setUsers] = useState<WarungUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminAuth');
      if (!token) {
        console.error('No admin token found');
        return;
      }

      const authData = JSON.parse(token);
      // For now, we'll use a mock token since admin auth is separate
      // In production, you'd implement proper admin authentication

      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
        }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.warungNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all user accounts and subscriptions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search by warung name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map(user => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{user.warungNama}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Username</p>
                        <p className="font-medium">{user.username}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Address</p>
                        <p className="font-medium">{user.warungAlamat || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Devices</p>
                        <p className="font-medium">{user.deviceCount} device(s)</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Orders</p>
                        <p className="font-medium">{user.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Revenue</p>
                        <p className="font-medium text-green-600">{formatCurrency(user.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Registered</p>
                        <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  <Link to={`/admin/users/${user.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye size={16} className="mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> warungs
            </span>
            <span className="text-gray-600">
              Total Revenue: <span className="font-semibold text-green-600">{formatCurrency(users.reduce((sum, u) => sum + u.totalRevenue, 0))}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

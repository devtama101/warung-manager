import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllUsers } from '@/lib/admin/mockData';
import { User } from '@/lib/admin/types';
import { formatDateTime } from '@/lib/utils';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.warungNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || user.subscriptionStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: User['subscriptionStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle size={12} /> Active</Badge>;
      case 'trial':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock size={12} /> Trial</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle size={12} /> Expired</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="flex items-center gap-1"><XCircle size={12} /> Cancelled</Badge>;
    }
  };

  const getPlanBadge = (plan: User['planType']) => {
    const colors = {
      free: 'bg-gray-500',
      basic: 'bg-blue-500',
      premium: 'bg-purple-500',
      enterprise: 'bg-yellow-500'
    };
    return (
      <Badge className={`${colors[plan]} text-white`}>
        <Award size={12} className="mr-1" />
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all user accounts and subscriptions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search by warung name, owner, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2">
          {['all', 'active', 'trial', 'expired'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status as any)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
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
                      {getStatusBadge(user.subscriptionStatus)}
                      {getPlanBadge(user.planType)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-600">Owner</p>
                        <p className="font-medium">{user.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">{user.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Subscription Period</p>
                        <p className="font-medium">
                          {new Date(user.subscriptionStart).toLocaleDateString('id-ID')} - {new Date(user.subscriptionEnd).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Active</p>
                        <p className="font-medium">{formatDateTime(user.lastActive)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Devices</p>
                        <p className="font-medium">{user.deviceCount} device(s)</p>
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
              Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
            </span>
            <span className="text-gray-600">
              Active: <span className="font-semibold text-green-600">{users.filter(u => u.subscriptionStatus === 'active').length}</span> |
              Trial: <span className="font-semibold text-yellow-600 ml-2">{users.filter(u => u.subscriptionStatus === 'trial').length}</span> |
              Expired: <span className="font-semibold text-red-600 ml-2">{users.filter(u => u.subscriptionStatus === 'expired').length}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

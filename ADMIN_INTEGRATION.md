# Admin Dashboard Integration

## Overview

The admin dashboard is now fully integrated with the backend PostgreSQL database, displaying real data from all registered warungs.

## Backend API Endpoints

All admin endpoints are protected by JWT authentication and accessible at `/api/admin/*`:

### 1. Get All Users (Warungs)
**Endpoint:** `GET /api/admin/users`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "warungmaju",
      "warungNama": "Warung Maju Jaya",
      "warungAlamat": "Jl. Raya No. 123",
      "createdAt": "2025-10-04T00:39:24.144Z",
      "deviceCount": 2,
      "totalOrders": 15,
      "totalRevenue": 450000,
      "lastOrderDate": "2025-10-04T10:30:00Z"
    }
  ]
}
```

### 2. Get User Details
**Endpoint:** `GET /api/admin/users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "warungmaju",
      "warungNama": "Warung Maju Jaya",
      "warungAlamat": "Jl. Raya No. 123",
      "createdAt": "2025-10-04T00:39:24.144Z"
    },
    "devices": [...],
    "stats": {
      "totalOrders": 15,
      "completedOrders": 12,
      "pendingOrders": 2,
      "cancelledOrders": 1,
      "totalRevenue": 450000,
      "menuItems": 8,
      "inventoryItems": 12
    },
    "recentOrders": [...]
  }
}
```

### 3. Get Revenue Analytics
**Endpoint:** `GET /api/admin/revenue?timeRange=month`

**Query Parameters:**
- `timeRange`: `today`, `month`, `3months`, `year`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 1500000,
    "totalOrders": 45,
    "activeUsers": 3,
    "avgOrderValue": 33333,
    "revenueByUser": [...],
    "revenueByMenu": [...],
    "monthlyRevenue": [...]
  }
}
```

### 4. Get Sync Logs
**Endpoint:** `GET /api/admin/sync-logs`

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "userId": 4,
      "deviceId": "emp_kasir1_001",
      "action": "CREATE",
      "table": "pesanan",
      "recordId": 123,
      "data": {...},
      "timestamp": "2025-10-04T10:30:00Z",
      "success": true,
      "error": null
    }
  ]
}
```

### 5. Get Synced Data
**Endpoint:** `GET /api/admin/synced-data`

**Response:**
```json
{
  "success": true,
  "pesanan": [...],
  "menu": [...],
  "inventory": [...]
}
```

### 6. Delete Synced Record
**Endpoint:** `DELETE /api/admin/synced-data/:table/:id`

**Parameters:**
- `table`: `pesanan`, `menu`, or `inventory`
- `id`: Record ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Record deleted from pesanan"
}
```

## Frontend Pages

### 1. Users Management (`/admin/users`)
- Lists all registered warungs
- Displays:
  - Warung name and username
  - Address
  - Device count
  - Total orders and revenue
  - Registration date
- Search functionality by warung name or username
- Click "View Details" to see individual warung details

### 2. User Details (`/admin/users/:id`)
- Detailed view of a single warung
- Shows:
  - **Warung Information**: Name, address, registration date
  - **Statistics**: Total revenue, orders, menu items, inventory items
  - **Registered Devices**: All devices with last seen dates
  - **Recent Orders**: Last 10 orders with status and totals

### 3. Revenue Analytics (`/admin/revenue`)
- Cross-warung revenue analysis
- Time range filters: Today, This Month, 3 Months, Year
- Displays:
  - **Key Metrics**: Total revenue, orders, avg order value, active warungs
  - **Revenue Trend**: Line chart for 3 months/year view
  - **Top Warungs**: Top 10 warungs by revenue
  - **Revenue by Menu**: Pie chart and detailed table
  - **Menu Performance**: All menu items with quantities and revenue

### 4. Sync Management (`/admin/sync`)
- Monitor all sync operations from employee devices
- Features:
  - **Sync Logs**: View all CREATE/UPDATE/DELETE operations
  - **Filter by Table**: View pesanan, menu, inventory separately
  - **Data Review**: Preview synced data before accepting
  - **Delete Records**: Remove incorrect/duplicate synced data
  - **Error Tracking**: See failed syncs with error messages
- Displays:
  - Total sync count
  - Synced data counts per table
  - Status indicators (✅ success / ❌ error)
  - Device ID and timestamp for each sync

## Authentication

Admin routes use JWT authentication with admin tokens stored in `localStorage.getItem('adminAuthToken')`.

Employee devices use warung auth tokens stored in `localStorage.getItem('warungAuthToken')`.

The sync endpoint accepts both token types for flexibility:

```typescript
// Admin accessing admin endpoints
const response = await axios.get(`${API_URL}/api/admin/sync-logs`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('adminAuthToken')}`
  }
});

// Employee syncing data
const response = await axios.post(`${API_URL}/api/sync/pesanan`, data, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
  }
});
```

## Data Flow

### Employee → Database Flow:
1. **Employee Login**: Login via `/login` with email/password
2. **Create Orders**: Orders saved to local IndexedDB
3. **Auto-Sync**: Every 5 minutes, pending changes sync to PostgreSQL
4. **Sync Logging**: All operations logged to `sync_logs` table
5. **Admin Review**: Admin can view/manage synced data via Sync Management

### Data Sync Architecture:
```
Employee Device (IndexedDB)
    ↓ Auto-sync every 5 min
PostgreSQL Database
    ↓ Real-time query
Admin Dashboard
```

Employee devices work **offline-first**:
- All operations save to local IndexedDB first
- Queue syncs when offline
- Auto-sync when connection restored
- Admin has full control to review/delete synced data

## Testing

### Create Test Data

1. **Register multiple warungs:**
```bash
# Warung 1
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"warung1","password":"test123456","warungNama":"Warung Satu"}'

# Warung 2
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"warung2","password":"test123456","warungNama":"Warung Dua"}'
```

2. **Login to each warung and create orders**

3. **View in admin dashboard:**
   - Navigate to http://localhost:5173/admin/login
   - Login with admin credentials
   - View Users and Revenue pages

## Future Enhancements

1. **Separate Admin Authentication**
   - Create dedicated admin user table
   - Implement admin-specific JWT tokens
   - Add role-based access control

2. **Real-time Updates**
   - WebSocket integration for live data
   - Auto-refresh on new orders
   - Push notifications for admin

3. **Advanced Analytics**
   - Customer retention metrics
   - Peak hours analysis
   - Inventory forecasting
   - Revenue predictions

4. **Export Features**
   - Export to CSV/Excel
   - PDF reports
   - Email reports

5. **User Management**
   - Suspend/activate warung accounts
   - Edit warung information
   - Reset passwords
   - View audit logs

## Security Considerations

1. **Authentication**: All admin endpoints require valid JWT token
2. **Authorization**: Only admin users should access these endpoints
3. **Data Privacy**: Sensitive warung data should be properly protected
4. **Rate Limiting**: Implement rate limiting on admin endpoints
5. **Audit Logging**: Log all admin actions for security

## Notes

- All monetary values are stored as `DECIMAL(10,2)` in the database
- Dates are stored as PostgreSQL `TIMESTAMP` with timezone
- Order items are stored as JSON for flexibility
- Device tracking enables multi-device support per warung

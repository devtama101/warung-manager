# Product Requirements Document (PRD)
## Warung POS System - Version 3.0

**Updated:** October 5, 2024
**Status:** Production Ready with Enterprise-Grade Architecture
**Current State:** Advanced Multi-Device Support with Conflict Resolution

---

## 📋 **Executive Summary**

Warung POS adalah aplikasi Point of Sale (POS) modern untuk warung/kedai kecil-menengah dengan arsitektur **offline-first hybrid** yang canggih. Aplikasi dapat beroperasi tanpa internet dan secara otomatis sinkronisasi data ke server saat koneksi tersedia.

### **🎯 Core Value Proposition**
- **Offline First**: Operasi penuh tanpa internet
- **Real-time Sync**: Sinkronisasi otomatis saat online dengan conflict prevention
- **Multi-user**: Admin & Employee roles dengan device management
- **Cloud Backup**: Data aman di server dengan gambar management
- **Mobile Responsive**: Desktop & Mobile friendly
- **✨ NEW**: **Enterprise-Grade Data Integrity** - Optimistic locking & conflict resolution
- **✨ NEW**: **Event Sourcing** - Complete audit trail for inventory
- **✨ NEW**: **Multi-Device Safe** - Concurrent operation support without data loss

---

## 🏗️ **Architecture Overview**

### **📱 Frontend (React + TypeScript)**
- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Context API + Local State
- **UI Components**: Tailwind CSS + Shadcn/ui
- **Charts**: Recharts untuk analytics
- **Database**: IndexedDB (Dexie) untuk offline storage
- **Authentication**: JWT tokens untuk multi-user

### **🗄️ Backend (Node.js + Hono)**
- **Framework**: Hono (TypeScript-first web framework)
- **Database**: PostgreSQL dengan Drizzle ORM
- **Authentication**: JWT dengan role-based access
- **File Upload**: Image compression & storage management
- **API**: RESTful dengan real-time sync capabilities

### **🔄 Sync Architecture (Enhanced)**
- **Offline Storage**: IndexedDB di client dengan version tracking
- **Sync Queue**: Enhanced priority queue dengan retry mechanism
- **Conflict Resolution**: **Optimistic locking** dengan visual admin interface
- **Real-time**: Background sync dengan exponential backoff
- **✨ NEW**: **Event Sourcing** - Immutable event logs for inventory
- **✨ NEW**: **Version Control** - Prevents concurrent data overwrites
- **✨ NEW**: **Conflict Analytics** - Detailed conflict tracking & resolution

---

## 👥 **User Roles & Permissions**

### **👨‍💼 Admin / Owner**
- **Full Access**: Semua fitur aplikasi
- **User Management**: Create/manage employee accounts
- **Device Management**: Register & monitor devices
- **Analytics**: Complete revenue & business insights
- **Data Control**: Reset, export, backup data
- **Menu Management**: Full CRUD untuk menu items

### **👨‍🍳 Employee / Kasir**
- **Limited Access**: Operational features only
- **Order Management**: Create, edit, complete orders
- **Menu View**: View menu (limited editing)
- **Basic Reports**: Daily operational reports
- **Device Bound**: Login terikat ke device spesifik

---

## 📱 **Features Matrix**

### **🎯 Core POS Features**

| Feature | Status | Description | User Access |
|---------|--------|-------------|-------------|
| **Dashboard** | ✅ Complete | Real-time stats, today's performance, recent orders | Admin, Employee |
| **Order Management** | ✅ Complete | Create, edit, complete orders with table numbers | Admin, Employee |
| **Menu Management** | ✅ Complete | CRUD menu items, categories, pricing, images | Admin |
| **Inventory Management** | ✅ Complete | Track stock, alerts, purchase management | Admin |
| **Payment Processing** | ✅ Complete | Cash, digital payments, order completion | Admin, Employee |
| **Order History** | ✅ Complete | Search, filter, detailed order views | Admin, Employee |

### **📊 Analytics & Reporting**

| Feature | Status | Description | User Access |
|---------|--------|-------------|-------------|
| **Revenue Dashboard** | ✅ Complete | Revenue trends, profit analysis, time ranges | Admin |
| **Order Monitoring** | ✅ Complete | Real-time order tracking, status management | Admin |
| **Sales Reports** | ✅ Complete | Daily, weekly, monthly sales analytics | Admin |
| **Menu Performance** | ✅ Complete | Best/worst selling items, profit margins | Admin |
| **Customer Analytics** | ✅ Complete | Order patterns, peak hours analysis | Admin |

### **🔧 Technical Features**

| Feature | Status | Description | Implementation |
|---------|--------|-------------|----------------|
| **Offline Mode** | ✅ Complete | Full operation without internet | IndexedDB + Sync Queue |
| **Real-time Sync** | ✅ Complete | Automatic data synchronization | Background sync with retry |
| **Multi-device Support** | ✅ Complete | Multiple devices per warung | Device registration system |
| **Image Management** | ✅ Complete | Upload, compress, store menu images | Server storage + fallback |
| **Data Backup/Restore** | ✅ Complete | Manual & automatic data backup | Export/Import functionality |
| **User Authentication** | ✅ Complete | Secure multi-user login system | JWT with role management |

### **🛠️ Advanced Features**

| Feature | Status | Description | Implementation |
|---------|--------|-------------|----------------|
| **Database Debug Tools** | ✅ Complete | Real-time IndexedDB monitoring | Custom debugger + web interface |
| **Profit Analytics** | ✅ Complete | Detailed profit margin analysis | Revenue vs cost calculations |
| **Sync Management** | ✅ Complete | Monitor & manage data synchronization | Admin interface |
| **Data Reset Options** | ✅ Complete | Selective data clearing capabilities | Multiple reset modes |
| **Device Analytics** | ✅ Complete | Track device usage & performance | Per-device statistics |

### **🔐 Enterprise Architecture Features (NEW)**

| Feature | Status | Description | Implementation |
|---------|--------|-------------|----------------|
| **Optimistic Locking** | ✅ Complete | Prevents data loss in multi-device environments | Version fields + conflict detection |
| **Conflict Resolution System** | ✅ Complete | Visual conflict management for admins | Web interface + resolution strategies |
| **Event Sourcing (Inventory)** | ✅ Complete | Complete audit trail for all inventory changes | Immutable event logs |
| **Enhanced Sync Queue** | ✅ Complete | Priority-based sync with retry mechanisms | V2 sync queue system |
| **Multi-Device Concurrency** | ✅ Complete | Safe concurrent operations across devices | Server-authority reconciliation |
| **Conflict Analytics** | ✅ Complete | Track and analyze sync conflicts | Statistics + resolution tracking |
| **Version Control System** | ✅ Complete | Track every change with metadata | Audit trail + rollback capability |
| **Stock Snapshots** | ✅ Complete | Periodic inventory verification system | Time-based stock levels |

---

## 🗄️ **Database Schema**

### **📱 Client Side (IndexedDB)**

#### **Pesanan (Orders)**
```typescript
interface Pesanan {
  id?: number;                    // Local auto-increment
  serverId?: string;              // Server ID after sync
  nomorMeja?: string;             // Table number
  items: PesananItem[];           // Order items
  total: number;                  // Total amount
  status: 'pending' | 'completed' | 'cancelled';
  tanggal: Date;                  // Order date
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;               // Device identifier
}
```

#### **Menu (Items)**
```typescript
interface Menu {
  id?: number;
  serverId?: string;
  nama: string;                   // Item name
  kategori: 'makanan' | 'minuman' | 'snack';
  harga: number;                  // Selling price
  hargaModal: number;             // Cost price
  tersedia: boolean;              // Availability
  gambar?: string;                // Image (Base64 or URL)
  ingredients: MenuIngredient[];  // Raw materials link
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}
```

#### **Inventory (Raw Materials)**
```typescript
interface Inventory {
  id?: number;
  serverId?: string;
  nama: string;                   // Material name
  kategori: 'bahan_baku' | 'kemasan' | 'lainnya';
  stok: number;                   // Current stock
  unit: string;                   // Unit (kg, pcs, liter)
  stokMinimum: number;            // Minimum stock alert
  hargaBeli: number;              // Purchase price
  supplier?: string;              // Supplier info
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}
```

### **🗄️ Server Side (PostgreSQL - Enhanced)**

#### **Users & Authentication**
```sql
users (id, email, password, warung_nama, warung_alamat, role)
employees (id, user_id, email, password, name, device_id)
devices (id, user_id, device_id, device_name, last_seen_at)
```

#### **Business Data (with Optimistic Locking)**
```sql
pesanan (id, user_id, device_id, local_id, nomor_meja, items, total, status, tanggal, version, last_modified_by)
menu (id, user_id, device_id, local_id, nama, kategori, harga, tersedia, gambar, ingredients, version, last_modified_by)
inventory (id, user_id, device_id, local_id, nama, kategori, stok, unit, harga_beli, version, last_modified_by)
daily_reports (id, user_id, device_id, tanggal, total_penjualan, total_pesanan, total_modal, keuntungan, version, last_modified_by)
sync_logs (id, user_id, device_id, action, table, record_id, success, error, timestamp)
```

#### **✨ NEW: Conflict Resolution & Event Sourcing Tables**
```sql
-- Conflict Resolution
conflict_logs (id, user_id, device_id, entity_type, entity_id, conflict_type, client_data, server_data, resolved_data, resolution, resolved_by, timestamp, resolved_at, notes)

-- Inventory Event Sourcing
inventory_events (id, user_id, inventory_id, event_type, quantity, unit, reason, reference_type, reference_id, device_id, timestamp, synced_at, version)

-- Stock Verification
inventory_snapshots (id, user_id, inventory_id, stock_level, unit, timestamp, device_id, verified_by, notes)

-- Enhanced Sync Management
sync_queue_v2 (id, user_id, device_id, entity_type, entity_id, action, data, priority, retry_count, max_retries, next_retry_at, status, created_at, processed_at, error)
```

---

## 🔄 **Enhanced Sync Logic with Optimistic Locking**

### **📤 Client → Server Flow (Enhanced)**
1. **Create/Update/Delete**: Data stored in IndexedDB with version tracking
2. **Queue Management**: Operation added to enhanced sync queue (V2) with priority
3. **Background Sync**: Automatic retry with exponential backoff
4. **Server Processing**:
   - Version validation for optimistic locking
   - Conflict detection and logging
   - Automatic or manual resolution
   - Store in PostgreSQL with version increment
5. **Response Handling**: Update local sync status and version

### **📥 Server → Client Flow (Enhanced)**
1. **Data Pull**: Client requests latest data from server with version check
2. **Conflict Resolution**: Multi-strategy resolution system
   - **Automatic**: Server authority for version mismatches
   - **Manual**: Admin interface for complex conflicts
   - **Merge**: Smart merging for compatible changes
3. **Local Update**: Update IndexedDB with server data and new version
4. **Cache Refresh**: Clear local cache if version conflict detected

### **🔄 Advanced Conflict Handling (NEW)**
- **Optimistic Locking**: Version-based conflict prevention
- **Resolution Strategies**:
  - **SERVER_WINS**: Server data takes precedence (default)
  - **CLIENT_WINS**: Client data preserved when appropriate
  - **MANUAL_MERGE**: Admin-controlled manual merging
- **Conflict Analytics**: Detailed tracking and statistics
- **Event Sourcing**: Complete audit trail for inventory changes
- **Multi-Device Safe**: Concurrent operations without data loss

---

## 🖼️ **Image Management System**

### **📤 Upload Process**
1. **File Selection**: User selects image file
2. **Validation**: Type (JPEG/PNG/WebP) and size check (max 2MB)
3. **Compression**: Client-side compression (max 800x600, quality 80%)
4. **Upload**: Send to server with authentication
5. **Storage**: Store in `/uploads/menu-images/user-{id}/`
6. **Response**: Return image URL for storage

### **📱 Storage Strategy**
- **Primary**: Server storage with URL references
- **Fallback**: Base64 for offline mode
- **Limits**: 100 images per user, 2MB per image
- **Backup**: Preserved during local data clearing

### **🔄 Sync Integration**
- **URL Priority**: Server URLs used when online
- **Base64 Fallback**: Local storage when offline
- **Automatic Conversion**: Seamless switching between storage types

---

## 🔍 **Debug & Monitoring Tools**

### **📊 Database Monitor**
- **Location**: `/admin/debug`
- **Features**:
  - Real-time statistics dashboard
  - Search across all tables
  - Table data viewer with pagination
  - Export data to JSON
  - Sync queue monitoring
  - Selective data clearing

### **💻 Console Commands**
```javascript
// Available globally in browser console
debugDB.stats()              // Database statistics
debugDB.monitor()            // Real-time monitoring
debugDB.search('term')      // Search data
debugDB.export()             // Export all data
debugDB.pending()            // Check sync queue
debugDB.health()             // Database health check
```

### **🛠️ Development Tools**
- **Chrome DevTools**: Application → IndexedDB
- **Network Monitoring**: Sync requests tracking
- **Error Logging**: Comprehensive error reporting
- **Performance Metrics**: Sync speed & success rates

---

## 🔐 **Security Features**

### **🔑 Authentication**
- **JWT Tokens**: Secure authentication with expiration
- **Role-Based Access**: Admin vs Employee permissions
- **Device Binding**: Employee accounts tied to specific devices
- **Session Management**: Automatic logout on token expiration

### **🛡️ Data Protection**
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size validation
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: Input sanitization and secure rendering

### **🔒 Access Control**
- **API Authentication**: Required for all endpoints
- **User Isolation**: Data separated by user ID
- **Device Authorization**: Device registration required
- **Admin Overrides**: Admin can access all user data

---

## 📱 **Mobile Responsiveness**

### **📱 Mobile Features**
- **Touch Interface**: Optimized for touch interactions
- **Responsive Design**: Adapts to all screen sizes
- **Mobile Menu**: Collapsible navigation
- **Swipe Gestures**: Supported for image carousels
- **Offline Capability**: Full functionality without internet

### **🖥️ Desktop Features**
- **Keyboard Navigation**: Full keyboard support
- **Mouse Interactions**: Hover states and tooltips
- **Multi-window**: Can work across multiple browser tabs
- **Print Support**: Receipt and report printing

---

## 🚀 **Deployment & Infrastructure**

### **🖥️ Local Development**
- **Frontend**: `npm run dev` (port 5174)
- **Backend**: `npm run dev` (port 3002)
- **Database**: Local PostgreSQL instance
- **Environment**: Development configuration with hot reload

### **☁️ Production Requirements**
- **Frontend**: Static hosting (Vercel, Netlify, etc.)
- **Backend**: Node.js server with PM2 process management
- **Database**: PostgreSQL database with regular backups
- **File Storage**: Local filesystem with backup strategy
- **SSL**: HTTPS required for production

### **📊 Monitoring**
- **Application Metrics**: Performance and usage tracking
- **Error Tracking**: Comprehensive error logging
- **Database Health**: Monitoring connection and performance
- **Sync Status**: Real-time sync success rates

---

## 🔄 **Future Roadmap**

### **Phase 3 - Enhancements** (Q4 2024)
- **Customer Management**: Regular customer tracking
- **Loyalty Program**: Points and rewards system
- **Advanced Reporting**: Custom report builder
- **API Integrations**: Payment gateway connections
- **Mobile App**: Native iOS/Android applications

### **Phase 4 - Scaling** (Q1 2025)
- **Multi-warung Support**: Chain management capabilities
- **Advanced Inventory**: Supplier management, purchase orders
- **Employee Scheduling**: Shift planning and time tracking
- **Advanced Analytics**: Business intelligence dashboard
- **Cloud Hosting**: Managed cloud deployment

---

## 📋 **Testing & Quality Assurance**

### **🧪 Test Coverage**
- **Unit Tests**: Core business logic validation
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user journey validation
- **Offline Testing**: Network disconnection scenarios
- **Cross-browser Testing**: Chrome, Firefox, Safari compatibility

### **🔍 Quality Metrics**
- **Performance**: < 2s load time, < 100ms interactions
- **Reliability**: 99.9% uptime, < 1% sync failure rate
- **Usability**: 90% task completion rate
- **Mobile**: 95% mobile usability score

---

## 📞 **Support & Maintenance**

### **🛠️ Regular Maintenance**
- **Database Backups**: Automated daily backups
- **Log Rotation**: Prevent log file bloat
- **Security Updates**: Regular dependency updates
- **Performance Monitoring**: Continuous performance tracking
- **User Support**: Issue tracking and resolution

### **📚 Documentation**
- **User Guide**: Complete user documentation
- **Admin Guide**: Administrative operations manual
- **Developer Guide**: Technical documentation
- **API Documentation**: Complete API reference
- **Troubleshooting**: Common issues and solutions

---

## 📈 **Success Metrics**

### **🎯 Business KPIs**
- **User Adoption**: Target 100+ warungs in 6 months
- **User Retention**: 90% monthly retention rate
- **Transaction Volume**: 10,000+ orders/month
- **Revenue Growth**: 25% average revenue increase for users
- **Customer Satisfaction**: 4.5+ star rating

### **🔧 Technical KPIs**
- **Uptime**: 99.9% availability
- **Sync Success**: 99%+ sync success rate
- **Performance**: < 2s page load time
- **Mobile Usage**: 60%+ mobile usage
- **Offline Usage**: 30%+ offline operations

---

**Document Version**: 3.0
**Last Updated**: October 5, 2024
**Next Review**: December 2024

---

*This PRD reflects the current state of the Warung POS application as of October 5, 2024. All features listed are implemented and tested unless explicitly marked as planned.*
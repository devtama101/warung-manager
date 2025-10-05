# Database Migration Guide

## Overview

This guide helps you migrate an existing Warung POS installation to the new enterprise-grade architecture (v3.0) with optimistic locking and conflict resolution capabilities.

## 🚨 Important Migration Notes

### What This Migration Adds
- **Version fields** to all data tables for optimistic locking
- **Conflict resolution** system with logging
- **Event sourcing** for inventory management
- **Enhanced sync queue** with retry mechanisms
- **Stock snapshots** for periodic verification

### Data Safety
- ✅ All existing data is preserved
- ✅ Migration is reversible (with backup)
- ✅ No breaking changes to existing functionality
- ✅ Can be performed while application is running

---

## 📋 Prerequisites

### Before You Start
1. **Backup your database** - Full PostgreSQL backup
2. **Stop all client devices** from syncing during migration
3. **Update backend code** to the latest version
4. **Review migration script** before execution

### System Requirements
- PostgreSQL 12 or higher
- Node.js 20+ (for backend)
- Current Warung POS installation

---

## 🔄 Migration Process

### Option 1: Automated Migration (Recommended)

#### 1. Update Backend Code
```bash
# Pull latest code
git pull origin main

# Install new dependencies
cd backend
npm install
```

#### 2. Run Migration via Application
```bash
# The application will detect missing tables/fields and offer to migrate
npm run db:migrate

# Or run explicitly
npm run db:migrate:up
```

#### 3. Verify Migration
```bash
# Check migration status
npm run db:migrate:status

# Should show: "Migration 001_add_version_fields completed"
```

### Option 2: Manual SQL Migration

#### 1. Locate Migration Script
```
backend/migrations/001_add_version_fields.sql
```

#### 2. Execute SQL Script
```bash
# Via psql
psql -U postgres -d warung_pos -f migrations/001_add_version_fields.sql

# Or via Docker
docker-compose exec api psql -U postgres -d warung_pos -f migrations/001_add_version_fields.sql
```

#### 3. Verify Tables Created
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('inventory_events', 'inventory_snapshots', 'sync_queue_v2', 'conflict_logs');

-- Check version fields added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pesanan' AND column_name = 'version';
```

---

## 🗃️ Database Schema Changes

### Version Fields Added
```sql
-- Added to all data tables
ALTER TABLE pesanan ADD COLUMN version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE pesanan ADD COLUMN last_modified_by TEXT NOT NULL DEFAULT '';

-- Same for: menu, inventory, daily_reports
```

### New Tables Created

#### 1. `conflict_logs`
Tracks all sync conflicts and resolutions
```sql
conflict_logs (
    id, user_id, device_id, entity_type, entity_id,
    conflict_type, client_data, server_data, resolved_data,
    resolution, resolved_by, timestamp, resolved_at, notes
)
```

#### 2. `inventory_events`
Event sourcing for inventory changes
```sql
inventory_events (
    id, user_id, inventory_id, event_type, quantity, unit,
    reason, reference_type, reference_id, device_id,
    timestamp, synced_at, version
)
```

#### 3. `inventory_snapshots`
Periodic stock verification
```sql
inventory_snapshots (
    id, user_id, inventory_id, stock_level, unit,
    timestamp, device_id, verified_by, notes
)
```

#### 4. `sync_queue_v2`
Enhanced sync queue with priority
```sql
sync_queue_v2 (
    id, user_id, device_id, entity_type, entity_id,
    action, data, priority, retry_count, max_retries,
    next_retry_at, status, created_at, processed_at, error
)
```

### Indexes Added
```sql
-- Performance indexes
CREATE INDEX idx_pesanan_version ON pesanan(version);
CREATE INDEX idx_conflict_logs_entity ON conflict_logs(entity_type, entity_id);
CREATE INDEX idx_inventory_events_timestamp ON inventory_events(timestamp);
-- ... and more
```

---

## 🔍 Post-Migration Verification

### 1. Check Application Works
```bash
# Start backend
npm run dev

# Start frontend
cd ../frontend && npm run dev

# Test basic operations:
# - Create order
# - Update menu item
# - Adjust inventory
# - Generate report
```

### 2. Verify Sync Functionality
1. Login as admin
2. Go to Sync Management page
3. Check for pending sync items
4. Verify new conflict resolution UI appears

### 3. Test New Features
1. **Conflict Resolution**:
   - Create same order on two devices simultaneously
   - Check admin conflict resolution interface

2. **Event Sourcing**:
   - Adjust inventory stock
   - Check inventory events are logged

3. **Version Tracking**:
   - Update menu item
   - Verify version number increments

---

## ⚠️ Troubleshooting

### Migration Fails
```sql
-- Check if migration was partially applied
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'inventory_%' OR table_name = 'conflict_logs';

-- Rollback if needed (requires backup)
DROP TABLE IF EXISTS conflict_logs;
DROP TABLE IF EXISTS inventory_events;
DROP TABLE IF EXISTS inventory_snapshots;
DROP TABLE IF EXISTS sync_queue_v2;
-- Restore from backup
```

### Version Fields Missing
```sql
-- Manually add version fields if migration missed them
ALTER TABLE pesanan ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE pesanan ADD COLUMN IF NOT EXISTS last_modified_by TEXT NOT NULL DEFAULT '';
```

### Client Compatibility Issues
- Update frontend code to latest version
- Clear browser localStorage/IndexedDB
- Re-login all users

### Performance Issues
- Run `ANALYZE` on PostgreSQL database
- Check if indexes were created properly
- Monitor query performance

---

## 🔄 Rollback Plan

### If Issues Occur
1. **Stop the application**
2. **Restore database backup**:
   ```bash
   psql -U postgres -d warung_pos < backup_before_migration.sql
   ```
3. **Revert code** to previous version
4. **Verify functionality** works again

### Partial Rollback
```sql
-- Remove new tables (keep data)
DROP TABLE IF EXISTS sync_queue_v2;
DROP TABLE IF EXISTS conflict_logs;
DROP TABLE IF EXISTS inventory_events;
DROP TABLE IF EXISTS inventory_snapshots;

-- Remove version fields
ALTER TABLE pesanan DROP COLUMN IF EXISTS version;
ALTER TABLE pesanan DROP COLUMN IF EXISTS last_modified_by;
-- Repeat for other tables
```

---

## 📞 Support

### Migration Issues
1. Check application logs: `npm run logs`
2. Review PostgreSQL logs
3. Verify all prerequisites met
4. Contact support with:
   - Database version
   - Migration script output
   - Application logs

### Post-Migration Questions
- See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for new conflict resolution features
- See [README.md](./README.md) for technical details
- Check [PRD.md](./PRD.md) for architecture overview

---

## ✅ Migration Checklist

### Before Migration
- [ ] Database backup created
- [ ] All devices stopped syncing
- [ ] Backend code updated
- [ ] Migration script reviewed
- [ ] Maintenance window scheduled

### During Migration
- [ ] Migration script executed
- [ ] No error messages
- [ ] All tables created successfully
- [ ] Indexes applied correctly

### After Migration
- [ ] Application starts successfully
- [ ] Basic operations work
- [ ] Sync functionality verified
- [ ] New features tested
- [ ] Performance acceptable
- [ ] Users notified of new features

---

**Migration Version**: 001_add_version_fields
**Compatible With**: Warung POS v3.0+
**Required For**: Multi-device conflict resolution and optimistic locking
**Estimated Time**: 5-15 minutes
**Downtime**: None (can be performed live)
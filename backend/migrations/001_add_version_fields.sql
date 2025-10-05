-- Migration: Add version fields and conflict resolution tables
-- This script adds optimistic locking and conflict resolution capabilities

-- Add version fields to existing tables
ALTER TABLE pesanan ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE pesanan ADD COLUMN IF NOT EXISTS last_modified_by TEXT NOT NULL DEFAULT '';

ALTER TABLE menu ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE menu ADD COLUMN IF NOT EXISTS last_modified_by TEXT NOT NULL DEFAULT '';

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS last_modified_by TEXT NOT NULL DEFAULT '';

ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS last_modified_by TEXT NOT NULL DEFAULT '';

-- Create inventory events table for event sourcing
CREATE TABLE IF NOT EXISTS inventory_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    inventory_id INTEGER NOT NULL REFERENCES inventory(id),
    event_type TEXT NOT NULL, -- 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'INITIAL'
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT,
    reference_type TEXT, -- 'pesanan', 'purchase', 'manual_adjustment'
    reference_id INTEGER,
    device_id TEXT NOT NULL REFERENCES devices(deviceId),
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    synced_at TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Create inventory snapshots table for periodic stock verification
CREATE TABLE IF NOT EXISTS inventory_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    inventory_id INTEGER NOT NULL REFERENCES inventory(id),
    stock_level DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    device_id TEXT NOT NULL REFERENCES devices(deviceId),
    verified_by TEXT NOT NULL, -- Who performed the verification
    notes TEXT
);

-- Create enhanced sync queue table
CREATE TABLE IF NOT EXISTS sync_queue_v2 (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL REFERENCES devices(deviceId),
    entity_type TEXT NOT NULL, -- 'pesanan', 'menu', 'inventory', etc.
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    data JSONB NOT NULL,
    priority INTEGER DEFAULT 1 NOT NULL, -- 1=low, 2=medium, 3=high
    retry_count INTEGER DEFAULT 0 NOT NULL,
    max_retries INTEGER DEFAULT 5 NOT NULL,
    next_retry_at TIMESTAMP,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMP,
    error TEXT
);

-- Create conflict resolution logs table
CREATE TABLE IF NOT EXISTS conflict_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL REFERENCES devices(deviceId),
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    conflict_type TEXT NOT NULL, -- 'VERSION_MISMATCH', 'DATA_CONFLICT', 'DELETE_CONFLICT'
    client_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    resolved_data JSONB,
    resolution TEXT NOT NULL, -- 'SERVER_WINS', 'CLIENT_WINS', 'MANUAL_MERGE', 'PENDING'
    resolved_by TEXT, -- 'system', 'admin', userId
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP,
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_events_inventory_id ON inventory_events(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_events_timestamp ON inventory_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_inventory_id ON inventory_snapshots(inventory_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_v2_status ON sync_queue_v2(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_v2_next_retry ON sync_queue_v2(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_conflict_logs_entity ON conflict_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_conflict_logs_timestamp ON conflict_logs(timestamp);

-- Add indexes for version fields
CREATE INDEX IF NOT EXISTS idx_pesanan_version ON pesanan(version);
CREATE INDEX IF NOT EXISTS idx_menu_version ON menu(version);
CREATE INDEX IF NOT EXISTS idx_inventory_version ON inventory(version);
CREATE INDEX IF NOT EXISTS idx_daily_reports_version ON daily_reports(version);

COMMIT;
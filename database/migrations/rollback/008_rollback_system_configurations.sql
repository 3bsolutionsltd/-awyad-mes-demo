-- Rollback: 008 - Create System Configurations
-- Description: Drops system_configurations table
-- Date: 2026-01-22

-- Drop trigger
DROP TRIGGER IF EXISTS update_system_configurations_updated_at ON system_configurations;

-- Drop indexes
DROP INDEX IF EXISTS idx_system_configurations_metadata;
DROP INDEX IF EXISTS idx_system_configurations_parent;
DROP INDEX IF EXISTS idx_system_configurations_active;
DROP INDEX IF EXISTS idx_system_configurations_type_code;
DROP INDEX IF EXISTS idx_system_configurations_code;
DROP INDEX IF EXISTS idx_system_configurations_type;

-- Drop table
DROP TABLE IF EXISTS system_configurations CASCADE;

-- Rollback complete

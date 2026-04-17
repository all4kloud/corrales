-- Add is_active column to all entity tables for soft delete functionality

-- Add is_active to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add is_active to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add is_active to lenders table
ALTER TABLE lenders 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add is_active to attorneys table
ALTER TABLE attorneys 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_lenders_is_active ON lenders(is_active);
CREATE INDEX IF NOT EXISTS idx_attorneys_is_active ON attorneys(is_active);

COMMENT ON COLUMN customers.is_active IS 'Soft delete flag - false means deleted';
COMMENT ON COLUMN agents.is_active IS 'Soft delete flag - false means deleted';
COMMENT ON COLUMN lenders.is_active IS 'Soft delete flag - false means deleted';
COMMENT ON COLUMN attorneys.is_active IS 'Soft delete flag - false means deleted';

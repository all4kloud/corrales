-- Add is_active field to all entity tables for soft delete functionality
-- This allows admin and manager roles to hide/deactivate entities instead of permanently deleting them

-- Add is_active to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to lenders table
ALTER TABLE lenders 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to attorneys table
ALTER TABLE attorneys 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_lenders_is_active ON lenders(is_active);
CREATE INDEX IF NOT EXISTS idx_attorneys_is_active ON attorneys(is_active);

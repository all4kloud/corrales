-- Add preferred_language column to customers and agents tables

-- Add to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'es' CHECK (preferred_language IN ('en', 'es'));

-- Add to agents table  
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'es' CHECK (preferred_language IN ('en', 'es'));

COMMENT ON COLUMN customers.preferred_language IS 'Customer preferred language for portal interface';
COMMENT ON COLUMN agents.preferred_language IS 'Agent preferred language for portal interface';

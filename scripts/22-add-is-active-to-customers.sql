-- Add is_active column to customers table for soft deletes
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing customers to active
UPDATE customers 
SET is_active = true 
WHERE is_active IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

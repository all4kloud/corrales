-- Add user_id column to customers table to link with portal user accounts
-- This enables customers to access the client portal

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Add portal_access_enabled flag
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT FALSE;

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('user_id', 'portal_access_enabled');

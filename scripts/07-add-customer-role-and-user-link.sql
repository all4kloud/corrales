-- Add customer role to roles table
INSERT INTO roles (name, description, permissions, is_active) VALUES
('customer', 'Customer portal access - view only their own transactions', '["view_transactions", "view_follow_ups"]', true)
ON CONFLICT (name) DO NOTHING;

-- Add user_id column to customers table to link customers to user accounts
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

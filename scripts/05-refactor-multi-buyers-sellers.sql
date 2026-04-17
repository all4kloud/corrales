-- Add middle_name field to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Create junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS transaction_buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_id, customer_id)
);

CREATE TABLE IF NOT EXISTS transaction_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_id, customer_id)
);

-- Migrate existing data from transactions table to junction tables
INSERT INTO transaction_buyers (transaction_id, customer_id)
SELECT id, buyer_id 
FROM transactions 
WHERE buyer_id IS NOT NULL 
ON CONFLICT (transaction_id, customer_id) DO NOTHING;

INSERT INTO transaction_sellers (transaction_id, customer_id)
SELECT id, seller_id 
FROM transactions 
WHERE seller_id IS NOT NULL
ON CONFLICT (transaction_id, customer_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_buyers_transaction ON transaction_buyers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_buyers_customer ON transaction_buyers(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_sellers_transaction ON transaction_sellers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_sellers_customer ON transaction_sellers(customer_id);

-- Remove old buyer_id and seller_id columns from transactions
-- (Keep them for now for backward compatibility, mark as deprecated in documentation)
-- ALTER TABLE transactions DROP COLUMN IF EXISTS buyer_id;
-- ALTER TABLE transactions DROP COLUMN IF EXISTS seller_id;

-- Verification queries
SELECT 'Customers with middle_name column' as info, COUNT(*) FROM customers LIMIT 1;
SELECT 'Transaction buyers migrated' as info, COUNT(*) FROM transaction_buyers;
SELECT 'Transaction sellers migrated' as info, COUNT(*) FROM transaction_sellers;

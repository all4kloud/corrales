-- Add active field to transactions table for soft deletes
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_is_active ON transactions(is_active);

-- Update existing transactions to be active
UPDATE transactions SET is_active = true WHERE is_active IS NULL;

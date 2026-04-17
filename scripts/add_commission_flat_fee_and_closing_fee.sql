-- Add commission_flat_fee and closing_fee columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS commission_flat_fee NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS closing_fee NUMERIC(12,2);

-- Add comments for documentation
COMMENT ON COLUMN transactions.commission_flat_fee IS 'Flat fee commission amount in dollars';
COMMENT ON COLUMN transactions.closing_fee IS 'Closing fee amount in dollars';

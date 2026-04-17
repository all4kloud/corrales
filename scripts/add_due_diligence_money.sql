-- Add due_diligence_money field to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_diligence_money NUMERIC(12, 2);

-- Add comment to clarify the field
COMMENT ON COLUMN transactions.due_diligence_money IS 'Due diligence money amount in dollars';
COMMENT ON COLUMN transactions.brokerage_fee IS 'Brokerage fee amount in dollars (changed from percentage)';

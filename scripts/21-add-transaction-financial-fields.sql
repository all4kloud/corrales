-- Add financial fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS due_diligence_date DATE,
ADD COLUMN IF NOT EXISTS due_diligence_fee NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS closing_costs NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS earnest_money_deposit NUMERIC(12, 2);

-- Add comments for documentation
COMMENT ON COLUMN transactions.due_diligence_date IS 'Date when due diligence period ends';
COMMENT ON COLUMN transactions.due_diligence_fee IS 'Fee paid for due diligence period';
COMMENT ON COLUMN transactions.closing_costs IS 'Total closing costs for the transaction';
COMMENT ON COLUMN transactions.earnest_money_deposit IS 'Earnest money deposit amount';

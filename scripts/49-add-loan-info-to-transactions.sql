-- Add loan information fields to transactions table

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS down_payment NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS loan_type VARCHAR(50) CHECK (loan_type IN ('conventional', 'usda', 'fha', 'dscr')),
ADD COLUMN IF NOT EXISTS rate NUMERIC(5,4);

-- Add comments for documentation
COMMENT ON COLUMN transactions.down_payment IS 'Down payment amount for the transaction';
COMMENT ON COLUMN transactions.loan_type IS 'Type of loan: conventional, usda, fha, or dscr';
COMMENT ON COLUMN transactions.rate IS 'Loan interest rate (e.g., 0.0650 for 6.5%)';

-- Add new fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS co_listing_agent_id uuid REFERENCES agents(id),
ADD COLUMN IF NOT EXISTS co_selling_agent_id uuid REFERENCES agents(id),
ADD COLUMN IF NOT EXISTS seller_commission_rate numeric(5,4),
ADD COLUMN IF NOT EXISTS buyer_commission_rate numeric(5,4),
ADD COLUMN IF NOT EXISTS brokerage_fee numeric(5,4);

-- Remove financing_deadline if it exists (deprecated field)
ALTER TABLE transactions
DROP COLUMN IF EXISTS financing_deadline;

-- Update comment
COMMENT ON COLUMN transactions.co_listing_agent_id IS 'Co-listing agent for the transaction';
COMMENT ON COLUMN transactions.co_selling_agent_id IS 'Co-buyer/selling agent for the transaction';
COMMENT ON COLUMN transactions.seller_commission_rate IS 'Seller commission rate (0.03 = 3%)';
COMMENT ON COLUMN transactions.buyer_commission_rate IS 'Buyer commission rate (0.03 = 3%)';
COMMENT ON COLUMN transactions.brokerage_fee IS 'Brokerage fee percentage (0.01 = 1%)';

-- Add language field to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';

-- Add comment to the column
COMMENT ON COLUMN customers.language IS 'Preferred language for communication';

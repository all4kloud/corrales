-- Add language field to customers table
-- This field stores the preferred language for client communication

-- Add the language column with Spanish as default
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'Spanish';

-- Add a check constraint to ensure only valid languages are stored
ALTER TABLE customers
ADD CONSTRAINT customers_language_check 
CHECK (language IN ('English', 'Spanish'));

-- Add a comment to document the column
COMMENT ON COLUMN customers.language IS 'Preferred language for client communication (English, Spanish)';

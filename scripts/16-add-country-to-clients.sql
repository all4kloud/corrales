-- Add country field to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States';

-- Update existing records to have United States as default
UPDATE customers SET country = 'United States' WHERE country IS NULL;

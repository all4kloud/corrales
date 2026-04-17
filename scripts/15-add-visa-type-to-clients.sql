-- Add visa_type field to customers table

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS visa_type VARCHAR(50) CHECK (visa_type IN ('US Citizen', 'Permanent Resident', 'Nonimmigrant'));

-- Add comment to explain the field
COMMENT ON COLUMN customers.visa_type IS 'Immigration status of the client: US Citizen, Permanent Resident, or Nonimmigrant';

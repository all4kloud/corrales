-- Add notification preferences columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN customers.sms_notifications_enabled IS 'Customer authorization to receive SMS notifications';
COMMENT ON COLUMN customers.email_notifications_enabled IS 'Customer authorization to receive email notifications';

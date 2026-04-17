-- Ensure all existing customers have email_notifications_enabled set to false by default
UPDATE customers 
SET email_notifications_enabled = false 
WHERE email_notifications_enabled IS NULL;

UPDATE customers 
SET sms_notifications_enabled = false 
WHERE sms_notifications_enabled IS NULL;

-- Update any customers who might have been set to true to false (per user request)
-- Comment this line if you want to keep existing true values
-- UPDATE customers SET email_notifications_enabled = false;
-- UPDATE customers SET sms_notifications_enabled = false;

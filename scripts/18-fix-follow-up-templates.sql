-- Update follow-up templates to remove refinance type (no longer supported)
-- and fix the "Low" priority references

-- Delete refinance templates since we removed that transaction type
DELETE FROM follow_up_event_templates WHERE transaction_type = 'refinance';

-- Update any "low" priority to "medium" since we removed "low" priority
UPDATE follow_up_event_templates SET priority = 'medium' WHERE priority = 'low';

-- Verify the trigger exists and is working
-- You can check if follow-up events are being created by running:
-- SELECT * FROM follow_up_events WHERE transaction_id = '<your-transaction-id>';

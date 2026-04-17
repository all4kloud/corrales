-- Update transaction filter options
-- Remove "under_contract" status and add "active"
-- Remove "low" priority
-- Remove "refinance" transaction type

-- Step 1: Update existing data to use new values
UPDATE transactions 
SET status = 'active' 
WHERE status = 'under_contract';

UPDATE transactions 
SET priority = 'medium' 
WHERE priority = 'low';

UPDATE transactions 
SET transaction_type = 'sale' 
WHERE transaction_type = 'refinance';

-- Step 2: Update follow_up_events priority
UPDATE follow_up_events 
SET priority = 'medium' 
WHERE priority = 'low';

-- Step 3: Update follow_up_event_templates priority
UPDATE follow_up_event_templates 
SET priority = 'medium' 
WHERE priority = 'low';

-- Step 4: Drop old constraints
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_priority_check;

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE follow_up_events 
DROP CONSTRAINT IF EXISTS follow_up_events_priority_check;

ALTER TABLE follow_up_event_templates 
DROP CONSTRAINT IF EXISTS follow_up_event_templates_priority_check;

-- Step 5: Add new constraints with updated values
ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'active', 'contingent', 'closed', 'cancelled'));

ALTER TABLE transactions 
ADD CONSTRAINT transactions_priority_check 
CHECK (priority IN ('medium', 'high', 'urgent'));

ALTER TABLE transactions 
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('purchase', 'sale'));

ALTER TABLE follow_up_events 
ADD CONSTRAINT follow_up_events_priority_check 
CHECK (priority IN ('medium', 'high', 'urgent'));

ALTER TABLE follow_up_event_templates 
ADD CONSTRAINT follow_up_event_templates_priority_check 
CHECK (priority IN ('medium', 'high', 'urgent'));

-- Add 'not_applicable' status to follow_up_events table

-- Drop the existing check constraint
ALTER TABLE follow_up_events DROP CONSTRAINT IF EXISTS follow_up_events_status_check;

-- Add the new check constraint with 'not_applicable' included
ALTER TABLE follow_up_events ADD CONSTRAINT follow_up_events_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue', 'not_applicable'));

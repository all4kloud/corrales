-- Fix follow-up event assignment to use user_id from agents table
-- This fixes the foreign key constraint violation when creating transactions

-- Drop the existing trigger
DROP TRIGGER IF EXISTS create_follow_up_events_trigger ON transactions;

-- Recreate the function with proper user_id lookup
CREATE OR REPLACE FUNCTION create_follow_up_events_from_templates()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id from the listing agent
    SELECT user_id INTO v_user_id
    FROM agents
    WHERE id = NEW.listing_agent_id;
    
    -- Create follow-up events from templates
    INSERT INTO follow_up_events (
        transaction_id,
        template_id,
        event_name,
        description,
        due_date,
        priority,
        assigned_to
    )
    SELECT 
        NEW.id,
        t.id,
        t.event_name,
        t.description,
        NEW.contract_date + INTERVAL '1 day' * t.days_from_contract,
        t.priority,
        v_user_id  -- Use the user_id from agents table instead of agent_id
    FROM follow_up_event_templates t
    WHERE t.transaction_type = NEW.transaction_type
    AND t.is_active = true;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER create_follow_up_events_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_up_events_from_templates();

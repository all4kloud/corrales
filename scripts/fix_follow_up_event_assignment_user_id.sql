-- Fix the trigger function to properly assign follow-up events to users, not agents
-- The assigned_to field references users.id, but we were passing agents.id
-- This fix retrieves the user_id from the agents table

DROP FUNCTION IF EXISTS create_follow_up_events_from_templates() CASCADE;

CREATE OR REPLACE FUNCTION create_follow_up_events_from_templates()
RETURNS TRIGGER AS $$
DECLARE
    assigned_agent_id UUID;
    assigned_user_id UUID;
BEGIN
    -- Determine which agent to assign based on transaction type
    -- For 'sale' transactions, assign to buyer_agent_id (was selling_agent_id)
    -- For other types (purchase, lease, etc.), assign to listing_agent_id
    IF LOWER(NEW.transaction_type) = 'sale' THEN
        assigned_agent_id := NEW.buyer_agent_id;
    ELSE
        assigned_agent_id := NEW.listing_agent_id;
    END IF;

    -- Get the user_id from the agents table (assigned_to must reference users.id, not agents.id)
    IF assigned_agent_id IS NOT NULL THEN
        SELECT user_id INTO assigned_user_id 
        FROM agents 
        WHERE id = assigned_agent_id;
    END IF;

    -- Insert follow-up events from templates with the appropriate user assignment
    -- Only create events if contract_date is not null (required for calculating due_date)
    IF NEW.contract_date IS NOT NULL THEN
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
            assigned_user_id
        FROM follow_up_event_templates t
        WHERE t.transaction_type = NEW.transaction_type
        AND t.is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_follow_up_events_trigger ON transactions;

CREATE TRIGGER create_follow_up_events_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_up_events_from_templates();

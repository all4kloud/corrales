-- Update the trigger function to assign follow-up events based on transaction type
-- If transaction type is 'sale', assign to selling_agent_id (seller agent)
-- Otherwise, assign to listing_agent_id (buyer agent)

DROP FUNCTION IF EXISTS create_follow_up_events_from_templates() CASCADE;

CREATE OR REPLACE FUNCTION create_follow_up_events_from_templates()
RETURNS TRIGGER AS $$
DECLARE
    assigned_agent_id UUID;
BEGIN
    -- Determine which agent to assign based on transaction type
    -- For 'sale' transactions, assign to selling_agent_id (seller agent)
    -- For other types (purchase, lease, etc.), assign to listing_agent_id (buyer agent)
    IF LOWER(NEW.transaction_type) = 'sale' THEN
        assigned_agent_id := NEW.selling_agent_id;
    ELSE
        assigned_agent_id := NEW.listing_agent_id;
    END IF;

    -- Insert follow-up events from templates with the appropriate agent assignment
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
        assigned_agent_id
    FROM follow_up_event_templates t
    WHERE t.transaction_type = NEW.transaction_type
    AND t.is_active = true;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_follow_up_events_trigger ON transactions;

CREATE TRIGGER create_follow_up_events_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_up_events_from_templates();

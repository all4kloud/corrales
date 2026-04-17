-- Rename selling_agent_id to buyer_agent_id and co_selling_agent_id to co_buyer_agent_id
ALTER TABLE transactions 
  RENAME COLUMN selling_agent_id TO buyer_agent_id;

ALTER TABLE transactions 
  RENAME COLUMN co_selling_agent_id TO co_buyer_agent_id;

-- Update the trigger function to use the new column names
CREATE OR REPLACE FUNCTION create_follow_up_events_from_templates()
RETURNS TRIGGER AS $$
DECLARE
  template RECORD;
  assigned_agent_id uuid;
BEGIN
  -- Determine which agent to assign based on transaction type
  -- For "sale" transactions, assign to buyer_agent_id (previously selling_agent_id)
  -- For other transaction types, assign to listing_agent_id
  IF NEW.transaction_type = 'sale' THEN
    assigned_agent_id := NEW.buyer_agent_id;
  ELSE
    assigned_agent_id := NEW.listing_agent_id;
  END IF;

  -- Create follow-up events from active templates matching the transaction type
  FOR template IN 
    SELECT * FROM follow_up_event_templates 
    WHERE is_active = true 
      AND (transaction_type = NEW.transaction_type OR transaction_type = 'all')
  LOOP
    INSERT INTO follow_up_events (
      id,
      transaction_id,
      template_id,
      event_name,
      description,
      due_date,
      priority,
      status,
      assigned_to,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      template.id,
      template.event_name,
      template.description,
      NEW.contract_date + (template.days_from_contract || ' days')::interval,
      template.priority,
      'pending',
      assigned_agent_id,
      NOW(),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

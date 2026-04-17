-- Add related_entity_type to follow_up_event_templates
-- Values: 'lender', 'attorney', 'other_entity', or NULL (no entity email needed)
ALTER TABLE follow_up_event_templates
  ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50) NULL;

-- Add same column to follow_up_events so it can be set directly on the event
ALTER TABLE follow_up_events
  ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50) NULL;

-- Create table to store entity email send history
CREATE TABLE IF NOT EXISTS entity_email_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_event_id UUID NOT NULL REFERENCES follow_up_events(id) ON DELETE CASCADE,
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  entity_type     VARCHAR(50) NOT NULL,   -- 'lender', 'attorney', 'other_entity'
  entity_id       UUID NOT NULL,          -- id in the corresponding entity table
  entity_name     VARCHAR(255) NOT NULL,
  to_email        VARCHAR(255) NOT NULL,
  subject         VARCHAR(500) NOT NULL,
  body            TEXT NOT NULL,
  sent_by         UUID REFERENCES users(id),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_email_requests_follow_up  ON entity_email_requests(follow_up_event_id);
CREATE INDEX IF NOT EXISTS idx_entity_email_requests_transaction ON entity_email_requests(transaction_id);

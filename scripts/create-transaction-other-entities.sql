-- Junction table: links transactions to other_entities (insurance, appraisal, title, contractor, etc.)
CREATE TABLE IF NOT EXISTS transaction_other_entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  other_entity_id UUID NOT NULL REFERENCES other_entities(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,        -- denormalized for fast filtering: insurance, appraisal, title, contractor, other
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, other_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_toe_transaction  ON transaction_other_entities(transaction_id);
CREATE INDEX IF NOT EXISTS idx_toe_entity       ON transaction_other_entities(other_entity_id);
CREATE INDEX IF NOT EXISTS idx_toe_entity_type  ON transaction_other_entities(transaction_id, entity_type);

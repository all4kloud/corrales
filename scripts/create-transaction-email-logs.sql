CREATE TABLE IF NOT EXISTS transaction_email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sent_by     UUID REFERENCES users(id),
  party_type  VARCHAR(50) NOT NULL, -- 'buyer', 'seller', 'listing_agent', 'buyer_agent', 'co_listing_agent', 'co_buyer_agent', 'lender', 'attorney'
  party_name  TEXT,
  to_email    TEXT NOT NULL,
  cc_emails   TEXT[],               -- array of CC addresses
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_transaction ON transaction_email_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at     ON transaction_email_logs(transaction_id, sent_at DESC);

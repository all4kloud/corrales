-- Table for tracking activity types (general parameters)
CREATE TABLE IF NOT EXISTS tracking_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for transaction tracking entries
CREATE TABLE IF NOT EXISTS transaction_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tracking_type_id UUID NOT NULL REFERENCES tracking_types(id),
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_tracking_transaction_id ON transaction_tracking(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tracking_type_id ON transaction_tracking(tracking_type_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tracking_created_at ON transaction_tracking(created_at DESC);

-- Insert initial tracking types
INSERT INTO tracking_types (code, name, description, display_order) VALUES
  ('make_calls', 'Make Calls', 'Phone calls made related to the transaction', 1),
  ('review_documents', 'Review Documents', 'Documents reviewed for the transaction', 2),
  ('send_emails', 'Send Emails', 'Emails sent related to the transaction', 3),
  ('read_emails', 'Read Emails', 'Emails read and processed for the transaction', 4)
ON CONFLICT (code) DO NOTHING;

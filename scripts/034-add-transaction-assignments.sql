-- Add transaction assignments table for assistant access control
-- This allows managers to assign specific transactions to assistants

CREATE TABLE IF NOT EXISTS transaction_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_id, assigned_to_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_assignments_transaction_id ON transaction_assignments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_assignments_assigned_to ON transaction_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_assignments_assigned_by ON transaction_assignments(assigned_by_user_id);

-- Add comment
COMMENT ON TABLE transaction_assignments IS 'Tracks which transactions are assigned to which assistant users by managers';

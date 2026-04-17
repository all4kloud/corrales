-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  task_id UUID REFERENCES follow_up_events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'task_completed', 'task_assigned', 'document_uploaded', 'transaction_updated'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  metadata JSONB -- For storing additional data like URLs, IDs, etc.
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_unread ON notifications(customer_id, is_read) WHERE is_read = FALSE;

-- Add comment
COMMENT ON TABLE notifications IS 'Stores in-app notifications for customers in the portal';

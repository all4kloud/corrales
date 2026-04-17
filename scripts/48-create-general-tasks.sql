-- Create general_tasks table for user tasks not associated with specific transactions
CREATE TABLE IF NOT EXISTS general_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_general_tasks_user_id ON general_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_general_tasks_status ON general_tasks(status);
CREATE INDEX IF NOT EXISTS idx_general_tasks_due_date ON general_tasks(due_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_general_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_general_tasks_updated_at
  BEFORE UPDATE ON general_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_general_tasks_updated_at();

-- Fix general_tasks table: rename user_id to assigned_to and add created_by
ALTER TABLE general_tasks RENAME COLUMN user_id TO assigned_to;

ALTER TABLE general_tasks 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill created_by with assigned_to for existing rows
UPDATE general_tasks SET created_by = assigned_to WHERE created_by IS NULL;

-- Update index to use new column name
DROP INDEX IF EXISTS idx_general_tasks_user_id;
CREATE INDEX IF NOT EXISTS idx_general_tasks_assigned_to ON general_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_general_tasks_created_by ON general_tasks(created_by);

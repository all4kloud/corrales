-- Add middle_name field to users table for agents
ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Update existing records to have NULL middle_name (already default)
COMMENT ON COLUMN users.middle_name IS 'Middle name of the user (optional)';

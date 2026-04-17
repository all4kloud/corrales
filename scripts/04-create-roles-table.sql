-- Create roles table for managing user roles and permissions
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full system access with all permissions', '["manage_users", "manage_roles", "manage_transactions", "manage_properties", "manage_clients", "manage_agents", "manage_entities", "manage_follow_ups", "manage_templates", "view_reports", "manage_settings"]'),
('manager', 'Management level access with most permissions', '["manage_transactions", "manage_properties", "manage_clients", "manage_agents", "manage_entities", "manage_follow_ups", "manage_templates", "view_reports"]'),
('agent', 'Agent level access for transaction management', '["manage_transactions", "manage_properties", "manage_clients", "manage_follow_ups", "view_reports"]'),
('assistant', 'Assistant level access for basic operations', '["view_transactions", "manage_follow_ups", "view_clients", "view_properties"]')
ON CONFLICT (name) DO NOTHING;

-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'agent';
    END IF;
END $$;

-- Update existing users to have agent role if no role is set
UPDATE users SET role = 'agent' WHERE role IS NULL;

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at_trigger
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- Add portal access fields to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS portal_email VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS portal_password_hash TEXT;

-- Create unique index on portal_email (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_portal_email ON agents(portal_email) WHERE portal_email IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN agents.portal_access_enabled IS 'Whether this agent has access to the customer portal';
COMMENT ON COLUMN agents.portal_email IS 'Email used for portal login (can be different from user email)';
COMMENT ON COLUMN agents.portal_password_hash IS 'Bcrypt hash of portal password';

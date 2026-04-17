-- Ensure Google Drive credentials table exists with proper structure
CREATE TABLE IF NOT EXISTS google_drive_credentials (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT 'system' UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on user_id if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_drive_credentials_user_id_unique 
ON google_drive_credentials(user_id);

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_google_drive_credentials_updated_at'
    ) THEN
        CREATE TRIGGER update_google_drive_credentials_updated_at 
            BEFORE UPDATE ON google_drive_credentials 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

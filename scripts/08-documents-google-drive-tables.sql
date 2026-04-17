-- Create tables for document management and Google Drive integration

-- Google Drive credentials table (for system-wide integration)
CREATE TABLE IF NOT EXISTS google_drive_credentials (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT 'system',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table for tracking uploaded files
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    google_drive_id VARCHAR(255) NOT NULL,
    google_drive_url TEXT NOT NULL,
    task_id UUID REFERENCES follow_up_events(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON documents(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction_id ON documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_google_drive_credentials_user_id ON google_drive_credentials(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_drive_credentials_updated_at 
    BEFORE UPDATE ON google_drive_credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

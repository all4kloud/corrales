-- Add document type support
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default document types
INSERT INTO document_types (name, description) VALUES
    ('Contract', 'Purchase agreements, contracts, and legal documents'),
    ('Invoice', 'Invoices and billing documents'),
    ('Report', 'Inspection reports, appraisal reports, and assessments'),
    ('License', 'License documents and certifications'),
    ('ID', 'Identification documents'),
    ('Financial', 'Financial statements and related documents'),
    ('Photo', 'Property photos and images'),
    ('Other', 'Miscellaneous documents')
ON CONFLICT (name) DO NOTHING;

-- Add document_type_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type_id INTEGER REFERENCES document_types(id);

-- Add folder_id to google_drive_credentials for folder configuration
ALTER TABLE google_drive_credentials ADD COLUMN IF NOT EXISTS folder_id VARCHAR(255);
ALTER TABLE google_drive_credentials ADD COLUMN IF NOT EXISTS folder_name VARCHAR(255);

-- Create index on document_type_id
CREATE INDEX IF NOT EXISTS idx_documents_document_type_id ON documents(document_type_id);

-- Create trigger for updated_at on document_types
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_types_updated_at 
    BEFORE UPDATE ON document_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

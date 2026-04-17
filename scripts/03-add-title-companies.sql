-- Add title companies table

CREATE TABLE IF NOT EXISTS title_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_title_companies_company_name ON title_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_title_companies_is_active ON title_companies(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_title_companies_updated_at 
    BEFORE UPDATE ON title_companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO title_companies (company_name, contact_name, email, phone, address, city, state, zip_code) VALUES
('First American Title', 'John Smith', 'john@firstamerican.com', '(555) 100-1000', '123 Title St', 'Charlotte', 'NC', '28202'),
('Chicago Title', 'Sarah Johnson', 'sarah@chicagotitle.com', '(555) 200-2000', '456 Insurance Ave', 'Raleigh', 'NC', '27601'),
('Fidelity National Title', 'Mike Davis', 'mike@fnf.com', '(555) 300-3000', '789 Closing Blvd', 'Durham', 'NC', '27701')
ON CONFLICT DO NOTHING;

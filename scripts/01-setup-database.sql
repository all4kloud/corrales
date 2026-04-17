-- Conecta Database Schema
-- Real Estate CRM System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    license_number VARCHAR(50),
    brokerage VARCHAR(255),
    commission_rate DECIMAL(5,4),
    specialties TEXT[],
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lenders table
CREATE TABLE IF NOT EXISTS lenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    loan_types TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attorneys table
CREATE TABLE IF NOT EXISTS attorneys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_name VARCHAR(255) NOT NULL,
    attorney_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    specialties TEXT[],
    bar_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    property_type VARCHAR(50),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    listing_price DECIMAL(12,2),
    market_value DECIMAL(12,2),
    mls_number VARCHAR(50),
    description TEXT,
    features TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'refinance')),
    property_id UUID REFERENCES properties(id),
    buyer_id UUID REFERENCES customers(id),
    seller_id UUID REFERENCES customers(id),
    listing_agent_id UUID REFERENCES agents(id),
    selling_agent_id UUID REFERENCES agents(id),
    lender_id UUID REFERENCES lenders(id),
    attorney_id UUID REFERENCES attorneys(id),
    contract_date DATE,
    closing_date DATE,
    purchase_price DECIMAL(12,2),
    commission_rate DECIMAL(5,4),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_contract', 'contingent', 'closed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create follow_up_event_templates table
CREATE TABLE IF NOT EXISTS follow_up_event_templates (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(20) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    days_from_contract INTEGER NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create follow_up_events table
CREATE TABLE IF NOT EXISTS follow_up_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES follow_up_event_templates(id),
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
    assigned_to UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_priority ON transactions(priority);
CREATE INDEX IF NOT EXISTS idx_transactions_closing_date ON transactions(closing_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_events_due_date ON follow_up_events(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_events_status ON follow_up_events(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_events_assigned_to ON follow_up_events(assigned_to);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lenders_updated_at BEFORE UPDATE ON lenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attorneys_updated_at BEFORE UPDATE ON attorneys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_follow_up_events_updated_at BEFORE UPDATE ON follow_up_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create follow-up events from templates
CREATE OR REPLACE FUNCTION create_follow_up_events_from_templates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO follow_up_events (
        transaction_id,
        template_id,
        event_name,
        description,
        due_date,
        priority,
        assigned_to
    )
    SELECT 
        NEW.id,
        t.id,
        t.event_name,
        t.description,
        NEW.contract_date + INTERVAL '1 day' * t.days_from_contract,
        t.priority,
        NEW.listing_agent_id
    FROM follow_up_event_templates t
    WHERE t.transaction_type = NEW.transaction_type
    AND t.is_active = true;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create follow-up events
CREATE TRIGGER create_follow_up_events_trigger
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_up_events_from_templates();

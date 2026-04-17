-- Create entity_contacts table for multiple contacts per entity
CREATE TABLE IF NOT EXISTS entity_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'lender', 'attorney', 'other'
  entity_id UUID NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  title VARCHAR(100), -- Job title/position
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entity_contacts_entity ON entity_contacts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_contacts_primary ON entity_contacts(entity_type, entity_id, is_primary) WHERE is_primary = true;

-- Migrate existing contact data from lenders table
INSERT INTO entity_contacts (entity_type, entity_id, contact_name, email, phone, is_primary)
SELECT 
  'lender',
  id,
  contact_name,
  email,
  phone,
  true
FROM lenders
WHERE contact_name IS NOT NULL AND contact_name != '' AND is_active = true
ON CONFLICT DO NOTHING;

-- Migrate existing contact data from attorneys table  
INSERT INTO entity_contacts (entity_type, entity_id, contact_name, email, phone, is_primary)
SELECT 
  'attorney',
  id,
  attorney_name,
  email,
  phone,
  true
FROM attorneys
WHERE attorney_name IS NOT NULL AND attorney_name != '' AND is_active = true
ON CONFLICT DO NOTHING;

-- Create other_entities table if not exists
CREATE TABLE IF NOT EXISTS other_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100), -- 'inspector', 'contractor', 'title_company', etc.
  company_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  website VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_other_entities_type ON other_entities(entity_type);

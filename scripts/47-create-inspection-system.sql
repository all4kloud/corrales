-- Create Inspection System
-- This migration creates tables for managing inspectors, inspection types, templates, and requests

-- 1. Inspection Types Table
CREATE TABLE IF NOT EXISTS inspection_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  typical_duration_hours INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Inspectors Table
CREATE TABLE IF NOT EXISTS inspectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  website VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Inspector Specialties Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS inspector_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id UUID NOT NULL REFERENCES inspectors(id) ON DELETE CASCADE,
  inspection_type_id UUID NOT NULL REFERENCES inspection_types(id) ON DELETE CASCADE,
  typical_price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(inspector_id, inspection_type_id)
);

-- 4. Email Templates Table
CREATE TABLE IF NOT EXISTS inspection_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  inspection_type_id UUID REFERENCES inspection_types(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Inspection Requests Table
CREATE TABLE IF NOT EXISTS inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_event_id UUID REFERENCES follow_up_events(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  inspection_type_id UUID NOT NULL REFERENCES inspection_types(id) ON DELETE RESTRICT,
  inspector_id UUID NOT NULL REFERENCES inspectors(id) ON DELETE RESTRICT,
  status VARCHAR(50) DEFAULT 'pending',
  requested_date DATE,
  scheduled_date DATE,
  scheduled_time TIME,
  quoted_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  email_sent_at TIMESTAMP,
  email_sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP,
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Inspection Request History (Audit Trail)
CREATE TABLE IF NOT EXISTS inspection_request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_request_id UUID NOT NULL REFERENCES inspection_requests(id) ON DELETE CASCADE,
  status_from VARCHAR(50),
  status_to VARCHAR(50),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Add inspection flag to follow_up_event_templates
ALTER TABLE follow_up_event_templates 
ADD COLUMN IF NOT EXISTS is_inspection_related BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_inspection_type_id UUID REFERENCES inspection_types(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inspector_specialties_inspector ON inspector_specialties(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspector_specialties_type ON inspector_specialties(inspection_type_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_transaction ON inspection_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_followup ON inspection_requests(follow_up_event_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_status ON inspection_requests(status);
CREATE INDEX IF NOT EXISTS idx_inspection_request_history_request ON inspection_request_history(inspection_request_id);

-- Insert default inspection types
INSERT INTO inspection_types (name, description, typical_duration_hours, display_order) VALUES
  ('Home Inspection', 'General home inspection covering structure, systems, and major components', 3, 1),
  ('Pest Inspection', 'Termite and pest inspection', 1, 2),
  ('Radon Inspection', 'Radon gas level testing', 2, 3),
  ('Septic Inspection', 'Septic system inspection and pumping', 2, 4),
  ('Water Well Inspection', 'Well water quality and flow testing', 2, 5),
  ('Survey', 'Property boundary survey', 4, 6),
  ('HVAC Inspection', 'Heating, ventilation, and air conditioning system inspection', 2, 7),
  ('Lead-Based Paint Inspection', 'Lead paint detection and assessment', 2, 8),
  ('Roof Inspection', 'Roof condition and integrity inspection', 1, 9),
  ('Structural Inspection', 'Foundation and structural engineering inspection', 3, 10),
  ('Oil/Gas Tank Inspection', 'Underground or above-ground tank inspection', 2, 11)
ON CONFLICT (name) DO NOTHING;

-- Insert default email template
INSERT INTO inspection_email_templates (name, subject, body, is_default)
SELECT 'Default Inspection Request', 
   'Inspection Request for {{property.address}}',
   'Dear {{inspector.contact_name}},

We are writing to request a {{inspection_type.name}} for the following property:

Property Address: {{property.address}}
{{property.city}}, {{property.state}} {{property.zip}}

Transaction Details:
- Transaction Type: {{transaction.type}}
- Closing Date: {{transaction.closing_date}}
- Requested Inspection Date: {{request.requested_date}}

Client Information:
- {{client.type}}: {{client.name}}
- Agent: {{agent.name}}
- Agent Phone: {{agent.phone}}
- Agent Email: {{agent.email}}

Please provide:
1. Your availability for the requested date or alternative dates
2. Price quote for this inspection
3. Expected timeline for the inspection report

Thank you for your prompt attention to this matter.

Best regards,
{{agent.name}}
{{agent.company}}',
   true
WHERE NOT EXISTS (SELECT 1 FROM inspection_email_templates WHERE is_default = true);

COMMENT ON TABLE inspection_types IS 'Standard types of inspections that can be performed';
COMMENT ON TABLE inspectors IS 'Inspector companies and contacts';
COMMENT ON TABLE inspector_specialties IS 'Maps inspectors to the types of inspections they perform';
COMMENT ON TABLE inspection_email_templates IS 'Email templates for requesting inspections';
COMMENT ON TABLE inspection_requests IS 'Tracks all inspection requests sent to inspectors';
COMMENT ON TABLE inspection_request_history IS 'Audit trail for inspection request status changes';

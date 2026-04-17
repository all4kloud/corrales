-- Seed data for lenders and attorneys tables

-- Insert sample lenders
INSERT INTO lenders (company_name, contact_name, email, phone, address, loan_types, notes) VALUES
('First National Bank', 'Sarah Johnson', 'sarah.johnson@fnb.com', '555-0101', '123 Banking St, Miami, FL 33101', ARRAY['Conventional', 'FHA', 'VA', 'Jumbo'], 'Preferred lender with competitive rates'),
('Miami Mortgage Solutions', 'Michael Rodriguez', 'mrodriguez@miamimortgage.com', '555-0102', '456 Loan Ave, Miami, FL 33102', ARRAY['Conventional', 'FHA', 'USDA'], 'Local lender specializing in first-time buyers'),
('Sunshine Credit Union', 'Lisa Chen', 'lchen@sunshinecu.org', '555-0103', '789 Credit Blvd, Miami, FL 33103', ARRAY['Conventional', 'VA', 'Construction'], 'Credit union with member benefits'),
('Atlantic Lending Group', 'David Thompson', 'dthompson@atlanticlending.com', '555-0104', '321 Finance Way, Miami, FL 33104', ARRAY['Jumbo', 'Investment', 'Commercial'], 'Specializes in high-value properties'),
('Coastal Mortgage Partners', 'Jennifer Martinez', 'jmartinez@coastalmortgage.com', '555-0105', '654 Mortgage Dr, Miami, FL 33105', ARRAY['Conventional', 'FHA', 'Refinance'], 'Fast processing and excellent service')
ON CONFLICT DO NOTHING;

-- Insert sample attorneys
INSERT INTO attorneys (firm_name, attorney_name, email, phone, address, specialties, bar_number, notes) VALUES
('Miami Real Estate Law Group', 'Robert Anderson', 'randerson@miamirelaw.com', '555-0201', '100 Legal Plaza, Miami, FL 33101', ARRAY['Real Estate', 'Contract Law', 'Title Issues'], 'FL12345', 'Experienced in complex transactions'),
('Sunshine Title & Law', 'Maria Gonzalez', 'mgonzalez@sunshinetitle.com', '555-0202', '200 Title St, Miami, FL 33102', ARRAY['Real Estate', 'Title Insurance', 'Closings'], 'FL23456', 'Full-service title and closing company'),
('Atlantic Legal Services', 'James Wilson', 'jwilson@atlanticlegal.com', '555-0203', '300 Attorney Ave, Miami, FL 33103', ARRAY['Real Estate', 'Commercial Law', 'Litigation'], 'FL34567', 'Handles both residential and commercial'),
('Coastal Law Partners', 'Amanda Davis', 'adavis@coastallaw.com', '555-0204', '400 Law Blvd, Miami, FL 33104', ARRAY['Real Estate', 'Estate Planning', 'Business Law'], 'FL45678', 'Comprehensive legal services'),
('Premier Title Solutions', 'Carlos Rivera', 'crivera@premiertitle.com', '555-0205', '500 Closing Ct, Miami, FL 33105', ARRAY['Real Estate', 'Title Examination', 'Escrow Services'], 'FL56789', 'Efficient closing process specialist')
ON CONFLICT DO NOTHING;

-- Seed data for Conecta

-- Insert roles
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access'),
('manager', 'Office manager with team oversight'),
('agent', 'Real estate agent with transaction access')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id) VALUES
('admin@conecta.com', '$2b$10$example_hash_admin', 'Admin', 'User', '555-0001', 1),
('manager@conecta.com', '$2b$10$example_hash_manager', 'Sarah', 'Johnson', '555-0002', 2),
('agent1@conecta.com', '$2b$10$example_hash_agent1', 'Mike', 'Davis', '555-0003', 3),
('agent2@conecta.com', '$2b$10$example_hash_agent2', 'Lisa', 'Chen', '555-0004', 3)
ON CONFLICT (email) DO NOTHING;

-- Insert follow-up event templates for purchase transactions
INSERT INTO follow_up_event_templates (transaction_type, event_name, description, days_from_contract, priority) VALUES
('purchase', 'Home Inspection', 'Schedule and complete home inspection', 7, 'high'),
('purchase', 'Appraisal Ordered', 'Lender orders property appraisal', 10, 'high'),
('purchase', 'Loan Application Review', 'Review loan application status with lender', 14, 'medium'),
('purchase', 'Title Search', 'Complete title search and review', 21, 'medium'),
('purchase', 'Final Walkthrough', 'Schedule final walkthrough with buyer', 28, 'high'),
('purchase', 'Closing Preparation', 'Prepare all closing documents', 30, 'high')
ON CONFLICT DO NOTHING;

-- Insert follow-up event templates for sale transactions
INSERT INTO follow_up_event_templates (transaction_type, event_name, description, days_from_contract, priority) VALUES
('sale', 'Listing Photos', 'Professional photography scheduled', 1, 'high'),
('sale', 'MLS Listing', 'Property listed on MLS', 2, 'high'),
('sale', 'Marketing Launch', 'Begin marketing campaign', 3, 'medium'),
('sale', 'Open House', 'Schedule first open house', 7, 'medium'),
('sale', 'Price Review', 'Review pricing strategy', 14, 'low'),
('sale', 'Market Update', 'Provide market update to seller', 21, 'low')
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code) VALUES
('John', 'Smith', 'john.smith@email.com', '555-1001', '123 Main St', 'Anytown', 'CA', '90210'),
('Jane', 'Doe', 'jane.doe@email.com', '555-1002', '456 Oak Ave', 'Somewhere', 'CA', '90211'),
('Bob', 'Wilson', 'bob.wilson@email.com', '555-1003', '789 Pine Rd', 'Elsewhere', 'CA', '90212'),
('Alice', 'Brown', 'alice.brown@email.com', '555-1004', '321 Elm St', 'Nowhere', 'CA', '90213');

-- Insert sample properties
INSERT INTO properties (address, city, state, zip_code, property_type, bedrooms, bathrooms, square_feet, listing_price) VALUES
('1234 Sunset Blvd', 'Los Angeles', 'CA', '90028', 'Single Family', 3, 2.5, 1800, 750000.00),
('5678 Ocean Drive', 'Santa Monica', 'CA', '90401', 'Condo', 2, 2.0, 1200, 950000.00),
('9012 Mountain View', 'Pasadena', 'CA', '91101', 'Single Family', 4, 3.0, 2400, 1200000.00);

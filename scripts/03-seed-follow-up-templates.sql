-- Seed follow-up event templates for different transaction types

-- Purchase transaction templates
INSERT INTO follow_up_event_templates (transaction_type, event_name, description, days_from_contract, priority, is_active) VALUES
('purchase', 'Schedule Home Inspection', 'Coordinate and schedule the home inspection with buyer and inspector', 3, 'high', true),
('purchase', 'Review Inspection Report', 'Review inspection report and discuss any issues with buyer', 7, 'high', true),
('purchase', 'Order Appraisal', 'Contact lender to order property appraisal', 5, 'medium', true),
('purchase', 'Review Appraisal Results', 'Review appraisal results and address any value concerns', 14, 'medium', true),
('purchase', 'Coordinate Final Walkthrough', 'Schedule final walkthrough with buyer before closing', 21, 'medium', true),
('purchase', 'Prepare Closing Documents', 'Ensure all closing documents are prepared and reviewed', 25, 'high', true),
('purchase', 'Confirm Closing Details', 'Confirm closing time, location, and attendees', 28, 'high', true);

-- Sale transaction templates  
INSERT INTO follow_up_event_templates (transaction_type, event_name, description, days_from_contract, priority, is_active) VALUES
('sale', 'Prepare Property Disclosure', 'Complete and review property disclosure documents', 1, 'high', true),
('sale', 'Schedule Inspection Access', 'Coordinate property access for buyer inspection', 3, 'medium', true),
('sale', 'Review Purchase Agreement', 'Review signed purchase agreement and terms', 1, 'high', true),
('sale', 'Coordinate Repairs', 'Manage any required repairs from inspection', 10, 'medium', true),
('sale', 'Prepare for Appraisal', 'Ensure property is ready for appraisal visit', 5, 'medium', true),
('sale', 'Final Property Preparation', 'Ensure property is move-in ready for new owners', 25, 'medium', true),
('sale', 'Closing Preparation', 'Prepare all seller closing documents and requirements', 28, 'high', true);

-- Refinance transaction templates
INSERT INTO follow_up_event_templates (transaction_type, event_name, description, days_from_contract, priority, is_active) VALUES
('refinance', 'Submit Loan Application', 'Complete and submit refinance loan application', 1, 'high', true),
('refinance', 'Provide Financial Documents', 'Submit required financial documentation to lender', 3, 'high', true),
('refinance', 'Schedule Appraisal', 'Coordinate property appraisal for refinance', 7, 'medium', true),
('refinance', 'Review Loan Terms', 'Review and approve final loan terms and conditions', 14, 'high', true),
('refinance', 'Prepare Closing Documents', 'Review closing disclosure and prepare for signing', 21, 'high', true),
('refinance', 'Schedule Closing', 'Coordinate refinance closing appointment', 25, 'medium', true);

-- General follow-up templates (applicable to all transaction types)
INSERT INTO follow_up_event_templates (transaction_type, event_name, description, days_from_contract, priority, is_active) VALUES
('purchase', 'Client Check-in Call', 'Follow up call to check on client satisfaction and address concerns', 35, 'low', true),
('sale', 'Client Check-in Call', 'Follow up call to check on client satisfaction and address concerns', 35, 'low', true),
('refinance', 'Client Check-in Call', 'Follow up call to check on client satisfaction and address concerns', 35, 'low', true);

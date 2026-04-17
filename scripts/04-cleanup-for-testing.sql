-- Cleanup script for testing
-- This script removes all transactions, follow-ups, entities, and documents
-- Keeps only specified test users: oscar@corralesre.com, virginia@corralesre.com, ggonzalez@all4kloud.com

-- Start transaction
BEGIN;

-- Step 1: Delete all documents (no FK dependencies)
DELETE FROM documents;

-- Step 2: Delete all follow-up events (depends on transactions)
DELETE FROM follow_up_events;

-- Step 3: Delete all transactions (depends on properties, customers, agents, attorneys, lenders)
DELETE FROM transactions;

-- Step 4: Delete all properties
DELETE FROM properties;

-- Step 5: Delete all customers
DELETE FROM customers;

-- Step 6: Delete all lenders
DELETE FROM lenders;

-- Step 7: Delete all attorneys
DELETE FROM attorneys;

-- Step 8: Delete agents (depends on users, so we need to be careful)
-- We'll delete agents that don't belong to our test users
DELETE FROM agents 
WHERE user_id NOT IN (
  SELECT id FROM users 
  WHERE email IN ('oscar@corralesre.com', 'virginia@corralesre.com', 'ggonzalez@all4kloud.com')
);

-- Step 9: Delete users that are not in our test list
-- But first, remove any Google Drive credentials for deleted users
DELETE FROM google_drive_credentials 
WHERE user_id NOT IN (
  SELECT email FROM users 
  WHERE email IN ('oscar@corralesre.com', 'virginia@corralesre.com', 'ggonzalez@all4kloud.com')
);

-- Delete password reset codes for users not in our list
DELETE FROM password_reset_codes
WHERE email NOT IN ('oscar@corralesre.com', 'virginia@corralesre.com', 'ggonzalez@all4kloud.com');

-- Finally, delete users not in our test list
DELETE FROM users 
WHERE email NOT IN ('oscar@corralesre.com', 'virginia@corralesre.com', 'ggonzalez@all4kloud.com');

-- Step 10: Display remaining users for verification
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active
FROM users
ORDER BY email;

-- Display counts of remaining records
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'agents', COUNT(*) FROM agents
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'follow_up_events', COUNT(*) FROM follow_up_events
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'attorneys', COUNT(*) FROM attorneys
UNION ALL
SELECT 'lenders', COUNT(*) FROM lenders
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;

-- Commit the transaction
COMMIT;

-- Note: If something goes wrong, you can ROLLBACK instead of COMMIT

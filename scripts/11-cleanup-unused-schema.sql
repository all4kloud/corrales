-- Drop the unused neon_auth schema and its tables
-- This schema was from a previous authentication integration that is no longer used

DROP TABLE IF EXISTS neon_auth.users_sync CASCADE;
DROP SCHEMA IF EXISTS neon_auth CASCADE;

-- Verify that only the public schema remains with our application tables
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

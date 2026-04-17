-- Create password reset codes table for password recovery functionality

CREATE TABLE IF NOT EXISTS password_reset_codes (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);

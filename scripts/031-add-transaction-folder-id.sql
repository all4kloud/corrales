-- Add google_drive_folder_id to transactions table
-- Each transaction will have its own folder in Google Drive

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255);

COMMENT ON COLUMN transactions.google_drive_folder_id IS 'Google Drive folder ID for this transaction documents';

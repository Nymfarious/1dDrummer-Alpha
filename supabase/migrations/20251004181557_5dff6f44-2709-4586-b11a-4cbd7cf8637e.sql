-- Add cloud storage token columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dropbox_token TEXT,
ADD COLUMN IF NOT EXISTS google_drive_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.dropbox_token IS 'Encrypted Dropbox OAuth access token';
COMMENT ON COLUMN public.profiles.google_drive_token IS 'Encrypted Google Drive OAuth access token';

-- Create a separate bucket for guest uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-audio-files',
  'guest-audio-files',
  false,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3']
);

-- Allow anyone to upload to guest folder (INSERT)
CREATE POLICY "Allow guest audio uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'guest-audio-files' 
  AND (storage.foldername(name))[1] = 'guest'
);

-- Allow anyone to read files in guest folder (SELECT)
CREATE POLICY "Allow guest to view uploaded files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'guest-audio-files'
  AND (storage.foldername(name))[1] = 'guest'
);

-- Prevent updates for guest uploads (security)
CREATE POLICY "Prevent guest file updates"
ON storage.objects
FOR UPDATE
TO public
USING (false);

-- Prevent deletes for guest uploads (security)
CREATE POLICY "Prevent guest file deletes"
ON storage.objects
FOR DELETE
TO public
USING (false);
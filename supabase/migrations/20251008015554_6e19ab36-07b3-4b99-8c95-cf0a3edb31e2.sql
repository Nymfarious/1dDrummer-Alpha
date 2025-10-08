-- Create music-library storage bucket for sheet music and music-related images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music-library',
  'music-library',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for music-library bucket
CREATE POLICY "Users can view their own music files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'music-library' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own music files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'music-library' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own music files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'music-library' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own music files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'music-library' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
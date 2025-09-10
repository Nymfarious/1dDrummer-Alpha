-- Create audio storage bucket for secure file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files', 
  'audio-files', 
  false, 
  52428800, -- 50MB in bytes
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3']
);

-- Create storage policies for audio files
CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (
    (storage.extension(name) = 'mp3' AND storage.mime_type(name) = 'audio/mpeg') OR
    (storage.extension(name) = 'wav' AND storage.mime_type(name) = 'audio/wav') OR
    (storage.extension(name) = 'm4a' AND storage.mime_type(name) = 'audio/mp4') OR
    (storage.extension(name) = 'm4a' AND storage.mime_type(name) = 'audio/x-m4a')
  )
);

CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create user_audio_files table to track uploads and metadata
CREATE TABLE public.user_audio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_audio_files table
ALTER TABLE public.user_audio_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_audio_files
CREATE POLICY "Users can view their own audio file records" 
ON public.user_audio_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audio file records" 
ON public.user_audio_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio file records" 
ON public.user_audio_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio file records" 
ON public.user_audio_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_audio_files_updated_at
BEFORE UPDATE ON public.user_audio_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
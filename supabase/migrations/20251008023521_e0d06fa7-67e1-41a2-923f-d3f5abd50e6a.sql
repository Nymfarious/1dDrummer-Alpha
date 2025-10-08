-- Add UPDATE policy for user_audio_files so users can update their own file names
CREATE POLICY "Users can update their own audio files"
ON public.user_audio_files
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
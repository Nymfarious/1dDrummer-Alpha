-- Add file_category column to user_audio_files table
ALTER TABLE user_audio_files 
ADD COLUMN file_category text NOT NULL DEFAULT 'imported';

-- Add check constraint for valid categories
ALTER TABLE user_audio_files
ADD CONSTRAINT valid_file_category 
CHECK (file_category IN ('recording', 'imported', 'shared'));

-- Add index for better query performance
CREATE INDEX idx_user_audio_files_category ON user_audio_files(user_id, file_category);

-- Add comment for documentation
COMMENT ON COLUMN user_audio_files.file_category IS 'Category of audio file: recording (from app recording), imported (uploaded files), shared (received from other users)';

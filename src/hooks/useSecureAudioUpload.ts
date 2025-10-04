/**
 * Secure audio upload hook with validation and Supabase storage
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDevSettings } from '@/contexts/DevSettingsContext';
import { 
  validateAudioFile, 
  generateSecureFileName, 
  getAudioDuration,
  FileValidationResult 
} from '@/lib/fileValidation';
import { securityLogger } from '@/lib/securityLogger';
import { createErrorMessage, logError } from '@/lib/errorHandling';
import { csrfProtection } from '@/lib/csrfProtection';

export interface AudioFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  durationSeconds?: number;
  createdAt: string;
  url?: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export const useSecureAudioUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [userFiles, setUserFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useDevSettings();

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): FileValidationResult => {
    return validateAudioFile(file);
  };

  /**
   * Upload a single audio file securely
   */
  const uploadFile = async (file: File): Promise<AudioFile | null> => {
    if (!user && !settings.guestAudioUploadOverride) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      await securityLogger.logSuspiciousActivity({ 
        action: 'upload_without_auth', 
        fileName: file.name 
      }, 'warning');
      return null;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorMessage = createErrorMessage(
        { message: validation.errors.join(', ') }, 
        'fileValidation'
      );
      toast({
        title: "Invalid File",
        description: errorMessage,
        variant: "destructive",
      });
      await securityLogger.logSuspiciousActivity({ 
        action: 'invalid_file_upload', 
        fileName: file.name,
        errors: validation.errors
      }, 'warning');
      return null;
    }

    try {
      // Generate secure file name
      const secureFileName = generateSecureFileName(file.name, user?.id || 'guest');
      
      // Update upload progress
      const uploadId = `${file.name}_${Date.now()}`;
      setUploads(prev => [...prev, {
        file,
        progress: 0,
        status: 'uploading'
      }]);

      // Determine which bucket to use based on guest mode
      const bucketName = (settings.guestAudioUploadOverride && !user) ? 'guest-audio-files' : 'audio-files';
      
      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(secureFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        throw storageError;
      }

      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, progress: 75, status: 'processing' }
          : upload
      ));

      // Get file duration
      let duration: number | undefined;
      try {
        duration = await getAudioDuration(file);
      } catch (error) {
        console.warn('Could not get audio duration:', error);
      }

      // Save file metadata to database (skip if guest override)
      let dbData;
      if (user) {
        const { data, error: dbError } = await supabase
          .from('user_audio_files')
          .insert({
            user_id: user.id,
          file_name: secureFileName,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
            storage_path: storageData.path,
            duration_seconds: duration ? Math.round(duration) : null
          })
          .select()
          .single();

        if (dbError) {
          // Clean up storage if database insert fails
          const bucketName = (settings.guestAudioUploadOverride && !user) ? 'guest-audio-files' : 'audio-files';
          await supabase.storage.from(bucketName).remove([secureFileName]);
          throw dbError;
        }
        dbData = data;
      } else {
        // Guest mode - create temporary metadata (not persisted to DB)
        dbData = {
          id: `guest-${Date.now()}`,
          file_name: secureFileName,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: storageData.path,
          duration_seconds: duration ? Math.round(duration) : null,
          created_at: new Date().toISOString()
        };
        
        // Show warning about temporary guest files
        toast({
          title: "Guest Upload",
          description: "File uploaded temporarily. Sign in to save permanently.",
          variant: "default",
        });
      }

      // Update progress to completed
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, progress: 100, status: 'completed' }
          : upload
      ));

      // Create AudioFile object
      const audioFile: AudioFile = {
        id: dbData.id,
        fileName: dbData.file_name,
        originalName: dbData.original_name,
        fileSize: dbData.file_size,
        mimeType: dbData.mime_type,
        storagePath: dbData.storage_path,
        durationSeconds: dbData.duration_seconds,
        createdAt: dbData.created_at
      };

      // Add to user files
      setUserFiles(prev => [audioFile, ...prev]);

      // Log successful upload
      if (user) {
        await securityLogger.logFileUpload(user.id, file.name, file.size, file.type);
      }

      toast({
        title: "Upload Successful",
        description: `${file.name} uploaded securely.`,
      });

      return audioFile;

    } catch (error: any) {
      const errorMessage = createErrorMessage(error, 'fileUpload');
      logError(error, 'fileUpload');
      
      // Update upload status to error
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: 'error', error: error.message }
          : upload
      ));

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });

      await securityLogger.logSuspiciousActivity({ 
        action: 'upload_failed', 
        fileName: file.name,
        error: error.message
      }, 'error');

      return null;
    }
  };

  /**
   * Upload multiple files
   */
  const uploadFiles = async (files: File[]): Promise<AudioFile[]> => {
    setLoading(true);
    const uploadedFiles: AudioFile[] = [];
    
    try {
      for (const file of files) {
        const uploadedFile = await uploadFile(file);
        if (uploadedFile) {
          uploadedFiles.push(uploadedFile);
        }
      }
    } finally {
      setLoading(false);
    }
    
    return uploadedFiles;
  };

  /**
   * Get signed URL for file access
   */
  const getFileUrl = async (audioFile: AudioFile): Promise<string | null> => {
    try {
      // Determine bucket based on file path
      const bucketName = audioFile.fileName.startsWith('guest/') ? 'guest-audio-files' : 'audio-files';
      
      // Use storagePath if available, otherwise fall back to fileName
      const filePath = audioFile.storagePath || audioFile.fileName;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      logError(error, 'getFileUrl');
      return null;
    }
  };

  /**
   * Load user's audio files
   */
  const loadUserFiles = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_audio_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const audioFiles: AudioFile[] = data.map(file => ({
        id: file.id,
        fileName: file.file_name,
        originalName: file.original_name,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        storagePath: file.storage_path,
        durationSeconds: file.duration_seconds,
        createdAt: file.created_at
      }));

      setUserFiles(audioFiles);
    } catch (error) {
      logError(error, 'loadUserFiles');
    }
  };

  /**
   * Delete a file
   */
  const deleteFile = async (audioFile: AudioFile): Promise<void> => {
    try {
      // Determine bucket based on file path
      const bucketName = audioFile.fileName.startsWith('guest/') ? 'guest-audio-files' : 'audio-files';
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([audioFile.fileName]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_audio_files')
        .delete()
        .eq('id', audioFile.id);

      if (dbError) throw dbError;

      // Remove from local state
      setUserFiles(prev => prev.filter(file => file.id !== audioFile.id));

      // Log deletion
      await securityLogger.logFileDelete(audioFile.id, audioFile.originalName);

      toast({
        title: "File Deleted",
        description: `${audioFile.originalName} has been deleted.`,
      });

    } catch (error: any) {
      const errorMessage = createErrorMessage(error, 'deleteFile');
      logError(error, 'deleteFile');
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Clear upload progress
   */
  const clearUploads = () => {
    setUploads([]);
  };

  return {
    uploads,
    userFiles,
    loading,
    validateFile,
    uploadFile,
    uploadFiles,
    getFileUrl,
    loadUserFiles,
    deleteFile,
    clearUploads
  };
};
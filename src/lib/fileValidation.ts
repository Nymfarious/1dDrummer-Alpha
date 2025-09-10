/**
 * File validation utilities for secure audio uploads
 */

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',     // .mp3
  'audio/wav',      // .wav
  'audio/mp4',      // .m4a
  'audio/x-m4a',    // .m4a (alternative)
  'audio/mp3'       // .mp3 (alternative)
] as const;

export const ALLOWED_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a'
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Validates an audio file for security and format compliance
 */
export const validateAudioFile = (file: File): FileValidationResult => {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than 50MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Check MIME type
  if (!ALLOWED_AUDIO_TYPES.includes(file.type as any)) {
    errors.push(`Invalid file type: ${file.type}. Allowed types: MP3, WAV, M4A`);
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension as any)) {
    errors.push(`Invalid file extension: .${extension}. Allowed extensions: .mp3, .wav, .m4a`);
  }

  // Validate file name for security (prevent directory traversal)
  if (file.name.includes('../') || file.name.includes('..\\') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push('File name contains invalid characters');
  }

  // Check for suspicious patterns
  if (file.name.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }

  if (file.name.startsWith('.') || file.name.includes('~')) {
    errors.push('File name contains suspicious patterns');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generates a secure file name for storage
 */
export const generateSecureFileName = (originalName: string, userId: string): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${userId}/${timestamp}_${randomSuffix}.${extension}`;
};

/**
 * Validates multiple files at once
 */
export const validateAudioFiles = (files: File[]): { validFiles: File[], invalidFiles: { file: File, errors: string[] }[] } => {
  const validFiles: File[] = [];
  const invalidFiles: { file: File, errors: string[] }[] = [];

  files.forEach(file => {
    const validation = validateAudioFile(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, errors: validation.errors });
    }
  });

  return { validFiles, invalidFiles };
};

/**
 * Gets audio file duration (requires audio element)
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read audio file'));
    });
    
    audio.src = url;
  });
};

/**
 * Sanitizes filename for display purposes
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
};
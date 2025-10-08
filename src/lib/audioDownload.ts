/**
 * Audio download utilities for converting and downloading audio files
 */

import { convertWebMToWAV } from './audioConverter';

/**
 * Download audio file in specified format
 */
export const downloadAudio = async (
  audioUrl: string,
  fileName: string,
  format: 'wav' | 'webm' | 'mp3'
): Promise<void> => {
  try {
    // Fetch the audio file
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    
    let downloadBlob = blob;
    let extension = format;
    
    // Convert if needed
    if (format === 'wav' && !blob.type.includes('wav')) {
      downloadBlob = await convertWebMToWAV(blob);
      extension = 'wav';
    } else if (format === 'mp3') {
      // For MP3, if source is WAV/WebM, we keep the original for now
      // Real MP3 encoding would require a library like lamejs
      extension = blob.type.includes('mp3') ? 'mp3' : 'wav';
      if (!blob.type.includes('mp3')) {
        downloadBlob = await convertWebMToWAV(blob);
      }
    } else if (format === 'webm') {
      extension = 'webm';
    }
    
    // Create download link
    const url = URL.createObjectURL(downloadBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download audio file');
  }
};

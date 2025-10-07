import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDropbox = () => {
  const [isConnected, setIsConnected] = useState(true); // Dev mode always connected
  const { toast } = useToast();

  const uploadFile = async (file: Blob, fileName: string, folderPath: string = 'uploads') => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/png;base64, prefix
        };
        reader.readAsDataURL(file);
      });

      const fileData = await base64Promise;

      const { data, error } = await supabase.functions.invoke('dropbox-proxy', {
        body: {
          action: 'upload',
          path: folderPath,
          fileName,
          fileData
        }
      });

      if (error) throw error;

      toast({
        title: "Upload Successful",
        description: `Saved to Dropbox: ${fileName}`,
      });

      return data.result;
    } catch (error) {
      console.error('Dropbox upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload to Dropbox",
        variant: "destructive",
      });
      return null;
    }
  };

  const listFiles = async (path: string = '') => {
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-proxy', {
        body: { action: 'list', path }
      });

      if (error) throw error;
      return data.entries;
    } catch (error) {
      console.error('Dropbox list error:', error);
      toast({
        title: "List Failed",
        description: "Failed to list Dropbox files",
        variant: "destructive",
      });
      return [];
    }
  };

  const downloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-proxy', {
        body: { action: 'download', path }
      });

      if (error) throw error;

      // Convert base64 back to blob
      const byteCharacters = atob(data.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray]);
    } catch (error) {
      console.error('Dropbox download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download from Dropbox",
        variant: "destructive",
      });
      return null;
    }
  };

  const getTempLink = async (path: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-proxy', {
        body: { action: 'getTempLink', path }
      });

      if (error) throw error;
      return data.link;
    } catch (error) {
      console.error('Dropbox temp link error:', error);
      return null;
    }
  };

  return {
    isConnected,
    uploadFile,
    listFiles,
    downloadFile,
    getTempLink,
  };
};

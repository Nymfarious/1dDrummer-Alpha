import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleDriveConfig {
  accessToken: string | null;
  isConnected: boolean;
}

declare const gapi: any;

export const useGoogleDrive = () => {
  const [config, setConfig] = useState<GoogleDriveConfig>({
    accessToken: null,
    isConnected: false,
  });
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGoogleDriveConfig();
    loadGapiScript();
  }, []);

  const loadGapiScript = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', () => {
        setIsGapiLoaded(true);
      });
    };
    document.body.appendChild(script);
  };

  const loadGoogleDriveConfig = async () => {
    // TODO: Implement proper OAuth flow with encrypted token storage
    // For now, tokens are only stored in memory during session
    console.log('Google Drive config loading - awaiting OAuth implementation');
  };

  const connectGoogleDrive = async () => {
    if (!isGapiLoaded) {
      toast({
        title: "Loading",
        description: "Google API is loading, please try again",
      });
      return;
    }

    try {
      await gapi.client.init({
        apiKey: 'YOUR_GOOGLE_API_KEY', // User will need to set this
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // User will need to set this
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file',
      });

      const authInstance = gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      const token = user.getAuthResponse().access_token;

      await saveToken(token);
    } catch (error) {
      console.error('Google Drive auth error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Drive",
        variant: "destructive",
      });
    }
  };

  const saveToken = async (token: string) => {
    // TODO: Implement secure token storage via Edge Function with encryption
    // For now, token is only stored in memory (lost on refresh)
    setConfig({ accessToken: token, isConnected: true });
    
    toast({
      title: "Google Drive Connected",
      description: "Successfully connected to Google Drive (session only)",
    });
  };

  const disconnect = async () => {
    setConfig({ accessToken: null, isConnected: false });
    
    if (isGapiLoaded) {
      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance) {
        await authInstance.signOut();
      }
    }

    toast({
      title: "Google Drive Disconnected",
      description: "Disconnected from Google Drive",
    });
  };

  const uploadFile = async (file: Blob, fileName: string, folderId?: string) => {
    if (!config.accessToken) {
      toast({
        title: "Not Connected",
        description: "Please connect to Google Drive first",
        variant: "destructive",
      });
      return null;
    }

    try {
      const metadata = {
        name: fileName,
        mimeType: file.type,
        ...(folderId && { parents: [folderId] }),
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();

      toast({
        title: "Upload Successful",
        description: `Saved to Google Drive: ${fileName}`,
      });

      return result;
    } catch (error) {
      console.error('Google Drive upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload to Google Drive",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    isConnected: config.isConnected,
    connectGoogleDrive,
    disconnect,
    uploadFile,
  };
};

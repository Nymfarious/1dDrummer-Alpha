import { useState, useEffect } from 'react';
import { Dropbox } from 'dropbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DropboxConfig {
  accessToken: string | null;
  isConnected: boolean;
}

export const useDropbox = () => {
  const [config, setConfig] = useState<DropboxConfig>({
    accessToken: null,
    isConnected: false,
  });
  const [dbx, setDbx] = useState<Dropbox | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDropboxConfig();
  }, []);

  useEffect(() => {
    if (config.accessToken) {
      setDbx(new Dropbox({ accessToken: config.accessToken }));
    }
  }, [config.accessToken]);

  const loadDropboxConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('dropbox_token')
      .eq('user_id', user.id)
      .single();

    if (data?.dropbox_token) {
      setConfig({
        accessToken: data.dropbox_token,
        isConnected: true,
      });
    }
  };

  const connectDropbox = () => {
    const CLIENT_ID = 'YOUR_DROPBOX_APP_KEY'; // User will need to set this
    const REDIRECT_URI = `${window.location.origin}/`;
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&token_access_type=offline`;
    
    window.location.href = authUrl;
  };

  const saveToken = async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ dropbox_token: token })
      .eq('user_id', user.id);

    setConfig({ accessToken: token, isConnected: true });
    
    toast({
      title: "Dropbox Connected",
      description: "Successfully connected to Dropbox",
    });
  };

  const disconnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ dropbox_token: null })
      .eq('user_id', user.id);

    setConfig({ accessToken: null, isConnected: false });
    setDbx(null);
    
    toast({
      title: "Dropbox Disconnected",
      description: "Disconnected from Dropbox",
    });
  };

  const uploadFile = async (file: Blob, fileName: string, folderPath: string = '/DrummerStudio') => {
    if (!dbx) {
      toast({
        title: "Not Connected",
        description: "Please connect to Dropbox first",
        variant: "destructive",
      });
      return null;
    }

    try {
      const fullPath = `${folderPath}/${fileName}`;
      const response = await dbx.filesUpload({
        path: fullPath,
        contents: file,
        mode: { '.tag': 'overwrite' },
      });

      toast({
        title: "Upload Successful",
        description: `Saved to Dropbox: ${fileName}`,
      });

      return response.result;
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

  return {
    isConnected: config.isConnected,
    connectDropbox,
    disconnect,
    uploadFile,
    saveToken,
  };
};

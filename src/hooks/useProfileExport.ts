import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { toast } from 'sonner';

export const useProfileExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportProfile = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch audio files
      const { data: audioFiles } = await supabase
        .from('user_audio_files')
        .select('*')
        .eq('user_id', user.id);

      const zip = new JSZip();

      // Add profile data as JSON
      zip.file('profile.json', JSON.stringify({
        profile,
        settings,
        exportedAt: new Date().toISOString(),
      }, null, 2));

      // Download and add avatar if exists
      if (profile?.avatar_url) {
        try {
          const response = await fetch(profile.avatar_url);
          const blob = await response.blob();
          const ext = profile.avatar_url.split('.').pop() || 'jpg';
          zip.file(`avatar.${ext}`, blob);
        } catch (error) {
          console.error('Failed to download avatar:', error);
        }
      }

      // Download and add audio files
      if (audioFiles && audioFiles.length > 0) {
        const audioFolder = zip.folder('audio');
        for (const audioFile of audioFiles) {
          try {
            const { data } = await supabase.storage
              .from('audio-files')
              .download(audioFile.storage_path);
            
            if (data && audioFolder) {
              audioFolder.file(audioFile.original_name, data);
            }
          } catch (error) {
            console.error(`Failed to download ${audioFile.original_name}:`, error);
          }
        }
      }

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ddrummer-profile-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Profile exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export profile');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportProfile, isExporting };
};

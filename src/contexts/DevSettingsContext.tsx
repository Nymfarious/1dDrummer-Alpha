import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DevSettings {
  guestAudioUploadOverride: boolean;
  masterVisibility: boolean;
  blockSignups: boolean;
}

interface DevSettingsContextType {
  settings: DevSettings;
  updateSettings: (updates: Partial<DevSettings>) => void;
}

const DevSettingsContext = createContext<DevSettingsContextType | undefined>(undefined);

export const DevSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DevSettings>({
    guestAudioUploadOverride: false,
    masterVisibility: true,
    blockSignups: true,
  });

  // Fetch initial signup block status from database
  useEffect(() => {
    const fetchSignupStatus = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'signups_blocked')
        .single();
      
      if (data && !error) {
        const settingValue = data.setting_value as { blocked: boolean };
        setSettings(prev => ({
          ...prev,
          blockSignups: settingValue.blocked
        }));
      }
    };
    
    fetchSignupStatus();
  }, []);

  const updateSettings = async (updates: Partial<DevSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    
    // If blockSignups is being updated, sync to database
    if ('blockSignups' in updates) {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: { blocked: updates.blockSignups },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'signups_blocked');
      
      if (error) {
        console.error('Failed to update signup blocking:', error);
        toast({
          title: "Update Failed",
          description: "Could not update signup blocking setting",
          variant: "destructive",
        });
        // Revert the change
        setSettings(prev => ({ ...prev, blockSignups: !updates.blockSignups }));
      } else {
        toast({
          title: updates.blockSignups ? "Signups Blocked" : "Signups Enabled",
          description: updates.blockSignups 
            ? "New user registrations are now blocked" 
            : "New users can now create accounts",
        });
      }
    }
  };

  return (
    <DevSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </DevSettingsContext.Provider>
  );
};

export const useDevSettings = () => {
  const context = useContext(DevSettingsContext);
  if (context === undefined) {
    throw new Error('useDevSettings must be used within a DevSettingsProvider');
  }
  return context;
};

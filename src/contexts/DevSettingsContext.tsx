import React, { createContext, useContext, useState } from 'react';

interface DevSettings {
  guestAudioUploadOverride: boolean;
  masterVisibility: boolean;
}

interface DevSettingsContextType {
  settings: DevSettings;
  updateSettings: (updates: Partial<DevSettings>) => void;
}

const DevSettingsContext = createContext<DevSettingsContextType | undefined>(undefined);

export const DevSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DevSettings>({
    guestAudioUploadOverride: false,
    masterVisibility: true,
  });

  const updateSettings = (updates: Partial<DevSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
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

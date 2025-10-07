import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/drummer/Sidebar';
import { MobileNavigation } from '@/components/drummer/MobileNavigation';
import { AudioPanel } from '@/components/drummer/AudioPanel';
import { MobileTransportControls } from '@/components/drummer/MobileTransportControls';
import { MetronomePanel } from '@/components/drummer/MetronomePanel';
import { MobileMetronomePanel } from '@/components/drummer/MobileMetronomePanel';
import { BandRoomPanel } from '@/components/drummer/BandRoomPanel';
import { SettingsPanel } from '@/components/drummer/SettingsPanel';
import { AICoachPanel } from '@/components/drummer/AICoachPanel';
import { SoundMapperButton } from '@/components/drummer/SoundMapperButton';
import Libraries from '@/pages/Libraries';
import UserProfile from '@/pages/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const DrummerStudio = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('audio');
  
  // Audio state
  const [bpm, setBpm] = useState(92);
  const [timeSig, setTimeSig] = useState('4/4');
  const [metronomeVolume, setMetronomeVolume] = useState(70);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [metronomeSound, setMetronomeSound] = useState('standard');

  // Load user settings when component mounts
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setBpm(data.default_bpm || 92);
        setTimeSig(data.default_time_signature || '4/4');
        setMetronomeVolume(data.metronome_volume || 70);
        setMetronomeSound(data.metronome_sound || 'standard');
        setMetronomeEnabled(data.metronome_enabled !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const renderContent = () => {
    const AudioComponent = isMobile ? MobileTransportControls : AudioPanel;
    const MetronomeComponent = isMobile ? MobileMetronomePanel : MetronomePanel;
    
    switch (activeTab) {
      case 'audio':
        return (
          <AudioComponent
            bpm={bpm}
            setBpm={setBpm}
            metronomeVolume={metronomeVolume}
            setMetronomeVolume={setMetronomeVolume}
            metronomeEnabled={metronomeEnabled}
            setMetronomeEnabled={setMetronomeEnabled}
          />
        );
      case 'metronome':
        return (
          <MetronomeComponent
            bpm={bpm}
            setBpm={setBpm}
            timeSig={timeSig}
            setTimeSig={setTimeSig}
            metronomeSound={metronomeSound}
            setMetronomeSound={setMetronomeSound}
            metronomeEnabled={metronomeEnabled}
            metronomeVolume={metronomeVolume}
            setMetronomeVolume={setMetronomeVolume}
          />
        );
      case 'aicoach':
        return <AICoachPanel bpm={bpm} timeSignature={timeSig} />;
      case 'libraries':
        return <Libraries />;
      case 'bandroom':
        return <BandRoomPanel />;
      case 'userprofile':
        return <UserProfile />;
      case 'settings':
        return (
          <SettingsPanel
            bpm={bpm}
            setBpm={setBpm}
            timeSig={timeSig}
            setTimeSig={setTimeSig}
            metronomeSound={metronomeSound}
            setMetronomeSound={setMetronomeSound}
            metronomeVolume={metronomeVolume}
            setMetronomeVolume={setMetronomeVolume}
            metronomeEnabled={metronomeEnabled}
            setMetronomeEnabled={setMetronomeEnabled}
          />
        );
      default:
        return (
          <AudioComponent
            bpm={bpm}
            setBpm={setBpm}
            metronomeVolume={metronomeVolume}
            setMetronomeVolume={setMetronomeVolume}
            metronomeEnabled={metronomeEnabled}
            setMetronomeEnabled={setMetronomeEnabled}
          />
        );
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-background flex flex-col">
        <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 px-4 py-6 pb-20">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <SoundMapperButton />
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DrummerStudio;
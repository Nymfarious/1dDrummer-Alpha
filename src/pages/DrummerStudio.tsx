import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/drummer/Sidebar';
import { TransportControls } from '@/components/drummer/TransportControls';
import { MetronomePanel } from '@/components/drummer/MetronomePanel';
import { RecordingPanel } from '@/components/drummer/RecordingPanel';
import { BandRoomPanel } from '@/components/drummer/BandRoomPanel';
import { SettingsPanel } from '@/components/drummer/SettingsPanel';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const DrummerStudio = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transport');
  
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
    switch (activeTab) {
      case 'transport':
        return (
          <TransportControls
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
          <MetronomePanel
            bpm={bpm}
            setBpm={setBpm}
            timeSig={timeSig}
            setTimeSig={setTimeSig}
            metronomeSound={metronomeSound}
            setMetronomeSound={setMetronomeSound}
            metronomeEnabled={metronomeEnabled}
          />
        );
      case 'recording':
        return <RecordingPanel />;
      case 'bandroom':
        return <BandRoomPanel />;
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
          />
        );
      default:
        return <TransportControls
          bpm={bpm}
          setBpm={setBpm}
          metronomeVolume={metronomeVolume}
          setMetronomeVolume={setMetronomeVolume}
          metronomeEnabled={metronomeEnabled}
          setMetronomeEnabled={setMetronomeEnabled}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DrummerStudio;
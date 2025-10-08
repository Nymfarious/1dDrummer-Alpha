import { useEffect } from 'react';
import { TransportControls } from './TransportControls';
import { RecordingPanel } from './RecordingPanel';
import { AudioEditor } from '@/components/audio/AudioEditor';
import { useSecureAudioUpload } from '@/hooks/useSecureAudioUpload';

interface AudioPanelProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (enabled: boolean) => void;
  metronomeSound?: string;
}

export const AudioPanel = ({
  bpm,
  setBpm,
  metronomeVolume,
  setMetronomeVolume,
  metronomeEnabled,
  setMetronomeEnabled,
  metronomeSound
}: AudioPanelProps) => {
  const { userFiles, getFileUrl, loadUserFiles } = useSecureAudioUpload();

  // Load audio files on mount
  useEffect(() => {
    loadUserFiles();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Audio</h2>
        <p className="text-muted-foreground">
          Playback controls, recording, and audio library
        </p>
      </div>

      {/* Audio Editor Section */}
      <AudioEditor userFiles={userFiles} getFileUrl={getFileUrl} />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Transport Controls Section */}
      <TransportControls
        bpm={bpm}
        setBpm={setBpm}
        metronomeVolume={metronomeVolume}
        setMetronomeVolume={setMetronomeVolume}
        metronomeEnabled={metronomeEnabled}
        setMetronomeEnabled={setMetronomeEnabled}
        metronomeSound={metronomeSound}
      />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Recording Panel Section */}
      <RecordingPanel />
    </div>
  );
};

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Pause, Square, RotateCcw, Upload, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransportControlsProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (enabled: boolean) => void;
}

export const TransportControls = ({
  bpm,
  setBpm,
  metronomeVolume,
  setMetronomeVolume,
  metronomeEnabled,
  setMetronomeEnabled
}: TransportControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handlePlay = () => {
    if (audioRef.current && audioFile) {
      audioRef.current.play();
    }
    setIsPlaying(true);
    setIsPaused(false);
    toast({
      title: "Playback Started",
      description: audioFile ? `Playing ${audioFile.name}` : "Transport controls active",
    });
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setAudioFile(file);
      toast({
        title: "Audio File Loaded",
        description: `Successfully loaded ${file.name}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-6">Transport Controls</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Playback Controls */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Play size={20} />
              Playback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePlay}
                variant={isPlaying ? "transport-active" : "transport"}
                size="transport"
                className="status-active"
              >
                <Play size={24} />
              </Button>
              
              <Button
                onClick={handlePause}
                variant={isPaused ? "transport-active" : "transport"}
                size="transport"
                className="status-active"
              >
                <Pause size={24} />
              </Button>
              
              <Button
                onClick={handleStop}
                variant="transport"
                size="transport"
                className="status-active"
              >
                <Square size={24} />
              </Button>
              
              <Button
                onClick={handleLoop}
                variant={isLooping ? "transport-active" : "transport"}
                size="transport"
                className="status-active"
              >
                <RotateCcw size={24} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Volume Controls */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Volume2 size={20} />
              Metronome Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              variant={showVolumeSlider ? "audio-active" : "volume"}
              className="w-full status-active"
            >
              <Volume2 size={20} />
              {metronomeVolume}%
            </Button>
            
            {showVolumeSlider && (
              <div className="space-y-3 p-4 bg-secondary rounded-lg border border-border">
                <Label htmlFor="volume">Volume: {metronomeVolume}%</Label>
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="100"
                  value={metronomeVolume}
                  onChange={(e) => setMetronomeVolume(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metronome-enabled"
                checked={metronomeEnabled}
                onCheckedChange={setMetronomeEnabled}
              />
              <Label htmlFor="metronome-enabled" className="text-sm">
                Enable Metronome
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Audio File Upload */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Upload size={20} />
              Audio Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            
            <Button
              onClick={() => document.getElementById('audio-upload')?.click()}
              variant="audio"
              className="w-full status-active"
            >
              <Upload size={20} />
              Upload Audio
            </Button>
            
            <Button
              variant="audio-inactive"
              className="w-full status-inactive"
              disabled
            >
              <Upload size={20} />
              Cloud Storage
            </Button>
            
            {audioFile && (
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Loaded:</p>
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, RotateCcw, RotateCw, Upload, Volume2, Music } from 'lucide-react';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(80);
  const [metronomeOn, setMetronomeOn] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  // Load saved audio files from localStorage
  useEffect(() => {
    const savedAudioFiles = localStorage.getItem('ddrummer-audio-files');
    if (savedAudioFiles) {
      try {
        const files = JSON.parse(savedAudioFiles);
        // You can implement a file selection UI here if needed
      } catch (error) {
        console.error('Error loading saved audio files:', error);
      }
    }
  }, []);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (!isLooping) {
        setCurrentTime(0);
      }
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [isLooping]);

  // Update audio volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume / 100;
    }
  }, [audioVolume]);

  // Metronome functionality
  const startMetronome = () => {
    if (metronomeIntervalRef.current) return;
    
    const interval = (60 / bpm) * 1000;
    metronomeIntervalRef.current = setInterval(() => {
      playMetronomeSound();
    }, interval);
  };

  const stopMetronome = () => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
  };

  const playMetronomeSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    gainNode.gain.setValueAtTime(metronomeVolume / 100, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const toggleMetronome = () => {
    if (metronomeOn) {
      stopMetronome();
      setMetronomeOn(false);
    } else if (metronomeEnabled) {
      startMetronome();
      setMetronomeOn(true);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioFile) {
      audioRef.current.play();
    }
    setIsPlaying(true);
    setIsPaused(false);
    
    if (metronomeEnabled && metronomeOn) {
      startMetronome();
    }
    
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
    stopMetronome();
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    if (isPlaying && metronomeOn) {
      stopMetronome();
      startMetronome();
    }
  };

  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30);
    }
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
      
      // Save to localStorage
      try {
        const savedFiles = JSON.parse(localStorage.getItem('ddrummer-audio-files') || '[]');
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          timestamp: Date.now()
        };
        savedFiles.push(fileData);
        localStorage.setItem('ddrummer-audio-files', JSON.stringify(savedFiles.slice(-10))); // Keep last 10
      } catch (error) {
        console.error('Error saving file info:', error);
      }
      
      toast({
        title: "Audio File Loaded",
        description: `Successfully loaded ${file.name}`,
      });
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            <div className="grid grid-cols-3 gap-3 mb-4">
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
                onClick={handleRewind}
                variant="transport"
                size="transport"
                className="status-active"
              >
                <SkipBack size={24} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSkipBackward}
                variant="transport"
                size="transport"
                className="status-active"
              >
                <RotateCcw size={24} />
              </Button>
              
              <Button
                onClick={handleSkipForward}
                variant="transport"
                size="transport"
                className="status-active"
              >
                <RotateCw size={24} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audio Progress & Volume */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Volume2 size={20} />
              Audio Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {audioFile && (
              <>
                <div className="space-y-2">
                  <Label>Progress: {formatTime(currentTime)} / {formatTime(duration)}</Label>
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleProgressChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Audio Volume: {audioVolume}%</Label>
              <Slider
                value={[audioVolume]}
                onValueChange={(value) => setAudioVolume(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loop-enabled"
                checked={isLooping}
                onCheckedChange={(checked) => setIsLooping(checked === true)}
              />
              <Label htmlFor="loop-enabled" className="text-sm">
                Loop Audio
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Metronome Controls */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Music size={20} />
              Metronome
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Metronome Volume: {metronomeVolume}%</Label>
              <Slider
                value={[metronomeVolume]}
                onValueChange={(value) => setMetronomeVolume(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
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
            
            <Button
              onClick={toggleMetronome}
              variant={metronomeOn ? "audio-active" : "metronome"}
              className="w-full status-active"
              disabled={!metronomeEnabled}
            >
              <Music size={20} />
              {metronomeOn ? 'Stop Metronome' : 'Start Metronome'}
            </Button>
          </CardContent>
        </Card>

        {/* Audio File Upload */}
        <Card className="bg-gradient-card border-border card-shadow lg:col-span-2 xl:col-span-3">
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
            
            <div className="flex gap-4">
              <Button
                onClick={() => document.getElementById('audio-upload')?.click()}
                variant="audio"
                className="status-active"
              >
                <Upload size={20} />
                Upload Audio
              </Button>
              
              <Button
                variant="audio-inactive"
                className="status-inactive"
                disabled
              >
                <Upload size={20} />
                Cloud Storage (Coming Soon)
              </Button>
            </div>
            
            {audioFile && (
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Currently Loaded:</p>
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, RotateCcw, RotateCw, Volume2, Music, Upload, FolderOpen, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSecureAudioUpload } from '@/hooks/useSecureAudioUpload';
import { useAuth } from '@/hooks/useAuth';
import { useDevSettings } from '@/contexts/DevSettingsContext';
import { useDropzone } from 'react-dropzone';

interface MobileTransportControlsProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (enabled: boolean) => void;
}

export const MobileTransportControls = ({
  bpm,
  setBpm,
  metronomeVolume,
  setMetronomeVolume,
  metronomeEnabled,
  setMetronomeEnabled
}: MobileTransportControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(80);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentAudioFile, setCurrentAudioFile] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Update audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const updateVolume = () => {
      audio.volume = audioVolume / 100;
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    updateVolume();

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [audioVolume]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { getFileUrl, userFiles, uploadFiles, validateFile, loadUserFiles } = useSecureAudioUpload();

  // Load user files when user changes
  useEffect(() => {
    if (user) {
      loadUserFiles();
    }
  }, [user, loadUserFiles]);

  // Metronome functionality
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
    gainNode.gain.setValueAtTime((metronomeVolume / 100) * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

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

  const toggleMetronome = () => {
    if (metronomeOn) {
      stopMetronome();
      setMetronomeOn(false);
    } else if (metronomeEnabled) {
      startMetronome();
      setMetronomeOn(true);
    }
  };

  const handlePlay = async () => {
    if (audioRef.current && currentAudioFile) {
      const url = await getFileUrl(currentAudioFile);
      if (url && audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      
      if (metronomeEnabled && metronomeOn) {
        startMetronome();
      }
    } else {
      toast({
        title: "No Audio File",
        description: "Please select an audio file to play",
        variant: "destructive",
      });
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    setIsPlaying(false);
    setIsPaused(false);
    stopMetronome();
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
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const { settings } = useDevSettings();
    
    if (!user && !settings.guestAudioUploadOverride) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Validate files
    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: `${file.name}: ${validation.errors.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await uploadFiles(acceptedFiles);
      toast({
        title: "Upload Successful",
        description: `${acceptedFiles.length} file(s) uploaded to library`,
      });
      
      // After upload, the uploadFile hook automatically adds to userFiles state
      // Wait a moment for state to update, then auto-select the first file
      setTimeout(() => {
        if (userFiles.length > 0) {
          const newestFile = userFiles[0];
          setCurrentAudioFile(newestFile);
          console.log('Auto-selected file:', newestFile);
        }
      }, 300);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, uploadFiles, validateFile, toast, userFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.flac']
    },
    multiple: true
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">Transport</h2>
      
      {/* Compact Playback Controls */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <Play size={18} />
            Playback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2 mb-4">
            <Button
              onClick={handleRewind}
              variant="transport"
              size="audio"
            >
              <SkipBack size={20} />
            </Button>
            
            <Button
              onClick={isPlaying ? handleStop : handlePlay}
              variant={isPlaying ? "transport-active" : "transport"}
              size="audio"
            >
              {isPlaying ? <Square size={20} /> : <Play size={20} />}
            </Button>
            
            <Button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30);
                }
              }}
              variant="transport"
              size="audio"
              title="Skip forward 30 seconds"
            >
              <RotateCw size={20} />
            </Button>
            
            <Button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30);
                }
              }}
              variant="transport"
              size="audio"
              title="Skip back 30 seconds"
            >
              <RotateCcw size={20} />
            </Button>

            <Button
              onClick={handlePause}
              variant={isPaused ? "transport-active" : "transport"}
              size="audio"
            >
              <Pause size={20} />
            </Button>
          </div>
          
          {/* Audio Scrubber Bar */}
          <div className="space-y-3">
            {currentAudioFile ? (
              <>
                <div className="text-center text-sm font-medium text-foreground">
                  Now Playing: {currentAudioFile.originalName}
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    onValueChange={(value) => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = value[0];
                        setCurrentTime(value[0]);
                      }
                    }}
                    max={duration || 100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No audio file selected</p>
                <p className="text-xs text-muted-foreground">Upload or select from library below</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compact Volume Controls */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <Volume2 size={18} />
            Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Audio: {audioVolume}%</Label>
            <Slider
              value={[audioVolume]}
              onValueChange={(value) => setAudioVolume(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Metronome: {metronomeVolume}%</Label>
            <Slider
              value={[metronomeVolume]}
              onValueChange={(value) => setMetronomeVolume(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Metronome */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <Music size={18} />
            Metronome
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={toggleMetronome}
            variant={metronomeOn ? "audio-active" : "metronome"}
            className="w-full"
            disabled={!metronomeEnabled}
          >
            <Music size={18} />
            {metronomeOn ? 'Stop' : 'Start'} ({bpm} BPM)
          </Button>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <Upload size={18} />
            Import Audio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop files here..." : "Upload Audio Files"}
              </p>
              <p className="text-xs text-muted-foreground">
                MP3, WAV, M4A, AAC, FLAC (Max 50MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Library */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <FolderOpen size={18} />
            Audio Library ({userFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userFiles.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {userFiles.map((file: any) => (
                <Button
                  key={file.id}
                  onClick={() => setCurrentAudioFile(file)}
                  variant={currentAudioFile?.id === file.id ? "audio-active" : "outline"}
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Music size={14} className="mr-2" />
                  {file.originalName}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Music size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No files in library</p>
              <p className="text-xs text-muted-foreground">Upload audio files to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <audio ref={audioRef} />
    </div>
  );
};
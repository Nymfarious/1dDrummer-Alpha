import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, RotateCcw, RotateCw, Upload, Volume2, Music, FileAudio, Trash2, Shield, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSecureAudioUpload } from '@/hooks/useSecureAudioUpload';
import { secureStorage, migrateSensitiveData } from '@/lib/secureStorage';
import { useAuth } from '@/hooks/useAuth';
import { useDevSettings } from '@/contexts/DevSettingsContext';
import { MetronomeIcon } from '@/components/icons/MetronomeIcon';

interface TransportControlsProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (enabled: boolean) => void;
  metronomeSound?: string;
}

export const TransportControls = ({
  bpm,
  setBpm,
  metronomeVolume,
  setMetronomeVolume,
  metronomeEnabled,
  setMetronomeEnabled,
  metronomeSound = 'standard'
}: TransportControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentAudioFile, setCurrentAudioFile] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(80);
  const [metronomeOn, setMetronomeOn] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useDevSettings();
  const { 
    uploads, 
    userFiles, 
    loading: uploadLoading, 
    validateFile,
    uploadFiles, 
    getFileUrl, 
    loadUserFiles, 
    deleteFile,
    clearUploads 
  } = useSecureAudioUpload();

  // Initialize secure storage and load user files
  useEffect(() => {
    const initializeStorage = async () => {
      if (user) {
        await migrateSensitiveData(user.id);
        await loadUserFiles();
      }
    };
    
    initializeStorage();
  }, [user]);

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

  // Update metronome interval when BPM or volume changes while running
  useEffect(() => {
    if (metronomeOn && metronomeEnabled) {
      // Clear existing interval
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      
      // Start new interval with updated BPM
      const interval = (60 / bpm) * 1000;
      metronomeIntervalRef.current = setInterval(() => {
        playMetronomeSound();
      }, interval);
    }
    
    // Cleanup when component unmounts or metronome is turned off
    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
    };
  }, [bpm, metronomeVolume, metronomeOn, metronomeEnabled]);



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

    let frequency = 800;
    
    // Different sounds based on selection from Metronome page
    switch (metronomeSound) {
      case 'standard':
        frequency = 800;
        break;
      case 'sticks':
        frequency = 1200;
        oscillator.type = 'square';
        break;
      case 'high':
        frequency = 1600;
        break;
      case 'two-tone-high':
        // This will be handled by beat counting in future enhancement
        frequency = 800;
        break;
      case 'two-tone-subtle':
        frequency = 800;
        break;
      default:
        frequency = 800;
    }

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
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

  const handlePlay = async () => {
    if (audioRef.current && currentAudioFile) {
      // Get fresh signed URL for the file
      const url = await getFileUrl(currentAudioFile);
      if (url && audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      audioRef.current.play();
    }
    setIsPlaying(true);
    setIsPaused(false);
    
    if (metronomeEnabled && metronomeOn) {
      startMetronome();
    }
    
    toast({
      title: "Playback Started",
      description: currentAudioFile ? `Playing ${currentAudioFile.originalName}` : "Transport controls active",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files before upload
    for (const file of files) {
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

    // Upload files securely
    await uploadFiles(files);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = async (audioFile: any) => {
    try {
      const url = await getFileUrl(audioFile);
      if (url && audioRef.current) {
        audioRef.current.src = url;
        setCurrentAudioFile(audioFile);
        
        toast({
          title: "Audio File Selected",
          description: `Loaded ${audioFile.originalName}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error Loading File",
        description: "Failed to load the selected audio file.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (audioFile: any) => {
    await deleteFile(audioFile);
    
    // If this was the current file, clear it
    if (currentAudioFile?.id === audioFile.id) {
      setCurrentAudioFile(null);
      if (audioRef.current) {
        audioRef.current.src = '';
      }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Playback Controls */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Play size={20} />
              Playback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={handlePlay}
                  variant={isPlaying ? "transport-active" : "transport"}
                  size="sm"
                  className="flex items-center justify-center w-full"
                  disabled={!currentAudioFile}
                >
                  <Play size={18} />
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={handlePause}
                  variant={isPaused ? "transport-active" : "transport"}
                  size="sm"
                  className="flex items-center justify-center w-full"
                  disabled={!currentAudioFile}
                >
                  <Pause size={18} />
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={handleRewind}
                  variant="transport"
                  size="sm"
                  className="flex items-center justify-center w-full"
                  disabled={!currentAudioFile}
                >
                  <SkipBack size={18} />
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={handleSkipBackward}
                  variant="transport"
                  size="sm"
                  className="flex items-center justify-center w-full"
                  disabled={!currentAudioFile}
                >
                  <RotateCcw size={18} />
                </Button>
                <span className="text-[9px] text-muted-foreground">-30s</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={handleSkipForward}
                  variant="transport"
                  size="sm"
                  className="flex items-center justify-center w-full"
                  disabled={!currentAudioFile}
                >
                  <RotateCw size={18} />
                </Button>
                <span className="text-[9px] text-muted-foreground">+30s</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <Button
                  onClick={handleLoop}
                  variant={isLooping ? "transport-active" : "transport"}
                  size="sm"
                  className="flex items-center justify-center w-full"
                  disabled={!currentAudioFile}
                >
                  <RotateCcw size={18} className={isLooping ? "" : "opacity-50"} />
                </Button>
                <span className="text-[9px] text-muted-foreground">Loop</span>
              </div>
            </div>

            {/* Audio Control - moved from separate card */}
            {currentAudioFile && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label>Progress: {formatTime(currentTime)} / {formatTime(duration)}</Label>
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t border-border">
              <Label>Audio Volume: {audioVolume}%</Label>
              <Slider
                value={[audioVolume]}
                onValueChange={(value) => setAudioVolume(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Metronome toggle with BPM and volume controls */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="metronome-toggle"
                  checked={metronomeOn}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      if (metronomeEnabled) {
                        startMetronome();
                        setMetronomeOn(true);
                      }
                    } else {
                      stopMetronome();
                      setMetronomeOn(false);
                    }
                  }}
                  disabled={!metronomeEnabled}
                />
                <Label htmlFor="metronome-toggle" className="flex items-center gap-1 cursor-pointer text-sm">
                  <MetronomeIcon size={40} />
                </Label>
              </div>
              
              {/* Compact volume slider */}
              <div className="flex items-center gap-1 flex-1 max-w-[80px]">
                <Volume2 size={12} className="text-muted-foreground" />
                <Slider
                  value={[metronomeVolume]}
                  onValueChange={(value) => setMetronomeVolume(value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              
              {/* BPM control */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium min-w-[3ch] text-center">{bpm}</span>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-6 p-0 hover:bg-primary/10"
                    onClick={() => setBpm(Math.min(240, bpm + 1))}
                  >
                    <span className="text-xs">▲</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-6 p-0 hover:bg-primary/10"
                    onClick={() => setBpm(Math.max(40, bpm - 1))}
                  >
                    <span className="text-xs">▼</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secure Audio File Upload */}
        <Card className="bg-gradient-card border-border card-shadow lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Shield size={20} />
              Audio Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,.mid,.midi,.mp4,.avi,.mov,.mkv"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="secure-audio-upload"
                />
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="relative"
                    disabled={(!user && !settings.guestAudioUploadOverride) || uploadLoading}
                  >
                    <Upload size={20} />
                    {uploadLoading ? 'Uploading...' : 'Import Audio/Video'}
                  </Button>
                  
                  {uploads.length > 0 && (
                    <Button
                      onClick={clearUploads}
                      variant="outline"
                      size="sm"
                    >
                      Clear Progress
                    </Button>
                  )}
                </div>

                {(!user && !settings.guestAudioUploadOverride) && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Sign in to upload and manage your audio files securely.
                    </p>
                  </div>
                )}

                {/* Upload Progress */}
                {uploads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Upload Progress</h4>
                    {uploads.map((upload, index) => (
                      <div key={index} className="p-2 bg-secondary rounded border">
                        <div className="flex justify-between items-center text-xs">
                          <span className="truncate">{upload.file.name}</span>
                          <span className="capitalize">{upload.status}</span>
                        </div>
                        {upload.status === 'uploading' && (
                          <div className="w-full bg-muted rounded-full h-1 mt-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            />
                          </div>
                        )}
                        {upload.error && (
                          <p className="text-xs text-destructive mt-1">{upload.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Current File */}
                {currentAudioFile && (
                  <div className="p-3 bg-secondary rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">Currently Loaded:</p>
                    <p className="text-sm font-medium truncate">{currentAudioFile.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(currentAudioFile.fileSize / 1024 / 1024).toFixed(2)} MB
                      {currentAudioFile.durationSeconds && (
                        <> • Duration: {Math.floor(currentAudioFile.durationSeconds / 60)}:{(currentAudioFile.durationSeconds % 60).toString().padStart(2, '0')}</>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Recents List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Files</h4>
                {user && userFiles.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {userFiles.slice(0, 10).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-secondary rounded border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            {file.durationSeconds && (
                              <> • {Math.floor(file.durationSeconds / 60)}:{(file.durationSeconds % 60).toString().padStart(2, '0')}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectFile(file)}
                            disabled={currentAudioFile?.id === file.id}
                          >
                            <FileAudio size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-secondary/50 rounded-lg border border-border text-center">
                    <FileAudio size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {user ? 'No files uploaded yet' : 'Sign in to see recent files'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};
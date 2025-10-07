import { useState, useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Square,
  ZoomIn,
  ZoomOut,
  Scissors,
  Save,
  Repeat,
  Trash2,
  Plus,
  Volume2,
  Download,
  Upload as UploadIcon,
  Cloud,
  FileAudio
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDropzone } from 'react-dropzone';
import { useDropbox } from '@/hooks/useDropbox';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useSecureAudioUpload } from '@/hooks/useSecureAudioUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AudioTrack {
  id: string;
  name: string;
  fileId: string;
  waveform: WaveSurfer | null;
  regions: RegionsPlugin | null;
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  volume: number;
}

interface AudioEditorProps {
  userFiles: any[];
  getFileUrl: (file: any) => Promise<string | null>;
}

export const AudioEditor = ({ userFiles, getFileUrl }: AudioEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [zoom, setZoom] = useState(1);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [uploadSource, setUploadSource] = useState<'library' | 'local' | 'cloud'>('library');
  const trackRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { uploadFiles, validateFile } = useSecureAudioUpload();
  const { isConnected: dropboxConnected, uploadFile: uploadToDropbox } = useDropbox();
  const { isConnected: driveConnected, connectGoogleDrive, uploadFile: uploadToDrive } = useGoogleDrive();

  // Local file upload via dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Validate and upload files
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
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, uploadFiles, validateFile, toast]);

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.flac']
    },
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  const handleSourceChange = (source: 'library' | 'local' | 'cloud') => {
    setUploadSource(source);
    if (source === 'local') {
      openFilePicker();
    } else if (source === 'cloud') {
      setShowCloudPicker(true);
    }
  };

  const handleCloudConnect = async (provider: 'dropbox' | 'drive') => {
    if (provider === 'dropbox') {
      toast({
        title: "Dropbox Connected",
        description: "Dropbox is connected in dev mode",
      });
    } else if (provider === 'drive') {
      if (!driveConnected) {
        await connectGoogleDrive();
      }
    }
  };

  const addTrack = async () => {
    if (!selectedFileId) {
      toast({
        title: "Select a file",
        description: "Please select an audio file to add to the editor",
        variant: "destructive"
      });
      return;
    }

    const file = userFiles.find(f => f.id === selectedFileId);
    if (!file) return;

    const trackId = `track-${Date.now()}`;
    const trackName = newTrackName || file.originalName;

    setTracks(prev => [...prev, {
      id: trackId,
      name: trackName,
      fileId: selectedFileId,
      waveform: null,
      regions: null,
      audioBuffer: null,
      isPlaying: false,
      volume: 1
    }]);

    setNewTrackName('');
    setSelectedFileId('');

    // Load the audio after track is added
    setTimeout(() => loadAudioForTrack(trackId, file), 100);
  };

  const loadAudioForTrack = async (trackId: string, file: any) => {
    const container = trackRefs.current[trackId];
    if (!container) return;

    try {
      const url = await getFileUrl(file);
      if (!url) {
        toast({
          title: "Error loading audio",
          description: "Could not get file URL",
          variant: "destructive"
        });
        return;
      }

      const wavesurfer = WaveSurfer.create({
        container,
        waveColor: 'hsl(var(--primary))',
        progressColor: 'hsl(var(--primary-foreground))',
        cursorColor: 'hsl(var(--accent))',
        barWidth: 2,
        barGap: 1,
        height: 80,
        normalize: true,
        backend: 'WebAudio'
      });

      const regions = wavesurfer.registerPlugin(RegionsPlugin.create());

      await wavesurfer.load(url);

      setTracks(prev => prev.map(t => 
        t.id === trackId 
          ? { ...t, waveform: wavesurfer, regions, audioBuffer: wavesurfer.getDecodedData() }
          : t
      ));

      wavesurfer.on('finish', () => {
        if (loopEnabled) {
          wavesurfer.play();
        } else {
          setTracks(prev => prev.map(t => 
            t.id === trackId ? { ...t, isPlaying: false } : t
          ));
        }
      });

      toast({
        title: "Track loaded",
        description: `${file.originalName} ready for editing`
      });
    } catch (error) {
      console.error('Error loading audio:', error);
      toast({
        title: "Load failed",
        description: "Could not load audio file",
        variant: "destructive"
      });
    }
  };

  const togglePlayback = (trackId: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId && track.waveform) {
        if (track.isPlaying) {
          track.waveform.pause();
          return { ...track, isPlaying: false };
        } else {
          track.waveform.play();
          return { ...track, isPlaying: true };
        }
      }
      return track;
    }));
  };

  const stopTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track?.waveform) {
      track.waveform.stop();
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, isPlaying: false } : t
      ));
    }
  };

  const removeTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track?.waveform) {
      track.waveform.destroy();
    }
    setTracks(prev => prev.filter(t => t.id !== trackId));
    delete trackRefs.current[trackId];
  };

  const addRegionToTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track?.regions && track.waveform) {
      const duration = track.waveform.getDuration();
      track.regions.addRegion({
        start: duration * 0.3,
        end: duration * 0.7,
        color: 'hsla(var(--accent), 0.3)',
        drag: true,
        resize: true
      });
      
      toast({
        title: "Region added",
        description: "Drag and resize to select the area to cut or loop"
      });
    }
  };

  const trimTrack = async (trackId: string, trimStart: boolean) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track?.regions || !track.audioBuffer) return;

    const regions = track.regions.getRegions();
    if (regions.length === 0) {
      toast({
        title: "No region selected",
        description: "Add a region first to mark what to keep",
        variant: "destructive"
      });
      return;
    }

    const region = regions[0];
    const sampleRate = track.audioBuffer.sampleRate;
    
    toast({
      title: "Trimming audio",
      description: `Trimming ${trimStart ? 'start' : 'end'} of track...`
    });
    
    // This is a placeholder - actual audio processing would need Web Audio API
    // For now, just show the concept
  };

  const saveEditedTrack = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track?.waveform) return;

    const fileName = `edited-${track.name}-${Date.now()}.mp3`;
    
    toast({
      title: "Saving track",
      description: "Exporting edited audio..."
    });

    // Placeholder for actual export functionality
    // Would use Web Audio API to export the edited buffer
    toast({
      title: "Feature in development",
      description: "Audio export coming soon",
    });
  };

  const updateZoom = (trackId: string, newZoom: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track?.waveform) {
      track.waveform.zoom(newZoom);
    }
  };

  const updateVolume = (trackId: string, volume: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track?.waveform) {
      track.waveform.setVolume(volume);
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, volume } : t
      ));
    }
  };

  useEffect(() => {
    // Update zoom for all tracks
    tracks.forEach(track => {
      if (track.waveform) {
        track.waveform.zoom(zoom);
      }
    });
  }, [zoom]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      tracks.forEach(track => {
        if (track.waveform) {
          track.waveform.destroy();
        }
      });
    };
  }, []);

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🎵 Multi-Track Audio Editor
          </CardTitle>
          <Badge variant="secondary">{tracks.length} tracks</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Track Section */}
        <div {...getRootProps()} className="flex flex-col gap-3 p-4 bg-secondary rounded-lg border border-border">
          <input {...getInputProps()} />
          
          <div className="flex items-center gap-2 mb-2">
            <FileAudio size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">Select Audio Source</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={uploadSource === 'library' ? 'default' : 'outline'}
              onClick={() => setUploadSource('library')}
              className="gap-2"
            >
              <FileAudio size={14} />
              From Library
            </Button>
            
            <Button
              size="sm"
              variant={uploadSource === 'local' ? 'default' : 'outline'}
              onClick={() => handleSourceChange('local')}
              className="gap-2"
            >
              <UploadIcon size={14} />
              Upload Local
            </Button>
            
            <Button
              size="sm"
              variant={uploadSource === 'cloud' ? 'default' : 'outline'}
              onClick={() => handleSourceChange('cloud')}
              className="gap-2"
            >
              <Cloud size={14} />
              From Cloud
            </Button>
          </div>

          {uploadSource === 'library' && (
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                <option value="">Select from library...</option>
                {userFiles.map(file => (
                  <option key={file.id} value={file.id}>
                    {file.originalName}
                  </option>
                ))}
              </select>
              
              <Input
                placeholder="Track name (optional)"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                className="flex-1"
              />
              
              <Button onClick={addTrack} className="gap-2">
                <Plus size={16} />
                Add Track
              </Button>
            </div>
          )}
        </div>

        {/* Cloud Picker Dialog */}
        <Dialog open={showCloudPicker} onOpenChange={setShowCloudPicker}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Select Cloud Storage</DialogTitle>
              <DialogDescription>
                Choose a cloud storage provider to import audio files
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={() => {
                  handleCloudConnect('dropbox');
                  setShowCloudPicker(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <Cloud size={20} />
                  <div className="text-left">
                    <div className="font-medium">Dropbox</div>
                    <div className="text-xs text-muted-foreground">
                      {dropboxConnected ? 'Connected' : 'Connect to import'}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={() => {
                  handleCloudConnect('drive');
                  setShowCloudPicker(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <Cloud size={20} />
                  <div className="text-left">
                    <div className="font-medium">Google Drive</div>
                    <div className="text-xs text-muted-foreground">
                      {driveConnected ? 'Connected' : 'Connect to import'}
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Global Controls */}
        {tracks.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-secondary rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Zoom:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.max(1, zoom - 10))}
              >
                <ZoomOut size={14} />
              </Button>
              <span className="text-sm min-w-[3rem] text-center">{zoom}x</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(zoom + 10)}
              >
                <ZoomIn size={14} />
              </Button>
            </div>

            <Button
              size="sm"
              variant={loopEnabled ? "default" : "outline"}
              onClick={() => setLoopEnabled(!loopEnabled)}
              className="gap-2"
            >
              <Repeat size={14} />
              Loop
            </Button>
          </div>
        )}

        {/* Tracks */}
        <div className="space-y-4">
          {tracks.map(track => (
            <Card key={track.id} className="bg-background border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{track.name}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTrack(track.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                {/* Waveform */}
                <div 
                  ref={el => trackRefs.current[track.id] = el}
                  className="w-full bg-secondary/50 rounded-md"
                />

                {/* Track Controls */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={track.isPlaying ? "default" : "outline"}
                    onClick={() => togglePlayback(track.id)}
                  >
                    {track.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopTrack(track.id)}
                  >
                    <Square size={14} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addRegionToTrack(track.id)}
                    className="gap-1"
                  >
                    <Scissors size={14} />
                    Select Region
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => trimTrack(track.id, true)}
                    className="gap-1"
                  >
                    Trim Start
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => trimTrack(track.id, false)}
                    className="gap-1"
                  >
                    Trim End
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveEditedTrack(track.id)}
                    className="gap-1"
                  >
                    <Save size={14} />
                    Save Copy
                  </Button>

                  <div className="flex items-center gap-2 ml-auto">
                    <Volume2 size={14} />
                    <Slider
                      value={[track.volume * 100]}
                      onValueChange={(v) => updateVolume(track.id, v[0] / 100)}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No tracks loaded</p>
            <p className="text-sm">Select a file from your library and click "Add Track" to start editing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

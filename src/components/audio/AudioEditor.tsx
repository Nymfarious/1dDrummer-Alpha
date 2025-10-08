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
import { DropboxFilePicker } from './DropboxFilePicker';
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
  const [showDropboxPicker, setShowDropboxPicker] = useState(false);
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
      setShowCloudPicker(false);
      setShowDropboxPicker(true);
    } else if (provider === 'drive') {
      if (!driveConnected) {
        await connectGoogleDrive();
      }
      setShowCloudPicker(false);
    }
  };

  const handleDropboxFileSelect = async (file: Blob, fileName: string) => {
    const url = URL.createObjectURL(file);
    const trackId = `track-${Date.now()}`;
    const trackName = fileName;

    setTracks(prev => [...prev, {
      id: trackId,
      name: trackName,
      fileId: `dropbox-${trackId}`,
      waveform: null,
      regions: null,
      audioBuffer: null,
      isPlaying: false,
      volume: 1
    }]);

    // Load the audio after track is added
    setTimeout(() => loadDropboxAudio(trackId, url, fileName), 100);
  };

  const loadDropboxAudio = async (trackId: string, url: string, fileName: string) => {
    const container = trackRefs.current[trackId];
    if (!container) return;

    try {
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
        description: `${fileName} ready for editing`
      });
    } catch (error) {
      console.error('Error loading audio:', error);
      toast({
        title: "Load failed",
        description: "Could not load audio file from Dropbox",
        variant: "destructive"
      });
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

  const saveEditedTrack = async (trackId: string, destination: 'library' | 'dropbox' = 'library') => {
    const track = tracks.find(t => t.id === trackId);
    if (!track?.waveform) return;

    const fileName = `edited-${track.name}-${Date.now()}.wav`;
    
    toast({
      title: "Exporting track",
      description: "Preparing audio file..."
    });

    try {
      // Export the audio buffer to WAV format
      const audioBuffer = track.waveform.getDecodedData();
      if (!audioBuffer) {
        throw new Error("No audio data available");
      }

      // Convert AudioBuffer to WAV blob
      const wavBlob = await audioBufferToWav(audioBuffer);

      if (destination === 'dropbox') {
        // Save to Dropbox
        if (!dropboxConnected) {
          toast({
            title: "Not Connected",
            description: "Please connect to Dropbox first",
            variant: "destructive",
          });
          return;
        }

        const result = await uploadToDropbox(wavBlob, fileName, 'edited-tracks');
        if (result) {
          toast({
            title: "Saved to Dropbox",
            description: `${fileName} saved successfully`,
          });
        }
      } else {
        // Save to library (Supabase storage)
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to save to library",
            variant: "destructive",
          });
          return;
        }

        // Convert blob to File for upload
        const file = new File([wavBlob], fileName, { type: 'audio/wav' });
        await uploadFiles([file]);
        
        toast({
          title: "Saved to Library",
          description: `${fileName} saved successfully`,
        });
      }
    } catch (error) {
      console.error('Error saving track:', error);
      toast({
        title: "Save Failed",
        description: "Could not export audio file",
        variant: "destructive",
      });
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = new Float32Array(audioBuffer.length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        data[i * numberOfChannels + channel] = channelData[i];
      }
    }

    const dataLength = data.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    const volume = 0.8;
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample * volume * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
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
          <DialogContent className="bg-gradient-to-br from-background via-background to-accent/5 border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Select Cloud Storage
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Choose a cloud storage provider to import your audio files
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-6">
              <button
                className="w-full group relative overflow-hidden rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-card to-card/50 hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] p-6"
                onClick={() => {
                  handleCloudConnect('dropbox');
                  setShowCloudPicker(false);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Cloud size={24} className="text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      Dropbox
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {dropboxConnected ? (
                        <span className="text-primary">✓ Connected - Browse your files</span>
                      ) : (
                        'Connect to browse and import audio'
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>

              <button
                className="w-full group relative overflow-hidden rounded-lg border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 bg-gradient-to-br from-card to-card/50 hover:shadow-[0_0_20px_rgba(var(--accent),0.2)] p-6"
                onClick={() => {
                  handleCloudConnect('drive');
                  setShowCloudPicker(false);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Cloud size={24} className="text-accent" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors">
                      Google Drive
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {driveConnected ? (
                        <span className="text-accent">✓ Connected - Browse your files</span>
                      ) : (
                        'Connect to browse and import audio'
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-accent transition-colors">
                    →
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dropbox File Picker */}
        <DropboxFilePicker
          open={showDropboxPicker}
          onOpenChange={setShowDropboxPicker}
          onFileSelect={handleDropboxFileSelect}
        />

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
                    onClick={() => saveEditedTrack(track.id, 'library')}
                    className="gap-1"
                    title="Save to your library"
                  >
                    <Save size={14} />
                    Save to Library
                  </Button>

                  {dropboxConnected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveEditedTrack(track.id, 'dropbox')}
                      className="gap-1"
                      title="Save to Dropbox"
                    >
                      <Cloud size={14} />
                      Save to Dropbox
                    </Button>
                  )}

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

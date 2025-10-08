import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Circle, Upload, Download, Trash2, Mic, Play, Pause, Check, X, Edit2, CloudUpload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useSecureAudioUpload } from '@/hooks/useSecureAudioUpload';
import { useDropbox } from '@/hooks/useDropbox';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { DropboxFilePicker } from '@/components/audio/DropboxFilePicker';

interface Recording {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  accepted: boolean;
}

export const RecordingPanel = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; recordingId: string; currentName: string }>({
    open: false,
    recordingId: '',
    currentName: ''
  });
  const [newName, setNewName] = useState('');
  const [showDropboxPicker, setShowDropboxPicker] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  const { uploadFile: uploadToSupabase } = useSecureAudioUpload();
  const dropbox = useDropbox();
  const googleDrive = useGoogleDrive();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newRecording: Recording = {
          id: Date.now().toString(),
          name: `Session ${new Date().toLocaleTimeString()}`,
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          timestamp: new Date(),
          accepted: false
        };
        
        setCurrentRecording(newRecording);
        setRecordingTime(0);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        toast({
          title: "Recording Complete",
          description: "Review your recording - replay, accept, or re-record.",
        });
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer to track recording duration
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 60 seconds (1 minute)
          if (newTime >= 60) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Maximum duration: 1 minute",
      });
      
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Microphone access denied or unavailable",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
  };

  const playRecording = (recording: Recording) => {
    // If currently playing this recording, pause it
    if (playingId === recording.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    
    // If paused on this recording, resume it
    if (playingId === recording.id && audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setPlayingId(recording.id);
      return;
    }
    
    // If switching to a different recording or first time playing
    if (!audioRef.current || playingId !== recording.id) {
      // Clean up previous audio if exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(recording.url);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
      
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      audio.onended = () => {
        setPlayingId(null);
        setCurrentTime(0);
      };
      
      audio.play();
      setPlayingId(recording.id);
    }
  };

  const seekAudio = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const acceptRecording = async () => {
    if (currentRecording) {
      try {
        // Add to local recordings first
        setRecordings(prev => [...prev, { ...currentRecording, accepted: true }]);
        
        // Upload to Supabase storage with category 'recording'
        const file = new File([currentRecording.blob], `${currentRecording.name}.webm`, {
          type: 'audio/webm'
        });
        
        const uploadedFile = await uploadToSupabase(file, 'recording');
        
        if (uploadedFile) {
          toast({
            title: "Recording Saved",
            description: "Recording saved to your Audio Library",
          });
        } else {
          toast({
            title: "Recording Saved Locally",
            description: "Recording saved but cloud sync failed",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error uploading recording:', error);
        toast({
          title: "Recording Saved Locally",
          description: "Recording saved but cloud sync failed",
          variant: "destructive",
        });
      } finally {
        setCurrentRecording(null);
      }
    }
  };

  const reRecord = () => {
    if (currentRecording) {
      URL.revokeObjectURL(currentRecording.url);
      setCurrentRecording(null);
    }
  };

  const downloadRecording = (recording: Recording, format: 'webm' | 'wav') => {
    const link = document.createElement('a');
    link.href = recording.url;
    link.download = `${recording.name}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Saving ${recording.name}.${format}`,
    });
  };

  const deleteRecording = (recordingId: string) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === recordingId);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== recordingId);
    });
    
    toast({
      title: "Recording Deleted",
      description: "Recording removed from library",
    });
  };

  const openRenameDialog = (recordingId: string, currentName: string) => {
    setRenameDialog({ open: true, recordingId, currentName });
    setNewName(currentName);
  };

  const renameRecording = () => {
    if (newName.trim()) {
      setRecordings(prev => prev.map(r => 
        r.id === renameDialog.recordingId ? { ...r, name: newName.trim() } : r
      ));
      setRenameDialog({ open: false, recordingId: '', currentName: '' });
      toast({
        title: "Recording Renamed",
        description: `Renamed to "${newName.trim()}"`,
      });
    }
  };

  const uploadToDropbox = async (recording: Recording) => {
    await dropbox.uploadFile(recording.blob, `${recording.name}.webm`);
  };

  const uploadToGoogleDrive = async (recording: Recording) => {
    await googleDrive.uploadFile(recording.blob, `${recording.name}.webm`);
  };

  const uploadToSupabaseCloud = async (recording: Recording) => {
    const file = new File([recording.blob], `${recording.name}.webm`, { type: 'audio/webm' });
    await uploadToSupabase(file, 'recording');
  };

  const handleDropboxFileSelect = async (blob: Blob, fileName: string) => {
    const audioUrl = URL.createObjectURL(blob);
    const newRecording: Recording = {
      id: Date.now().toString(),
      name: fileName.replace(/\.[^/.]+$/, ''),
      blob,
      url: audioUrl,
      duration: 0,
      timestamp: new Date(),
      accepted: true
    };
    
    setRecordings(prev => [...prev, newRecording]);
    setShowDropboxPicker(false);
    
    toast({
      title: "File Loaded",
      description: `${fileName} added to your library`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground mb-6">Recording Studio</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recording Controls */}
          <Card className="bg-gradient-card border-border card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Mic size={20} />
                Audio Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "audio-danger" : "audio"}
                size="wide"
                className="w-full"
                disabled={!!currentRecording}
              >
                <Circle 
                  size={20} 
                  fill={isRecording ? "currentColor" : "transparent"} 
                  className={isRecording ? "animate-pulse" : ""}
                />
                {isRecording ? `Stop Recording (${formatTime(recordingTime)})` : 'Start Recording (1 Min Max)'}
              </Button>
              
              {isRecording && (
                <div className="p-4 bg-audio-danger/10 rounded-lg border border-audio-danger/20 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Circle size={12} className="text-audio-danger animate-pulse" fill="currentColor" />
                    <span className="text-sm font-medium">Recording: {formatTime(recordingTime)} / 1:00</span>
                  </div>
                  <div className="space-y-1">
                    <Slider
                      value={[recordingTime]}
                      max={60}
                      step={1}
                      disabled
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(recordingTime)}</span>
                      <span>1:00</span>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Recording will auto-stop at 1 minute
                  </p>
                </div>
              )}

              {/* Current Recording Review */}
              {currentRecording && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">New Recording Ready</p>
                      <p className="text-xs text-muted-foreground">{formatTime(currentRecording.duration)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={playingId === currentRecording.id && audioRef.current && !audioRef.current.paused ? "outline" : "default"}
                      onClick={() => playRecording(currentRecording)}
                    >
                      {playingId === currentRecording.id && audioRef.current && !audioRef.current.paused ? (
                        <>
                          <Pause size={16} />
                          Pause
                        </>
                      ) : playingId === currentRecording.id ? (
                        <>
                          <Play size={16} />
                          Resume
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {playingId === currentRecording.id && (
                    <div className="space-y-1">
                      <Slider
                        value={[currentTime]}
                        max={duration || currentRecording.duration}
                        step={0.1}
                        onValueChange={(value) => seekAudio(value[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(Math.floor(currentTime))}</span>
                        <span>{formatTime(Math.floor(duration || currentRecording.duration))}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={acceptRecording}
                    >
                      <Check size={16} />
                      Accept & Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={reRecord}
                    >
                      <X size={16} />
                      Discard & Re-record
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recordings Library */}
          <Card className="bg-gradient-card border-border card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-accent">
                  <Download size={20} />
                  Your Recording Placeholder ({recordings.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDropboxPicker(true)}
                  disabled={!dropbox.isConnected}
                >
                  <CloudUpload size={16} />
                  Import from Dropbox
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mic size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No saved recordings yet</p>
                  <p className="text-sm">Accept recordings to add them to your library</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recordings.map((recording) => (
                    <div key={recording.id} className="p-3 bg-secondary rounded-lg border border-border space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{recording.name}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => openRenameDialog(recording.id, recording.name)}
                            >
                              <Edit2 size={12} />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(recording.duration)} • {recording.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={playingId === recording.id ? "outline" : "ghost"}
                          onClick={() => playRecording(recording)}
                        >
                          {playingId === recording.id ? <Pause size={14} /> : <Play size={14} />}
                        </Button>
                      </div>
                      
                      {playingId === recording.id && (
                        <div className="space-y-1">
                          <Slider
                            value={[currentTime]}
                            max={duration || recording.duration}
                            step={0.1}
                            onValueChange={(value) => seekAudio(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatTime(Math.floor(currentTime))}</span>
                            <span>{formatTime(Math.floor(duration || recording.duration))}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 relative"
                          onClick={() => downloadRecording(recording, 'webm')}
                        >
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"></span>
                          <Download size={14} />
                          Save WebM
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 relative"
                          onClick={() => downloadRecording(recording, 'wav')}
                        >
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"></span>
                          <Download size={14} />
                          Save WAV
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 relative"
                              disabled={!recording.accepted}
                            >
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-500"></span>
                              <CloudUpload size={14} />
                              Save to Cloud
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => uploadToSupabaseCloud(recording)}>
                              <CloudUpload size={14} className="mr-2" />
                              Supabase Cloud
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => uploadToDropbox(recording)}
                              disabled={!dropbox.isConnected}
                            >
                              <CloudUpload size={14} className="mr-2" />
                              Dropbox {!dropbox.isConnected && "(Connect in Settings)"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => uploadToGoogleDrive(recording)}
                              disabled={!googleDrive.isConnected}
                            >
                              <CloudUpload size={14} className="mr-2" />
                              Google Drive {!googleDrive.isConnected && "(Connect in Settings)"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRecording(recording.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => !open && setRenameDialog({ open: false, recordingId: '', currentName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name..."
              onKeyDown={(e) => e.key === 'Enter' && renameRecording()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, recordingId: '', currentName: '' })}>
              Cancel
            </Button>
            <Button onClick={renameRecording} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dropbox File Picker */}
      <DropboxFilePicker
        open={showDropboxPicker}
        onOpenChange={setShowDropboxPicker}
        onFileSelect={handleDropboxFileSelect}
      />
    </>
  );
};
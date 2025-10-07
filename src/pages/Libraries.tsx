import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Clock,
  Calendar,
  Volume2,
  Upload,
  File,
  Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSecureAudioUpload } from '@/hooks/useSecureAudioUpload';
import { useAuth } from '@/hooks/useAuth';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';

interface Recording {
  id: string;
  name: string;
  duration: string;
  date: string;
  size: string;
  type: 'recording' | 'upload';
}

export const Libraries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userFiles, getFileUrl, uploadFiles, validateFile } = useSecureAudioUpload();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recording' | 'upload'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const filteredFiles = userFiles.map(file => ({
    id: file.id,
    name: file.originalName,
    duration: file.durationSeconds ? `${Math.floor(file.durationSeconds / 60)}:${(file.durationSeconds % 60).toString().padStart(2, '0')}` : '0:00',
    date: file.createdAt,
    size: file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB` : '0 MB',
    type: (file.file_category === 'recording' ? 'recording' : 'upload') as 'recording' | 'upload'
  }))
    .filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || file.type === filterType)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePlay = async (file: Recording) => {
    if (playingId === file.id && currentAudio) {
      // Stop current playback
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingId(null);
      return;
    }
    
    // Stop any existing audio
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    
    setPlayingId(file.id);
    
    // For uploaded files, get the URL and play
    if (file.type === 'upload') {
      try {
        const url = await getFileUrl(userFiles.find(f => f.id === file.id));
        if (url) {
          const audio = new Audio(url);
          setCurrentAudio(audio);
          audio.play();
          audio.onended = () => {
            setPlayingId(null);
            setCurrentAudio(null);
          };
        }
      } catch (error) {
        toast({
          title: "Playback Error",
          description: "Could not play this file",
          variant: "destructive",
        });
        setPlayingId(null);
      }
    } else {
      // For recordings, simulate playback
      toast({
        title: "Playing Recording",
        description: `Playing ${file.name}`,
      });
      
      setTimeout(() => {
        setPlayingId(null);
      }, 3000);
    }
  };

  const handleDelete = async (fileId: string) => {
    const file = userFiles.find(f => f.id === fileId);
    if (!file) return;
    
    try {
      // Delete from Supabase
      const bucketName = 'audio-files';
      await supabase.storage.from(bucketName).remove([file.fileName]);
      await supabase.from('user_audio_files').delete().eq('id', fileId);
      
      toast({
        title: "File Deleted",
        description: "Recording removed from library",
      });
      
      // Reload files
      window.location.reload();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the file",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
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
        description: `${acceptedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, uploadFiles, validateFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.flac']
    },
    multiple: true
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground status-warning">Library</h2>
        <Badge variant="secondary" className="text-sm">
          {filteredFiles.length} files
        </Badge>
      </div>

      {/* Upload Area */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Upload Audio Files</h3>
              <p className="text-muted-foreground">
                {isDragActive
                  ? "Drop your audio files here..."
                  : "Drag & drop audio files here, or click to browse"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Supports MP3, WAV, M4A, AAC, FLAC (Max 50MB each)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search your audio files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterType('all')}
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                All Files
              </Button>
              <Button
                onClick={() => setFilterType('recording')}
                variant={filterType === 'recording' ? 'default' : 'outline'}
                size="sm"
              >
                Recordings
              </Button>
              <Button
                onClick={() => setFilterType('upload')}
                variant={filterType === 'upload' ? 'default' : 'outline'}
                size="sm"
              >
                Uploads
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.length === 0 ? (
          <Card className="col-span-full bg-gradient-card border-border">
            <CardContent className="p-8 text-center">
              <Music size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Start recording or upload audio files to build your library'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => (
            <Card key={file.id} className="bg-gradient-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{file.name}</CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {file.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(file.date)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={file.type === 'recording' ? 'default' : 'secondary'}>
                    {file.type === 'recording' ? 'Recorded' : 'Uploaded'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Size: {file.size}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePlay(file)}
                    variant={playingId === file.id ? "audio-active" : "audio"}
                    size="sm"
                    className="flex-1"
                  >
                    {playingId === file.id ? (
                      <>
                        <Square size={16} />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Play
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    title="Download"
                  >
                    <Download size={16} />
                  </Button>
                  
                  <Button
                    onClick={() => handleDelete(file.id)}
                    variant="destructive"
                    size="sm"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Storage Info */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Library Storage</span>
            <span>
              {userFiles.length} files • 
              {(userFiles.reduce((acc, file) => acc + (file.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} MB used
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Libraries;
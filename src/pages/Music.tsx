import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Music2, 
  FileText,
  Image as ImageIcon,
  Download, 
  Trash2, 
  Search,
  Upload,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDropzone } from 'react-dropzone';

interface MusicFile {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'pdf' | 'image';
  url: string;
}

export const Music = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);

  const filteredFiles = musicFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (fileId: string) => {
    setMusicFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File Deleted",
      description: "Music file removed from library",
    });
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Process uploaded files
    const newFiles: MusicFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      date: new Date().toISOString(),
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.type.startsWith('image/') ? 'image' : 'pdf',
      url: URL.createObjectURL(file)
    }));

    setMusicFiles(prev => [...newFiles, ...prev]);
    
    toast({
      title: "Upload Successful",
      description: `${acceptedFiles.length} file(s) uploaded successfully`,
    });
  }, [user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Music Library</h2>
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
              <h3 className="text-lg font-medium">Upload Music Files</h3>
              <p className="text-muted-foreground">
                {isDragActive
                  ? "Drop your files here..."
                  : "Drag & drop PDFs or images here, or click to browse"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, JPG, PNG, GIF, WEBP (Max 50MB each)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search your music files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.length === 0 ? (
          <Card className="col-span-full bg-gradient-card border-border">
            <CardContent className="p-8 text-center">
              <Music2 size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search'
                  : 'Upload sheet music, tabs, or reference images to build your library'
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
                    <CardTitle className="text-lg truncate flex items-center gap-2">
                      {file.type === 'pdf' ? <FileText size={18} /> : <ImageIcon size={18} />}
                      {file.name}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{formatDate(file.date)}</span>
                    </div>
                  </div>
                  <Badge variant={file.type === 'pdf' ? 'default' : 'secondary'}>
                    {file.type.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Size: {file.size}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(file.url, '_blank')}
                    variant="audio"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye size={16} />
                    View
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
            <span>Music Library Storage</span>
            <span>
              {musicFiles.length} files • 
              {musicFiles.reduce((acc, file) => acc + parseFloat(file.size), 0).toFixed(1)} MB used
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Music;

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDropbox } from '@/hooks/useDropbox';
import { Loader2, FileAudio, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DropboxFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: Blob, fileName: string) => void;
}

interface DropboxEntry {
  '.tag': 'file' | 'folder';
  name: string;
  path_display: string;
  path_lower: string;
  id: string;
}

export const DropboxFilePicker = ({ open, onOpenChange, onFileSelect }: DropboxFilePickerProps) => {
  const [files, setFiles] = useState<DropboxEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('/Apps/dDrummer');
  const { listFiles, downloadFile } = useDropbox();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFiles(currentPath);
    }
  }, [open, currentPath]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    try {
      const entries = await listFiles(path);
      setFiles(entries || []);
    } catch (error) {
      console.error('Error loading Dropbox files:', error);
      toast({
        title: "Error",
        description: "Failed to load files from Dropbox",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (entry: DropboxEntry) => {
    if (entry['.tag'] === 'folder') {
      setCurrentPath(entry.path_display);
      return;
    }

    // Only handle audio files
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'];
    const isAudio = audioExtensions.some(ext => entry.name.toLowerCase().endsWith(ext));
    
    if (!isAudio) {
      toast({
        title: "Invalid File",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    setDownloading(entry.path_display);
    try {
      const blob = await downloadFile(entry.path_display);
      if (blob) {
        onFileSelect(blob, entry.name);
        onOpenChange(false);
        toast({
          title: "File Loaded",
          description: `${entry.name} loaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file from Dropbox",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleGoBack = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 2) { // Keep at least /Apps/dDrummer
      pathParts.pop();
      setCurrentPath('/' + pathParts.join('/'));
    }
  };

  const canGoBack = currentPath !== '/Apps/dDrummer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Select Audio from Dropbox
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Browse your Dropbox files and select an audio file to load into the editor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card/50 border border-primary/10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Folder className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground font-mono truncate">
                {currentPath}
              </p>
            </div>
            {canGoBack && (
              <Button 
                onClick={handleGoBack} 
                variant="outline" 
                size="sm"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/10"
              >
                ← Back
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your files...</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px] rounded-lg border border-primary/10 bg-card/30">
              <div className="p-3 space-y-2">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FileAudio className="h-16 w-16 text-muted-foreground/50" />
                    <p className="text-center text-muted-foreground">
                      No files found in this folder
                    </p>
                  </div>
                ) : (
                  files.map((entry) => {
                    const isFolder = entry['.tag'] === 'folder';
                    const isDownloading = downloading === entry.path_display;
                    
                    return (
                      <button
                        key={entry.id}
                        className={`w-full group relative overflow-hidden rounded-lg border transition-all duration-300 p-4 text-left ${
                          isFolder
                            ? 'border-accent/20 hover:border-accent/40 hover:bg-accent/5 hover:shadow-[0_0_15px_rgba(var(--accent),0.1)]'
                            : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                        } ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleFileClick(entry)}
                        disabled={isDownloading}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`p-2 rounded-lg transition-colors ${
                            isFolder 
                              ? 'bg-accent/10 group-hover:bg-accent/20' 
                              : 'bg-primary/10 group-hover:bg-primary/20'
                          }`}>
                            {isDownloading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : isFolder ? (
                              <Folder className="h-5 w-5 text-accent" />
                            ) : (
                              <FileAudio className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`block truncate font-medium transition-colors ${
                              isFolder
                                ? 'text-foreground group-hover:text-accent'
                                : 'text-foreground group-hover:text-primary'
                            }`}>
                              {entry.name}
                            </span>
                            {isDownloading && (
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Downloading...
                              </span>
                            )}
                          </div>
                          {!isDownloading && (
                            <div className={`text-muted-foreground transition-colors ${
                              isFolder ? 'group-hover:text-accent' : 'group-hover:text-primary'
                            }`}>
                              {isFolder ? '→' : '↓'}
                            </div>
                          )}
                        </div>
                        <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          isFolder
                            ? 'from-accent/0 via-accent/5 to-accent/0'
                            : 'from-primary/0 via-primary/5 to-primary/0'
                        }`} />
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

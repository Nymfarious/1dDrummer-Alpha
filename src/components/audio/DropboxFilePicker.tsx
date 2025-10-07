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
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Audio from Dropbox</DialogTitle>
          <DialogDescription>
            Browse your Dropbox files and select an audio file to load
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-mono truncate">
              {currentPath}
            </p>
            {canGoBack && (
              <Button onClick={handleGoBack} variant="outline" size="sm">
                ← Back
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-2">
                {files.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No files found in this folder
                  </p>
                ) : (
                  files.map((entry) => (
                    <Button
                      key={entry.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleFileClick(entry)}
                      disabled={downloading === entry.path_display}
                    >
                      {downloading === entry.path_display ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : entry['.tag'] === 'folder' ? (
                        <Folder className="h-4 w-4 mr-2" />
                      ) : (
                        <FileAudio className="h-4 w-4 mr-2" />
                      )}
                      <span className="truncate">{entry.name}</span>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

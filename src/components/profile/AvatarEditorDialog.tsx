import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Cloud, Camera, Grid3x3, Sparkles } from 'lucide-react';
import { useDropbox } from '@/hooks/useDropbox';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PresetAvatars } from './PresetAvatars';

interface AvatarEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarSelected: (url: string) => void;
  onOpenAIGenerator: () => void;
}

export const AvatarEditorDialog = ({
  open,
  onOpenChange,
  onAvatarSelected,
  onOpenAIGenerator,
}: AvatarEditorDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const dropbox = useDropbox();
  const googleDrive = useGoogleDrive();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onAvatarSelected(publicUrl);
      onOpenChange(false);
      
      toast({
        title: "Avatar Uploaded",
        description: "Your avatar has been updated successfully!",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCameraClick = () => {
    toast({
      title: "Camera Feature",
      description: "Camera capture coming soon!",
    });
  };

  const handleCloudUpload = (provider: 'dropbox' | 'google') => {
    toast({
      title: `${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'} Upload`,
      description: "Cloud storage upload integration coming soon!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Avatar</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="cloud">
              <Cloud className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Camera className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="presets">
              <Grid3x3 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 py-4">
            <div className="text-center space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 hover:border-primary transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Upload from Device</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an image from your device
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Select Image'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cloud" className="space-y-4 py-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleCloudUpload('dropbox')}
              >
                <Cloud className="w-4 h-4 mr-2" />
                Upload from Dropbox
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleCloudUpload('google')}
              >
                <Cloud className="w-4 h-4 mr-2" />
                Upload from Google Drive
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4 py-4">
            <div className="text-center space-y-4">
              <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="font-medium">Camera Capture</h3>
              <p className="text-sm text-muted-foreground">
                Take a photo using your device camera
              </p>
              <Button onClick={handleCameraClick} variant="outline">
                Open Camera (Coming Soon)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="py-4">
            <PresetAvatars onSelect={(url) => {
              onAvatarSelected(url);
              onOpenChange(false);
            }} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 py-4">
            <div className="text-center space-y-4">
              <Sparkles className="w-16 h-16 mx-auto text-primary" />
              <h3 className="font-medium">AI-Generated Avatar</h3>
              <p className="text-sm text-muted-foreground">
                Create a unique avatar using AI
              </p>
              <Button onClick={() => {
                onOpenAIGenerator();
                onOpenChange(false);
              }}>
                <Sparkles className="w-4 h-4 mr-2" />
                Open AI Generator
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AvatarCollectionItem {
  id: string;
  avatar_url: string;
  source: 'upload' | 'ai_generated' | 'preset';
  created_at: string;
  is_current: boolean;
}

interface AvatarCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAvatar: (url: string) => void;
  currentAvatarUrl?: string;
}

export const AvatarCollectionDialog = ({
  open,
  onOpenChange,
  onSelectAvatar,
  currentAvatarUrl,
}: AvatarCollectionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collection, setCollection] = useState<AvatarCollectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadCollection();
    }
  }, [open, user]);

  const loadCollection = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('avatar_collection')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCollection((data || []) as AvatarCollectionItem[]);
    } catch (error) {
      console.error('Error loading avatar collection:', error);
      toast({
        title: "Error",
        description: "Failed to load avatar collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('avatar_collection')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollection(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Avatar removed from collection",
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast({
        title: "Error",
        description: "Failed to delete avatar",
        variant: "destructive",
      });
    }
  };

  const handleSelect = (url: string) => {
    onSelectAvatar(url);
    onOpenChange(false);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'upload':
        return 'Uploaded';
      case 'ai_generated':
        return 'AI Generated';
      case 'preset':
        return 'Preset';
      default:
        return source;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Avatar Collection</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Browse and select from your saved avatars
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : collection.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No avatars in your collection yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create or upload avatars to build your collection!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collection.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all"
              >
                <div className="aspect-square relative">
                  <img
                    src={item.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {currentAvatarUrl === item.avatar_url && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSelect(item.avatar_url)}
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted/50">
                  <p className="text-xs text-center text-muted-foreground">
                    {getSourceLabel(item.source)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

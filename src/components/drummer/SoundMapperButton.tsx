import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export const SoundMapperButton = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenMapper = () => {
    setOpen(true);
    toast({
      title: "Sound Mapper",
      description: "Custom sound mapping feature coming soon!",
    });
  };

  return (
    <>
      <Button
        onClick={handleOpenMapper}
        variant="outline"
        size="sm"
        className="relative"
      >
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-500"></span>
        <Wand2 size={16} className="ml-2" />
        Sound Mapper
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sound Mapper</DialogTitle>
            <DialogDescription>
              Map custom sounds to different metronome patterns and beats.
              This feature is coming soon!
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Future features:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• Assign custom sounds to beats</li>
              <li>• Create sound patterns</li>
              <li>• Import audio samples</li>
              <li>• Save custom presets</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

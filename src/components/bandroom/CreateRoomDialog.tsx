import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface CreateRoomDialogProps {
  onCreateRoom: (roomName: string, isBreakout: boolean) => void;
}

export const CreateRoomDialog = ({ onCreateRoom }: CreateRoomDialogProps) => {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isBreakout, setIsBreakout] = useState(false);

  const handleCreate = () => {
    if (roomName.trim()) {
      onCreateRoom(roomName.trim(), isBreakout);
      setRoomName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="audio-active" size="wide" className="w-full">
          <Plus size={20} />
          Create New Room
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-accent">Create New Room</DialogTitle>
          <DialogDescription>
            Create a new practice space for collaboration
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Snare Practice, Warm-up Room"
              className="bg-input border-border"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBreakout"
              checked={isBreakout}
              onChange={(e) => setIsBreakout(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="isBreakout" className="cursor-pointer">
              Create as breakout room
            </Label>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            variant="audio-active" 
            onClick={handleCreate}
            disabled={!roomName.trim()}
            className="flex-1"
          >
            Create Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

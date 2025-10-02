import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { containsProfanity, sanitizeName } from '@/lib/profanityFilter';

interface ParticipantNameDialogProps {
  open: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const ParticipantNameDialog = ({
  open,
  onConfirm,
  onCancel,
}: ParticipantNameDialogProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const sanitized = sanitizeName(name);
    
    if (!sanitized) {
      setError('Please enter a name');
      return;
    }
    
    if (containsProfanity(sanitized)) {
      setError('Please use appropriate language');
      return;
    }
    
    onConfirm(sanitized);
    setName('');
    setError('');
  };

  const handleCancel = () => {
    setName('');
    setError('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Your Name</DialogTitle>
          <DialogDescription>
            Choose a display name to join the Band Hall
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
              placeholder="Enter your name..."
              maxLength={50}
              className="bg-input border-border"
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Join Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

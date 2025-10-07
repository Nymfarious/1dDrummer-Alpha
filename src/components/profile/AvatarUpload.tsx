import { useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Upload, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  avatarUrl: string | null;
  ringColor: 'blue' | 'green' | 'red';
  position: { x: number; y: number; zoom: number };
  onAvatarChange: (file: File) => void;
  onRingColorChange: (color: 'blue' | 'green' | 'red') => void;
  onPositionChange: (position: { x: number; y: number; zoom: number }) => void;
}

export const AvatarUpload = ({
  avatarUrl,
  ringColor,
  position,
  onAvatarChange,
  onRingColorChange,
  onPositionChange,
}: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const ringColors = {
    blue: 'ring-blue-500',
    green: 'ring-green-500',
    red: 'ring-red-500',
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarChange(file);
    }
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3, position.zoom + delta));
    onPositionChange({ ...position, zoom: newZoom });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onPositionChange({
        ...position,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            'relative rounded-full ring-4',
            ringColors[ringColor],
            isDragging && 'cursor-move'
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${position.zoom})`,
                  transformOrigin: 'center',
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Upload className="w-8 h-8" />
              </div>
            )}
          </div>
        </div>
        {avatarUrl && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-background rounded-full p-1 shadow-md">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleZoom(-0.1)}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleZoom(0.1)}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Avatar
      </Button>

      <div className="flex gap-2">
        {(['blue', 'green', 'red'] as const).map((color) => (
          <button
            key={color}
            onClick={() => onRingColorChange(color)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              color === 'blue' && 'bg-blue-500',
              color === 'green' && 'bg-green-500',
              color === 'red' && 'bg-red-500',
              ringColor === color ? 'border-foreground scale-110' : 'border-muted'
            )}
            aria-label={`Select ${color} ring`}
          />
        ))}
      </div>
    </div>
  );
};

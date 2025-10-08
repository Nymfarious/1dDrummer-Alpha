import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Maximize2, Minimize2, X, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AIAvatarGeneratorProps {
  open: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  docked?: boolean;
  onDockToggle?: () => void;
}

export const AIAvatarGenerator = ({
  open,
  onClose,
  onSave,
  docked = false,
  onDockToggle,
}: AIAvatarGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [styleLevel, setStyleLevel] = useState([50]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 500, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current && !docked) {
      const rect = dragRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your avatar",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const styleText = styleLevel[0] < 35 ? 'cute and cartoony' : 
                       styleLevel[0] < 65 ? 'balanced artistic' : 
                       'serious and artistic';

      const fullPrompt = `Create a smooth, pixelated 3D avatar of ${prompt} in a ${styleText} style. The avatar should be circular and suitable for a profile picture.`;

      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: { prompt: fullPrompt },
      });

      if (error) throw error;

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Avatar Generated!",
          description: "Your AI avatar has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
      onSave(generatedImage);
      toast({
        title: "Avatar Saved",
        description: "Your AI-generated avatar has been set as your profile picture.",
      });
    }
  };

  if (!open) return null;

  const content = (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Avatar Generator</h3>
        </div>
        <div className="flex items-center gap-2">
          {onDockToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDockToggle}
              title={docked ? "Undock" : "Dock"}
            >
              {docked ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Avatar Description</Label>
          <Input
            id="prompt"
            placeholder="e.g., a drummer with sunglasses, a cool musician..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Style: {styleLevel[0] < 35 ? 'Cute & Cartoony' : styleLevel[0] < 65 ? 'Balanced' : 'Art & Serious'}</Label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Cute</span>
            <Slider
              value={styleLevel}
              onValueChange={setStyleLevel}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">Serious</span>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Avatar
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <img
                src={generatedImage}
                alt="Generated avatar"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <Button onClick={handleSave} className="w-full" variant="default">
              <Save className="w-4 h-4 mr-2" />
              Use This Avatar
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (docked) {
    return (
      <Card className="w-full border-border">
        {content}
      </Card>
    );
  }

  return (
    <div
      ref={dragRef}
      className="fixed z-50 bg-background border rounded-lg shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        minHeight: size.height,
      }}
    >
      <div
        className="cursor-move border-b p-2"
        onMouseDown={handleMouseDown}
      >
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
      </div>
      {content}
    </div>
  );
};
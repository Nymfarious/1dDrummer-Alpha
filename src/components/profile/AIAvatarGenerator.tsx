import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Maximize2, Minimize2, X, Save, Loader2, Mic, Send, Upload, Image as ImageIcon } from 'lucide-react';
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
  const [size, setSize] = useState({ width: 700, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Reference images state
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  
  // Preset options state
  const [gender, setGender] = useState<string>('ask');
  const [grade, setGrade] = useState<string>('3');
  const [noJacket, setNoJacket] = useState(false);
  const [kiltColor, setKiltColor] = useState<string>('green');
  const [drumColor, setDrumColor] = useState<string>('white');
  const [gripStyle, setGripStyle] = useState<string>('traditional');
  const [includePipes, setIncludePipes] = useState(false);
  const [includeBanner, setIncludeBanner] = useState(false);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data.text) {
          setPrompt(prev => prev + (prev ? ' ' : '') + data.text);
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: "Failed to transcribe audio",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).slice(0, 3 - referenceImages.length).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === Math.min(files.length, 3 - referenceImages.length)) {
          setReferenceImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const buildPromptFromPresets = () => {
    let presetPrompt = '';
    
    if (gender !== 'ask') {
      presetPrompt += `${gender} `;
    }
    
    presetPrompt += 'Scottish pipe band drummer, ';
    
    if (noJacket) {
      presetPrompt += 'wearing white short-sleeved button-down collared shirt with blue tie, ';
    } else {
      presetPrompt += 'wearing traditional band jacket, ';
    }
    
    presetPrompt += `${kiltColor} tartan kilt, `;
    presetPrompt += `carrying ${drumColor} snare drum, `;
    presetPrompt += `holding drumsticks in ${gripStyle} grip, `;
    
    if (includePipes) {
      presetPrompt += 'with bagpipes as decorative element (larger, more opaque), ';
    }
    
    if (includeBanner) {
      presetPrompt += 'with decorative banner, ';
    }
    
    presetPrompt += `Grade ${grade} quality`;
    
    return presetPrompt;
  };

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || buildPromptFromPresets();
    
    if (!finalPrompt) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description or select preset options",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const styleText = styleLevel[0] < 35 ? 'cute and cartoony' : 
                       styleLevel[0] < 65 ? 'balanced artistic' : 
                       'serious and artistic';

      const fullPrompt = `Create a smooth, pixelated 3D avatar of ${finalPrompt} in a ${styleText} style. The avatar should be circular and suitable for a profile picture.`;

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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Avatar Generator
          </h3>
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

      <div className="space-y-6">
        {/* Prompt Area with Voice Input */}
        <div className="space-y-3">
          <Label htmlFor="prompt" className="text-base font-semibold">Describe Your Avatar</Label>
          <div className="relative">
            <Textarea
              id="prompt"
              placeholder="Describe the avatar you want to create... or use the preset options below"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none pr-24 bg-gradient-to-br from-card via-card to-muted/20 border-2 focus:border-primary transition-all"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "secondary"}
                onClick={isRecording ? stopRecording : startRecording}
                className="rounded-full shadow-lg"
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="default"
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-full shadow-lg"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Reference Images Upload */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Reference Images (Optional - Up to 3)</Label>
          <div className="grid grid-cols-3 gap-3">
            {referenceImages.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50">
                <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full"
                  onClick={() => removeImage(idx)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {referenceImages.length < 3 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/50 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/40 transition-all">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Preset Options */}
        <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border">
          <h4 className="font-semibold text-sm text-primary">Preset Options (Scottish Pipe Band Drummer)</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="ask">Let AI Decide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Grade (1 is Best)</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Kilt Color</Label>
              <Select value={kiltColor} onValueChange={setKiltColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green Tartan</SelectItem>
                  <SelectItem value="blue">Blue Tartan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Drum Color</Label>
              <Select value={drumColor} onValueChange={setDrumColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="colored">Colored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Grip Style</Label>
              <Select value={gripStyle} onValueChange={setGripStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional Grip</SelectItem>
                  <SelectItem value="matched">Matched Grip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noJacket"
                checked={noJacket}
                onCheckedChange={(checked) => setNoJacket(checked as boolean)}
              />
              <label htmlFor="noJacket" className="text-sm cursor-pointer">
                No Jacket (Shirt & Tie)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pipes"
                checked={includePipes}
                onCheckedChange={(checked) => setIncludePipes(checked as boolean)}
              />
              <label htmlFor="pipes" className="text-sm cursor-pointer">
                Include Bagpipes
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="banner"
                checked={includeBanner}
                onCheckedChange={(checked) => setIncludeBanner(checked as boolean)}
              />
              <label htmlFor="banner" className="text-sm cursor-pointer">
                Include Banner
              </label>
            </div>
          </div>
        </div>

        {/* Style Slider */}
        <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border">
          <Label className="text-base font-semibold">
            Style: {styleLevel[0] < 35 ? 'Cute & Cartoony' : styleLevel[0] < 65 ? 'Balanced' : 'Art & Serious'}
          </Label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-medium">Cute</span>
            <Slider
              value={styleLevel}
              onValueChange={setStyleLevel}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground font-medium">Serious</span>
          </div>
        </div>

        {/* Generated Image Preview */}
        {generatedImage && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className="border-2 border-primary/30 rounded-lg p-4 bg-gradient-to-br from-card to-muted/20 shadow-lg">
              <img
                src={generatedImage}
                alt="Generated avatar"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <Button onClick={handleSave} className="w-full shadow-lg" size="lg" variant="default">
              <Save className="w-5 h-5 mr-2" />
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
      className="fixed z-50 bg-background border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-sm"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        minHeight: size.height,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <div
        className="cursor-move border-b border-primary/10 p-2 bg-gradient-to-r from-primary/5 to-accent/5"
        onMouseDown={handleMouseDown}
      >
        <div className="w-12 h-1.5 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
      </div>
      {content}
    </div>
  );
};
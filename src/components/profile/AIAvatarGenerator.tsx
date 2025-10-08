import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Maximize2, Minimize2, X, Save, Loader2, Mic, Send, Upload, GripVertical, RefreshCw, Shuffle } from 'lucide-react';
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
  const [position, setPosition] = useState({ x: 100, y: 50 });
  const [size, setSize] = useState({ width: 650, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDragEnabled, setIsDragEnabled] = useState(false);
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
    if (isDragging && isDragEnabled) {
      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Prevent window from going off-screen
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
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
  }, [isDragging, isDragEnabled, dragStart, size]);

  const handleDragButtonClick = () => {
    setIsDragEnabled(!isDragEnabled);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDragEnabled && !docked) {
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
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
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
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
      toast({
        title: "Transcribing...",
        description: "Processing your voice input",
      });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to process audio');
        }

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data?.text) {
          setPrompt(prev => {
            const newPrompt = prev + (prev ? ' ' : '') + data.text;
            return newPrompt;
          });
          toast({
            title: "Transcription Complete",
            description: "Your voice has been converted to text",
          });
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: "Failed to transcribe audio. Please try again.",
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
    
    // Apply style level to description
    const styleText = styleLevel[0] < 35 ? 'cute and cartoony' : 
                     styleLevel[0] < 65 ? 'balanced artistic' : 
                     'serious and photorealistic';
    
    presetPrompt += `Scottish pipe band drummer in ${styleText} style, `;
    
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

  const randomizeSettings = () => {
    setGender(['male', 'female', 'ask'][Math.floor(Math.random() * 3)]);
    setGrade(String(Math.floor(Math.random() * 5) + 1));
    setNoJacket(Math.random() > 0.5);
    setKiltColor(['green', 'blue'][Math.floor(Math.random() * 2)]);
    setDrumColor(['white', 'colored'][Math.floor(Math.random() * 2)]);
    setGripStyle(['traditional', 'matched'][Math.floor(Math.random() * 2)]);
    setIncludePipes(Math.random() > 0.5);
    setIncludeBanner(Math.random() > 0.5);
    setStyleLevel([Math.floor(Math.random() * 101)]);
    
    toast({
      title: "Settings Randomized",
      description: "Avatar preset options have been randomized",
    });
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

      // Emphasize Scottish pipe band drummer context
      const contextualPrompt = `IMPORTANT: Create a Scottish Highland pipe band drummer avatar. ${finalPrompt}`;
      const fullPrompt = `${contextualPrompt} Style: ${styleText}. The avatar should be circular, high quality, and suitable for a profile picture. Focus on accurate Scottish pipe band details including tartan, drum, and traditional uniform elements.`;

      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: { 
          prompt: fullPrompt,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined
        },
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

  const handleRefineWithPrevious = async () => {
    if (!generatedImage) {
      toast({
        title: "No Previous Image",
        description: "Generate an avatar first to refine it",
        variant: "destructive",
      });
      return;
    }

    // Add the previous generation as a reference image
    setReferenceImages(prev => {
      if (prev.includes(generatedImage)) return prev;
      return [...prev, generatedImage].slice(-3); // Keep max 3
    });

    toast({
      title: "Previous Image Added",
      description: "The previous generation has been added as a reference. Adjust your prompt and regenerate.",
    });
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
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Avatar Generator
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!docked && (
            <Button
              variant={isDragEnabled ? "default" : "ghost"}
              size="icon"
              onClick={handleDragButtonClick}
              title={isDragEnabled ? "Drag mode active - click to disable" : "Enable drag mode"}
              className="rounded-full"
            >
              <GripVertical className="w-4 h-4" />
            </Button>
          )}
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
        {/* Style Slider - Moved to top */}
        <div className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border">
          <Label className="text-sm font-semibold">
            Style: {styleLevel[0] < 35 ? 'Cute & Cartoony' : styleLevel[0] < 65 ? 'Balanced' : 'Serious & Photorealistic'}
          </Label>
          <div className="flex items-center gap-3">
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

        {/* Prompt Area with Voice Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-sm font-semibold">Describe Your Avatar</Label>
          <div className="relative">
            <Textarea
              id="prompt"
              placeholder="Describe the avatar you want to create... or use presets below"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none pr-24 bg-gradient-to-br from-card via-card to-muted/20 border-2 focus:border-primary transition-all text-sm"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "secondary"}
                onClick={isRecording ? stopRecording : startRecording}
                className="rounded-full shadow-lg h-8 w-8"
              >
                <Mic className={`w-3 h-3 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="default"
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-full shadow-lg h-8 w-8"
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Reference Images Upload - Compact */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Reference Images (Up to 3)</Label>
          <div className="grid grid-cols-4 gap-2">
            {referenceImages.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-md overflow-hidden border-2 border-primary/50">
                <img src={img} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full"
                  onClick={() => removeImage(idx)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {referenceImages.length < 3 && (
              <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/50 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-1 bg-muted/20 hover:bg-muted/40 transition-all">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Upload</span>
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

        {/* Preset Options - Compact */}
        <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-primary">Presets (Scottish Pipe Band)</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={randomizeSettings}
              className="h-7 text-xs"
            >
              <Shuffle className="w-3 h-3 mr-1" />
              Randomize
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="ask">AI Decide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-8 text-xs">
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

            <div className="space-y-1.5">
              <Label className="text-xs">Kilt</Label>
              <Select value={kiltColor} onValueChange={setKiltColor}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Drum</Label>
              <Select value={drumColor} onValueChange={setDrumColor}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="colored">Colored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Grip</Label>
              <Select value={gripStyle} onValueChange={setGripStyle}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="noJacket"
                checked={noJacket}
                onCheckedChange={(checked) => setNoJacket(checked as boolean)}
                className="h-3 w-3"
              />
              <label htmlFor="noJacket" className="text-xs cursor-pointer">
                Shirt & Tie
              </label>
            </div>

            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="pipes"
                checked={includePipes}
                onCheckedChange={(checked) => setIncludePipes(checked as boolean)}
                className="h-3 w-3"
              />
              <label htmlFor="pipes" className="text-xs cursor-pointer">
                Pipes
              </label>
            </div>

            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="banner"
                checked={includeBanner}
                onCheckedChange={(checked) => setIncludeBanner(checked as boolean)}
                className="h-3 w-3"
              />
              <label htmlFor="banner" className="text-xs cursor-pointer">
                Banner
              </label>
            </div>
          </div>
        </div>

        {/* Generated Image Preview - Compact */}
        {generatedImage && (
          <div className="space-y-2 animate-in fade-in-50">
            <div className="border-2 border-primary/30 rounded-lg p-2 bg-gradient-to-br from-card to-muted/20 shadow-lg">
              <img
                src={generatedImage}
                alt="Generated avatar"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleRefineWithPrevious} variant="outline" size="sm" className="shadow-lg text-xs h-8">
                <RefreshCw className="w-3 h-3 mr-1" />
                Refine
              </Button>
              <Button onClick={handleSave} className="shadow-lg" size="sm" variant="default">
                <Save className="w-3 h-3 mr-1" />
                Save Avatar
              </Button>
            </div>
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
        height: size.height,
        maxHeight: '85vh',
        overflowY: 'auto',
        cursor: isDragEnabled ? 'move' : 'default',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="border-b border-primary/10 p-2 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="w-12 h-1.5 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
      </div>
      {content}
    </div>
  );
};
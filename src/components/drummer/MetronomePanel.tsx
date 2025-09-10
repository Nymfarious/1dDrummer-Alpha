import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Play, Pause, Activity, Zap, Clock, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MetronomePanelProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  timeSig: string;
  setTimeSig: (timeSig: string) => void;
  metronomeSound: string;
  setMetronomeSound: (sound: string) => void;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;
}

export const MetronomePanel = ({
  bpm,
  setBpm,
  timeSig,
  setTimeSig,
  metronomeSound,
  setMetronomeSound,
  metronomeEnabled,
  metronomeVolume,
  setMetronomeVolume
}: MetronomePanelProps) => {
  const [metronomeOn, setMetronomeOn] = useState(false);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  const playMetronomeSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different sounds based on selection
    switch (metronomeSound) {
      case 'standard':
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        break;
      case 'sticks':
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.type = 'square';
        break;
      case 'high':
        oscillator.frequency.setValueAtTime(1600, ctx.currentTime);
        break;
    }

    gainNode.gain.setValueAtTime((metronomeVolume / 100) * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const startMetronome = () => {
    if (metronomeIntervalRef.current || !metronomeEnabled) return;
    
    const interval = (60 / bpm) * 1000;
    metronomeIntervalRef.current = setInterval(() => {
      playMetronomeSound();
    }, interval);
  };

  const stopMetronome = () => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
  };

  const toggleMetronome = () => {
    if (metronomeOn) {
      stopMetronome();
      setMetronomeOn(false);
      toast({
        title: "Metronome Stopped",
        description: "Click to start metronome again",
      });
    } else {
      if (!metronomeEnabled) {
        toast({
          title: "Metronome Disabled",
          description: "Enable metronome in transport controls first",
          variant: "destructive",
        });
        return;
      }
      startMetronome();
      setMetronomeOn(true);
      toast({
        title: "Metronome Started",
        description: `Playing at ${bpm} BPM in ${timeSig}`,
      });
    }
  };

  // Update metronome interval when BPM changes
  useEffect(() => {
    if (metronomeOn && metronomeEnabled) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  // Stop metronome when component unmounts
  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, []);

  const testSound = (sound: string) => {
    const originalSound = metronomeSound;
    setMetronomeSound(sound);
    
    // Temporarily set the sound and play it
    setTimeout(() => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (sound) {
        case 'standard':
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          break;
        case 'sticks':
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
          oscillator.type = 'square';
          break;
        case 'high':
          oscillator.frequency.setValueAtTime(1600, ctx.currentTime);
          break;
      }

      gainNode.gain.setValueAtTime((metronomeVolume / 100) * 0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    }, 50);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-6">Metronome</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Tempo & Time */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Clock size={20} />
              Tempo & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                min="30"
                max="220"
                className="bg-input border-border focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-sig">Time Signature</Label>
              <Select value={timeSig} onValueChange={setTimeSig}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2/4">2/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                  <SelectItem value="12/8">12/8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sound Selection */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Activity size={20} />
              Sound Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => testSound('standard')}
              variant={metronomeSound === 'standard' ? "metronome" : "audio-inactive"}
              className="w-full justify-start gap-3"
            >
              <Activity size={16} />
              Standard
            </Button>
            
            <Button
              onClick={() => testSound('sticks')}
              variant={metronomeSound === 'sticks' ? "metronome" : "audio-inactive"}
              className="w-full justify-start gap-3"
            >
              <Zap size={16} />
              Sticks
            </Button>
            
            <Button
              onClick={() => testSound('high')}
              variant={metronomeSound === 'high' ? "metronome" : "audio-inactive"}
              className="w-full justify-start gap-3"
            >
              <Clock size={16} />
              High Tone
            </Button>
          </CardContent>
        </Card>

        {/* Metronome Control */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Music size={20} />
              Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => {
                  if (!metronomeEnabled) {
                    toast({
                      title: "Metronome Disabled",
                      description: "Enable metronome in settings first",
                      variant: "destructive",
                    });
                    return;
                  }
                  startMetronome();
                  setMetronomeOn(true);
                }}
                variant={metronomeOn ? "audio-active" : "audio"}
                size="wide"
                className="flex-1"
                disabled={!metronomeEnabled || metronomeOn}
              >
                <Play size={16} />
                START
              </Button>
              
              <Button
                onClick={() => {
                  stopMetronome();
                  setMetronomeOn(false);
                }}
                variant={!metronomeOn ? "audio-inactive" : "audio-danger"}
                size="wide"
                className="flex-1"
                disabled={!metronomeOn}
              >
                <Pause size={16} />
                STOP
              </Button>
            </div>
            
            {metronomeOn && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-center">
                  <span className="font-medium text-primary">♪</span> Playing at {bpm} BPM
                </p>
              </div>
            )}
            
            {!metronomeEnabled && (
              <div className="p-3 bg-muted rounded-lg border border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Enable metronome in Settings
                </p>
              </div>
            )}
            
            {/* Volume Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Volume2 size={16} />
                Volume: {metronomeVolume}%
              </Label>
              <Slider
                value={[metronomeVolume]}
                onValueChange={(value) => setMetronomeVolume(value[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
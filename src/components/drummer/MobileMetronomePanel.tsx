import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Play, Pause, Activity, Clock, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileMetronomePanelProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  timeSig: string;
  setTimeSig: (timeSig: string) => void;
  metronomeSound: string;
  setMetronomeSound: (sound: string) => void;
  metronomeEnabled: boolean;
  metronomeVolume?: number;
  setMetronomeVolume?: (volume: number) => void;
}

export const MobileMetronomePanel = ({
  bpm,
  setBpm,
  timeSig,
  setTimeSig,
  metronomeSound,
  setMetronomeSound,
  metronomeEnabled,
  metronomeVolume = 70,
  setMetronomeVolume
}: MobileMetronomePanelProps) => {
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
    }
  };

  const testSound = (sound: string) => {
    setMetronomeSound(sound);
    setTimeout(() => playMetronomeSound(), 50);
  };

  // Update metronome when BPM changes
  useEffect(() => {
    if (metronomeOn && metronomeEnabled) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  useEffect(() => {
    return () => stopMetronome();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">Metronome</h2>
      
      {/* Main Control */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-primary mb-2">{bpm}</div>
            <div className="text-sm text-muted-foreground">BPM in {timeSig}</div>
          </div>
          
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
              size="lg"
              className="flex-1"
              disabled={!metronomeEnabled || metronomeOn}
            >
              <Play size={20} />
              START
            </Button>
            
            <Button
              onClick={() => {
                stopMetronome();
                setMetronomeOn(false);
              }}
              variant={!metronomeOn ? "audio-inactive" : "audio-danger"}
              size="lg"
              className="flex-1"
              disabled={!metronomeOn}
            >
              <Pause size={20} />
              STOP
            </Button>
          </div>
          
          {metronomeOn && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
              <span className="font-medium text-primary animate-pulse">♪</span>
              <span className="text-sm ml-2">Playing</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tempo Settings */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <Clock size={18} />
            Tempo Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bpm" className="text-sm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                min="30"
                max="220"
                className="bg-input border-border text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Time Signature</Label>
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
          </div>
          
          {/* Quick BPM buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[60, 90, 120, 140].map((quickBpm) => (
              <Button
                key={quickBpm}
                onClick={() => setBpm(quickBpm)}
                variant={bpm === quickBpm ? "audio-active" : "outline"}
                size="sm"
                className="text-xs"
              >
                {quickBpm}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sound Selection */}
      <Card className="bg-gradient-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-accent text-lg">
            <Activity size={18} />
            Sound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => testSound('standard')}
            variant={metronomeSound === 'standard' ? "metronome" : "audio-inactive"}
            className="w-full justify-start text-sm"
            size="sm"
          >
            Standard
          </Button>
          
          <Button
            onClick={() => testSound('sticks')}
            variant={metronomeSound === 'sticks' ? "metronome" : "audio-inactive"}
            className="w-full justify-start text-sm"
            size="sm"
          >
            Sticks
          </Button>
          
          <Button
            onClick={() => testSound('high')}
            variant={metronomeSound === 'high' ? "metronome" : "audio-inactive"}
            className="w-full justify-start text-sm"
            size="sm"
          >
            High Tone
          </Button>

          {/* Volume Control */}
          {setMetronomeVolume && (
            <div className="space-y-2 mt-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
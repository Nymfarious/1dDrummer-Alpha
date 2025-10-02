import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Palette, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  timeSig: string;
  setTimeSig: (timeSig: string) => void;
  metronomeSound: string;
  setMetronomeSound: (sound: string) => void;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (enabled: boolean) => void;
}

interface UserSettings {
  default_bpm: number;
  default_time_signature: string;
  color_theme: string;
  metronome_sound: string;
  metronome_volume: number;
}

export const SettingsPanel = ({
  bpm,
  setBpm,
  timeSig,
  setTimeSig,
  metronomeSound,
  setMetronomeSound,
  metronomeVolume,
  setMetronomeVolume,
  metronomeEnabled,
  setMetronomeEnabled
}: SettingsPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<UserSettings>({
    default_bpm: 92,
    default_time_signature: '4/4',
    color_theme: 'teal',
    metronome_sound: 'standard',
    metronome_volume: 70
  });
  
  const [loading, setLoading] = useState(false);

  // Load user settings
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings({
          default_bpm: data.default_bpm,
          default_time_signature: data.default_time_signature,
          color_theme: data.color_theme,
          metronome_sound: data.metronome_sound,
          metronome_volume: data.metronome_volume
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings
        });

      if (error) {
        toast({
          title: "Save Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been saved successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyDefaults = () => {
    setBpm(settings.default_bpm);
    setTimeSig(settings.default_time_signature);
    setMetronomeSound(settings.metronome_sound);
    setMetronomeVolume(settings.metronome_volume);
    
    toast({
      title: "Defaults Applied",
      description: "Current session updated with your default settings",
    });
  };

  const colorThemes = [
    { id: 'teal', name: 'Teal Ocean', color: '#14b8a6' },
    { id: 'turquoise', name: 'Turquoise Sky', color: '#06b6d4' },
    { id: 'periwinkle', name: 'Periwinkle Dream', color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-6">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Palette size={20} />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-1 gap-3">
                {colorThemes.map((theme) => (
                  <Button
                    key={theme.id}
                    onClick={() => setSettings(prev => ({ ...prev, color_theme: theme.id }))}
                    variant={settings.color_theme === theme.id ? "audio-active" : "audio-inactive"}
                    className="w-full justify-start gap-3"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: theme.color }}
                    />
                    {theme.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Settings size={20} />
              Default Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-bpm">Default BPM</Label>
              <Input
                id="default-bpm"
                type="number"
                value={settings.default_bpm}
                onChange={(e) => setSettings(prev => ({ ...prev, default_bpm: Number(e.target.value) }))}
                min="30"
                max="220"
                className="bg-input border-border focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Default Time Signature</Label>
              <Select 
                value={settings.default_time_signature} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, default_time_signature: value }))}
              >
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

            <div className="space-y-2">
              <Label>Default Metronome Sound</Label>
              <Select 
                value={settings.metronome_sound} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, metronome_sound: value }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="sticks">Sticks</SelectItem>
                  <SelectItem value="high">High Tone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-volume">Default Volume</Label>
              <Input
                id="default-volume"
                type="number"
                value={settings.metronome_volume}
                onChange={(e) => setSettings(prev => ({ ...prev, metronome_volume: Number(e.target.value) }))}
                min="0"
                max="100"
                className="bg-input border-border focus:border-primary"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="metronome-enabled"
                checked={metronomeEnabled}
                onCheckedChange={setMetronomeEnabled}
              />
              <Label htmlFor="metronome-enabled" className="text-sm cursor-pointer">
                Enable Metronome
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={saveSettings}
          variant="audio"
          size="wide"
          disabled={loading}
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
        
        <Button
          onClick={applyDefaults}
          variant="secondary"
          size="wide"
        >
          <RotateCcw size={20} />
          Apply to Current Session
        </Button>
      </div>
    </div>
  );
};
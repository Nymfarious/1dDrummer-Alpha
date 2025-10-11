import { useState } from 'react';
import { MoreVertical, Key, Settings, Zap, Brain, Plus, Minus, X, TestTube, Beaker, Eye, EyeOff, Check } from 'lucide-react';
import { useDevSettings } from '@/contexts/DevSettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { TestLabDialog } from '@/components/TestLabDialog';
import { BugTracker } from '@/components/BugTracker';

interface DevToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExpandIcon = 'chevron' | 'plusminus' | 'dots';

interface APIKeyStatus {
  name: string;
  env: string;
  isSet: boolean;
  category: 'api' | 'feature' | 'mcp';
}

export const DevTools = ({ isOpen, onClose }: DevToolsProps) => {
  const { toast } = useToast();
  const [expandIcon, setExpandIcon] = useState<ExpandIcon>('dots');
  const [testLabOpen, setTestLabOpen] = useState(false);
  const [bugTrackerOpen, setBugTrackerOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    devPrefs: false,
    apis: false,
    features: false,
    mcps: false,
    ai: false,
    devOverrides: false,
  });

  const { settings, updateSettings } = useDevSettings();

  // AI Helper
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  // API Keys tracking - synced with Supabase secrets
  const apiKeys: APIKeyStatus[] = [
    // Core Supabase
    { name: 'Supabase URL', env: 'SUPABASE_URL', isSet: true, category: 'api' },
    { name: 'Supabase Public Key', env: 'SUPABASE_PUBLISHABLE_KEY', isSet: true, category: 'api' },
    { name: 'Supabase Service Role', env: 'SUPABASE_SERVICE_ROLE_KEY', isSet: true, category: 'api' },
    { name: 'Supabase DB URL', env: 'SUPABASE_DB_URL', isSet: true, category: 'api' },
    
    // AI & ML Services
    { name: 'Lovable AI Key', env: 'LOVABLE_API_KEY', isSet: true, category: 'api' },
    { name: 'Google AI', env: 'Google AI', isSet: true, category: 'api' },
    { name: 'Open AI Weather', env: 'Open AI Weather', isSet: true, category: 'api' },
    { name: 'HF Token - Fine Tune', env: 'HF Token - Fine Tune', isSet: true, category: 'api' },
    { name: 'HF Token - Write', env: 'HF Token - Write', isSet: true, category: 'api' },
    { name: 'Replicate API', env: 'Replicate API Token', isSet: true, category: 'api' },
    
    // Integrations
    { name: 'Dropbox Dev Token', env: 'DROPBOX_DEV_TOKEN', isSet: true, category: 'feature' },
    { name: 'Google Maps Platform', env: 'Google Maps Platform API', isSet: true, category: 'feature' },
    
    // Document Services
    { name: 'Tiny Docs MCE HTML', env: 'Tiny Docs / MCE HTML', isSet: true, category: 'feature' },
    { name: 'Tiny Doc MCP React', env: 'Tiny Doc / MCP React', isSet: true, category: 'feature' },
    
    // MCPs & Custom Integrations
    { name: 'Drum Practice Coach', env: 'Drum Practice Coach', isSet: true, category: 'mcp' },
    { name: 'Jitsi Video Integration', env: 'N/A', isSet: true, category: 'mcp' },
    { name: 'Audio Recording', env: 'N/A', isSet: true, category: 'mcp' },
  ];

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderExpandIcon = (isOpen: boolean) => {
    if (expandIcon === 'chevron') {
      return <MoreVertical className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />;
    }
    if (expandIcon === 'dots') {
      return (
        <div className="bg-background/80 rounded p-0.5">
          <MoreVertical className={`h-4 w-4 text-foreground icon-hollow-glow transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      );
    }
    return isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />;
  };

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;
    
    // Simulated AI response - you can wire this to Lovable AI later
    setAiResponse('AI Helper is ready to assist with dDrummer development. Wire me up to Lovable AI to get real responses!');
    toast({
      title: "AI Helper",
      description: "Response generated (demo mode)",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-screen w-80 bg-card/95 backdrop-blur-lg border-r border-border shadow-2xl z-50 transition-transform duration-700 ease-out" style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateSettings({ masterVisibility: !settings.masterVisibility })}
            title={settings.masterVisibility ? "Hide all dev elements" : "Show all dev elements"}
          >
            {settings.masterVisibility ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            d'DevTools
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-3 space-y-2">
          {/* Dev Preferences Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('devPrefs')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.devPrefs)}
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Dev Preferences</span>
              </div>
            </button>
            
            {openSections.devPrefs && (
              <div className="ml-6 space-y-2 p-2 border-l-2 border-primary/20">
                {/* Test Lab Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestLabOpen(true)}
                  className="w-full justify-start gap-2"
                >
                  <Beaker className="h-4 w-4" />
                  Open Test Lab
                </Button>

                {/* Bug Tracker Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBugTrackerOpen(true)}
                  className="w-full justify-start gap-2"
                >
                  <span className="text-lg">🪱</span>
                  Bug Tracker
                </Button>

                <Separator />

                {/* Master Visibility Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Master Visibility</Label>
                    <Switch
                      checked={settings.masterVisibility}
                      onCheckedChange={(checked) => updateSettings({ masterVisibility: checked })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hide all dev elements (butterfly, LEDs, indicators)
                  </p>
                </div>

                <Separator />

                {/* Expand Icon Selector */}
                <div className="space-y-2">
                  <Label className="text-xs">Expand Icon Style</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={expandIcon === 'dots' ? 'default' : 'outline'}
                      onClick={() => setExpandIcon('dots')}
                      className="h-7 px-2 flex-1"
                      title="Dots Expand ⋯"
                    >
                      <MoreVertical className="h-3 w-3 icon-hollow-glow" />
                    </Button>
                    <Button
                      size="sm"
                      variant={expandIcon === 'plusminus' ? 'default' : 'outline'}
                      onClick={() => setExpandIcon('plusminus')}
                      className="h-7 px-2 flex-1"
                      title="Plus/Minus"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* APIs Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('apis')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.apis)}
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">API Keys</span>
              </div>
            </button>
            
            {openSections.apis && (
              <div className="ml-6 space-y-2 p-2 border-l-2 border-primary/20">
                {apiKeys.filter(k => k.category === 'api').map((key) => (
                  <div key={key.env} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{key.name}</span>
                    {key.isSet ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Button size="sm" className="h-6 px-2 bg-muted text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        ADD
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Features Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('features')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.features)}
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Features</span>
              </div>
            </button>
            
            {openSections.features && (
              <div className="ml-6 space-y-2 p-2 border-l-2 border-primary/20">
                {apiKeys.filter(k => k.category === 'feature').map((key) => (
                  <div key={key.env} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{key.name}</span>
                    <Switch
                      checked={key.isSet}
                      disabled={!key.isSet}
                      className="scale-75"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* MCPs Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('mcps')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.mcps)}
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">MCPs</span>
              </div>
            </button>
            
            {openSections.mcps && (
              <div className="ml-6 space-y-2 p-2 border-l-2 border-primary/20">
                {apiKeys.filter(k => k.category === 'mcp').map((key) => (
                  <div key={key.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{key.name}</span>
                    {key.isSet ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Button size="sm" className="h-6 px-2 bg-muted text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        ADD
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Dev Overrides Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('devOverrides')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.devOverrides)}
                <TestTube className="h-4 w-4" />
                <span className="text-sm font-medium">Dev Overrides</span>
              </div>
            </button>
            
            {openSections.devOverrides && (
              <div className="ml-6 space-y-3 p-2 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="guest-audio" className="text-xs">Guest Audio Upload</Label>
                    <Switch
                      id="guest-audio"
                      checked={settings.guestAudioUploadOverride}
                      onCheckedChange={(checked) => updateSettings({ guestAudioUploadOverride: checked })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allow guests to upload audio files for testing without authentication
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="block-signups" className="text-xs">Block Signups</Label>
                    <Switch
                      id="block-signups"
                      checked={settings.blockSignups ?? true}
                      onCheckedChange={(checked) => updateSettings({ blockSignups: checked })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prevent new users from creating accounts
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* AI Helper Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('ai')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.ai)}
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">AI Helper</span>
              </div>
            </button>
            
            {openSections.ai && (
              <div className="ml-6 space-y-2 p-2 border-l-2 border-primary/20">
                <p className="text-xs text-muted-foreground">
                  Ask questions about dDrummer development
                </p>
                <Input
                  placeholder="Ask me anything..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
                />
                <Button size="sm" onClick={handleAISubmit} className="w-full">
                  Get Answer
                </Button>
                {aiResponse && (
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    {aiResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Test Lab Dialog */}
      <TestLabDialog open={testLabOpen} onOpenChange={setTestLabOpen} />
      
      {/* Bug Tracker Dialog */}
      <BugTracker open={bugTrackerOpen} onOpenChange={setBugTrackerOpen} />
    </div>
  );
};

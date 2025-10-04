import { useState } from 'react';
import { ChevronRight, Key, Settings, Zap, Brain, Plus, Minus, X, TestTube, Beaker } from 'lucide-react';
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

interface DevToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExpandIcon = 'chevron' | 'plusminus';

interface APIKeyStatus {
  name: string;
  env: string;
  isSet: boolean;
  category: 'api' | 'feature' | 'mcp';
}

export const DevTools = ({ isOpen, onClose }: DevToolsProps) => {
  const { toast } = useToast();
  const [expandIcon, setExpandIcon] = useState<ExpandIcon>('chevron');
  const [testLabOpen, setTestLabOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    devPrefs: true,
    captcha: false,
    apis: true,
    features: false,
    mcps: false,
    ai: false,
    devOverrides: false,
  });

  const { settings, updateSettings } = useDevSettings();

  // Captcha settings
  const [hCaptchaEnabled, setHCaptchaEnabled] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);

  // AI Helper
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  // API Keys tracking
  const apiKeys: APIKeyStatus[] = [
    { name: 'Supabase URL', env: 'VITE_SUPABASE_URL', isSet: !!import.meta.env.VITE_SUPABASE_URL, category: 'api' },
    { name: 'Supabase Anon Key', env: 'VITE_SUPABASE_PUBLISHABLE_KEY', isSet: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, category: 'api' },
    { name: 'Lovable AI Key', env: 'LOVABLE_API_KEY', isSet: true, category: 'api' }, // Server-side
    { name: 'hCaptcha Site Key', env: 'VITE_HCAPTCHA_SITE_KEY', isSet: false, category: 'feature' },
    { name: 'Turnstile Site Key', env: 'VITE_TURNSTILE_SITE_KEY', isSet: false, category: 'feature' },
    { name: 'Jitsi Integration', env: 'N/A', isSet: true, category: 'mcp' },
    { name: 'Audio Recording', env: 'N/A', isSet: true, category: 'mcp' },
  ];

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderExpandIcon = (isOpen: boolean) => {
    if (expandIcon === 'chevron') {
      return <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />;
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
    <div className="fixed left-0 top-0 h-screen w-80 bg-card/95 backdrop-blur-lg border-r border-border shadow-2xl z-50 animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          d'DevTools
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="p-4 space-y-4">
          {/* Dev Preferences Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('devPrefs')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.devPrefs)}
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Dev Preferences</span>
              </div>
            </button>
            
            {openSections.devPrefs && (
              <div className="ml-6 space-y-3 p-3 border-l-2 border-primary/20">
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

                <Separator />

                {/* Expand Icon Selector */}
                <div className="space-y-2">
                  <Label className="text-xs">Expand Icon Style</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={expandIcon === 'chevron' ? 'default' : 'outline'}
                      onClick={() => setExpandIcon('chevron')}
                      className="h-7 px-2 flex-1"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={expandIcon === 'plusminus' ? 'default' : 'outline'}
                      onClick={() => setExpandIcon('plusminus')}
                      className="h-7 px-2 flex-1"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Captcha Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('captcha')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.captcha)}
                <span className="text-sm font-medium">Captcha Settings</span>
              </div>
            </button>
            
            {openSections.captcha && (
              <div className="ml-6 space-y-3 p-3 border-l-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hcaptcha" className="text-xs">hCaptcha</Label>
                  <Switch
                    id="hcaptcha"
                    checked={hCaptchaEnabled}
                    onCheckedChange={setHCaptchaEnabled}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="turnstile" className="text-xs">Cloudflare Turnstile</Label>
                  <Switch
                    id="turnstile"
                    checked={turnstileEnabled}
                    onCheckedChange={setTurnstileEnabled}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* APIs Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('apis')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.apis)}
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">API Keys</span>
              </div>
            </button>
            
            {openSections.apis && (
              <div className="ml-6 space-y-2 p-3 border-l-2 border-primary/20">
                {apiKeys.filter(k => k.category === 'api').map((key) => (
                  <div key={key.env} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{key.name}</span>
                    {key.isSet ? (
                      <span className="status-active text-xs px-2 py-0.5 rounded">SET</span>
                    ) : (
                      <Button size="sm" className="h-6 px-2 status-error animate-pulse">
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
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.features)}
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Features</span>
              </div>
            </button>
            
            {openSections.features && (
              <div className="ml-6 space-y-2 p-3 border-l-2 border-primary/20">
                {apiKeys.filter(k => k.category === 'feature').map((key) => (
                  <div key={key.env} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{key.name}</span>
                    {key.isSet ? (
                      <span className="status-active text-xs px-2 py-0.5 rounded">SET</span>
                    ) : (
                      <Button size="sm" className="h-6 px-2 status-error animate-pulse">
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

          {/* MCPs Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('mcps')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.mcps)}
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">MCPs</span>
              </div>
            </button>
            
            {openSections.mcps && (
              <div className="ml-6 space-y-2 p-3 border-l-2 border-primary/20">
                {apiKeys.filter(k => k.category === 'mcp').map((key) => (
                  <div key={key.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{key.name}</span>
                    {key.isSet ? (
                      <span className="status-active text-xs px-2 py-0.5 rounded">READY</span>
                    ) : (
                      <Button size="sm" className="h-6 px-2 status-error animate-pulse">
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
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.devOverrides)}
                <TestTube className="h-4 w-4" />
                <span className="text-sm font-medium">Dev Overrides</span>
              </div>
            </button>
            
            {openSections.devOverrides && (
              <div className="ml-6 space-y-3 p-3 border-l-2 border-primary/20">
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
            )}
          </div>

          <Separator />

          {/* AI Helper Section */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('ai')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {renderExpandIcon(openSections.ai)}
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">AI Helper</span>
              </div>
            </button>
            
            {openSections.ai && (
              <div className="ml-6 space-y-3 p-3 border-l-2 border-primary/20">
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
    </div>
  );
};

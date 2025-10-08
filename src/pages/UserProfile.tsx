import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, Pencil, Save } from 'lucide-react';
import bearAvatar from '@/assets/bear-avatar.png';
import { AvatarEditorDialog } from '@/components/profile/AvatarEditorDialog';
import { AIAvatarGenerator } from '@/components/profile/AIAvatarGenerator';
import { LocationMap } from '@/components/profile/LocationMap';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(bearAvatar);
  const [links, setLinks] = useState({
    facebook: '',
    x: '',
    sharedDrive: '',
    linkedin: ''
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [aiGeneratorOpen, setAIGeneratorOpen] = useState(false);
  const [aiGeneratorDocked, setAIGeneratorDocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setName(data.full_name || '');
        setCity(data.location?.split(', ')[0] || '');
        setState(data.location?.split(', ')[1] || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || bearAvatar);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const location = city && state ? `${city}, ${state}` : city || '';
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: name,
          location: location,
          bio: bio,
          avatar_url: avatarUrl,
        });

      if (error) {
        toast({
          title: "Save Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Saved",
          description: "Your profile has been updated successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChange = (platform: keyof typeof links, value: string) => {
    setLinks(prev => ({ ...prev, [platform]: value }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-foreground">User Profile</h1>

      {/* Avatar Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="relative flex flex-col items-center p-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-elegant">
              <img 
                src={avatarUrl} 
                alt="User Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full shadow-lg"
              onClick={() => setEditorOpen(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Profile Information</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Buddy Rich"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Nashville"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., Tennessee"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., Drummer and music enthusiast"
            />
          </div>

          <Button onClick={saveProfile} disabled={loading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>

      {/* Location Map */}
      {(city || state) && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Location</h3>
          <LocationMap city={city} state={state} />
        </Card>
      )}

      {/* Check it Out Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-2">Check it Out</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Share your social links (pending admin approval)
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <div className="flex gap-2">
              <Input
                id="facebook"
                value={links.facebook}
                onChange={(e) => handleLinkChange('facebook', e.target.value)}
                placeholder="https://facebook.com/yourprofile"
              />
              {links.facebook && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(links.facebook, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="x">X (Twitter)</Label>
            <div className="flex gap-2">
              <Input
                id="x"
                value={links.x}
                onChange={(e) => handleLinkChange('x', e.target.value)}
                placeholder="https://x.com/yourhandle"
              />
              {links.x && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(links.x, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="sharedDrive">Shared Drive</Label>
            <div className="flex gap-2">
              <Input
                id="sharedDrive"
                value={links.sharedDrive}
                onChange={(e) => handleLinkChange('sharedDrive', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              {links.sharedDrive && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(links.sharedDrive, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <div className="flex gap-2">
              <Input
                id="linkedin"
                value={links.linkedin}
                onChange={(e) => handleLinkChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {links.linkedin && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(links.linkedin, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Avatar Generator - Docked */}
      {aiGeneratorDocked && (
        <AIAvatarGenerator
          open={aiGeneratorOpen}
          onClose={() => setAIGeneratorOpen(false)}
          onSave={(url) => {
            setAvatarUrl(url);
            setAIGeneratorOpen(false);
          }}
          docked={true}
          onDockToggle={() => setAIGeneratorDocked(false)}
        />
      )}

      {/* Dialogs */}
      <AvatarEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onAvatarSelected={(url) => setAvatarUrl(url)}
        onOpenAIGenerator={() => {
          setEditorOpen(false);
          setAIGeneratorOpen(true);
          setAIGeneratorDocked(false);
        }}
      />

      {/* AI Avatar Generator - Floating */}
      {!aiGeneratorDocked && (
        <AIAvatarGenerator
          open={aiGeneratorOpen}
          onClose={() => setAIGeneratorOpen(false)}
          onSave={(url) => {
            setAvatarUrl(url);
            setAIGeneratorOpen(false);
          }}
          docked={false}
          onDockToggle={() => setAIGeneratorDocked(true)}
        />
      )}
    </div>
  );
};

export default UserProfile;

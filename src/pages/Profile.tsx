import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LocationMap } from '@/components/profile/LocationMap';
import { useProfileExport } from '@/hooks/useProfileExport';
import { toast } from 'sonner';
import { Download, Plus, X } from 'lucide-react';

interface BraggingLink {
  url: string;
  approved: boolean;
}

const Profile = () => {
  const { user } = useAuth();
  const { exportProfile, isExporting } = useProfileExport();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    bio: '',
    city: '',
    group_skill_level: 1,
    solo_skill_level: 1,
    bragging_links: [] as BraggingLink[],
    notification_settings: {
      new_users: true,
      direct_messages: true,
      emails: true,
    },
    default_metronome_sound: 'standard',
  });

  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          city: data.city || '',
          group_skill_level: data.group_skill_level || 1,
          solo_skill_level: data.solo_skill_level || 1,
          bragging_links: (data.bragging_links as any as BraggingLink[]) || [],
          notification_settings: (data.notification_settings as {
            new_users: boolean;
            direct_messages: boolean;
            emails: boolean;
          }) || {
            new_users: true,
            direct_messages: true,
            emails: true,
          },
          default_metronome_sound: data.default_metronome_sound || 'standard',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const addBraggingLink = () => {
    if (!newLink.trim()) return;
    
    setProfile({
      ...profile,
      bragging_links: [
        ...profile.bragging_links,
        { url: newLink, approved: false },
      ],
    });
    setNewLink('');
    toast.info('Link added - pending approval');
  };

  const removeBraggingLink = (index: number) => {
    setProfile({
      ...profile,
      bragging_links: profile.bragging_links.filter((_, i) => i !== index),
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio.substring(0, 500),
          city: profile.city,
          group_skill_level: profile.group_skill_level,
          solo_skill_level: profile.solo_skill_level,
          bragging_links: profile.bragging_links as any,
          notification_settings: profile.notification_settings as any,
          default_metronome_sound: profile.default_metronome_sound,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile saved!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button onClick={exportProfile} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          Export Profile
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          <div>
            <Label htmlFor="metronome">Default Metronome Sound</Label>
            <Select
              value={profile.default_metronome_sound}
              onValueChange={(value) => setProfile({ ...profile, default_metronome_sound: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="woodblock">Woodblock</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio ({profile.bio.length}/500)</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value.substring(0, 500) })}
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Group Skill Level (1-5)</Label>
            <Select
              value={profile.group_skill_level.toString()}
              onValueChange={(value) => setProfile({ ...profile, group_skill_level: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Solo Skill Level (1-5)</Label>
            <Select
              value={profile.solo_skill_level.toString()}
              onValueChange={(value) => setProfile({ ...profile, solo_skill_level: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Level {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {profile.city && (
          <div>
            <Label>Your Location</Label>
            <LocationMap city={profile.city} />
          </div>
        )}

        <div>
          <Label>Bragging Rights (SoundCloud, Drive Links, etc.)</Label>
          <div className="space-y-2">
            {profile.bragging_links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={link.url} readOnly className="flex-1" />
                <span className={`text-xs px-2 py-1 rounded ${link.approved ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {link.approved ? 'Approved' : 'Pending'}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeBraggingLink(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Add a link..."
                onKeyPress={(e) => e.key === 'Enter' && addBraggingLink()}
              />
              <Button onClick={addBraggingLink}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Notification Settings</Label>
          <div className="flex items-center justify-between">
            <span className="text-sm">New users join app</span>
            <Switch
              checked={profile.notification_settings.new_users}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  notification_settings: { ...profile.notification_settings, new_users: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Direct messages</span>
            <Switch
              checked={profile.notification_settings.direct_messages}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  notification_settings: { ...profile.notification_settings, direct_messages: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Email notifications</span>
            <Switch
              checked={profile.notification_settings.emails}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  notification_settings: { ...profile.notification_settings, emails: checked },
                })
              }
            />
          </div>
        </div>

        <Button onClick={saveProfile} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </Card>
    </div>
  );
};

export default Profile;

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Profile2 = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [grade, setGrade] = useState<number>(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, city, solo_skill_level, avatar_url')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setCity(data.city || '');
        setGrade(data.solo_skill_level || 1);
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let uploadedAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('audio-files')
          .upload(`avatars/${fileName}`, avatarFile, { upsert: true });

        if (uploadError) {
          toast.error('Failed to upload avatar');
          console.error('Upload error:', uploadError);
          setSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('audio-files')
          .getPublicUrl(`avatars/${fileName}`);
        
        uploadedAvatarUrl = publicUrl;
      }

      // Save profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          city: city,
          solo_skill_level: grade,
          avatar_url: uploadedAvatarUrl,
          updated_at: new Date().toISOString()
        });

      if (error) {
        toast.error('Failed to save profile');
        console.error('Save error:', error);
      } else {
        toast.success('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile 2 - Simple Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
            />
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <Label htmlFor="grade">Grade (1-5)</Label>
            <Input
              id="grade"
              type="number"
              min="1"
              max="5"
              value={grade}
              onChange={(e) => setGrade(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label htmlFor="avatar">Upload Picture</Label>
            {avatarUrl && (
              <div className="mb-4">
                <img 
                  src={avatarUrl} 
                  alt="Avatar preview" 
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
            )}
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile2;

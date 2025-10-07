import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink } from 'lucide-react';
import bearAvatar from '@/assets/bear-avatar.png';

const UserProfile = () => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [links, setLinks] = useState({
    facebook: '',
    x: '',
    sharedDrive: '',
    linkedin: ''
  });

  const handleLinkChange = (platform: keyof typeof links, value: string) => {
    setLinks(prev => ({ ...prev, [platform]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Avatar */}
      <Card className="relative overflow-hidden" style={{ height: '384px' }}>
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="relative h-full flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-elegant mb-4">
            <img 
              src={bearAvatar} 
              alt="Bear Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">User Profile</h2>
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
              placeholder="Enter your name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state"
              />
            </div>
          </div>

          <Button variant="outline" disabled className="w-full">
            <MapPin className="mr-2 h-4 w-4" />
            X Marks the Spot
          </Button>
        </div>
      </Card>

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
    </div>
  );
};

export default UserProfile;

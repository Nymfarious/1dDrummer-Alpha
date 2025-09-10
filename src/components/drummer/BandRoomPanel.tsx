import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Video, MessageCircle, Calendar } from 'lucide-react';

export const BandRoomPanel = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-6">Band Room</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Create/Join Room */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Users size={20} />
              Room Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <Plus size={20} />
              Create Room
            </Button>
            
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <Users size={20} />
              Join Room
            </Button>
          </CardContent>
        </Card>

        {/* Video Chat */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Video size={20} />
              Video Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <Video size={20} />
              Start Video
            </Button>
            
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <MessageCircle size={20} />
              Text Chat
            </Button>
          </CardContent>
        </Card>

        {/* Session Scheduling */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Calendar size={20} />
              Schedule Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <Calendar size={20} />
              Book Session
            </Button>
            
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <Users size={20} />
              Find Musicians
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="bg-gradient-secondary border-accent/20 card-shadow">
        <CardContent className="p-6 text-center">
          <Users size={48} className="mx-auto mb-4 text-accent" />
          <h3 className="text-xl font-bold text-accent-foreground mb-2">
            Band Room Features Coming Soon!
          </h3>
          <p className="text-muted-foreground">
            Connect with other drummers, schedule practice sessions, and collaborate in real-time.
            These features are currently in development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
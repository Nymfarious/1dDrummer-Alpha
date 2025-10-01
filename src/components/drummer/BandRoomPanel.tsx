import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Video, ArrowLeft } from 'lucide-react';
import { JitsiMeet } from '@/components/bandroom/JitsiMeet';
import { RoomList } from '@/components/bandroom/RoomList';
import { ParticipantControls } from '@/components/bandroom/ParticipantControls';
import { DirectMessaging } from '@/components/bandroom/DirectMessaging';
import { CreateRoomDialog } from '@/components/bandroom/CreateRoomDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Room {
  id: string;
  name: string;
  participantCount: number;
  isParent: boolean;
  parentId?: string;
}

export const BandRoomPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([
    { id: 'band-hall', name: 'Band Hall', participantCount: 0, isParent: true }
  ]);
  const [participants, setParticipants] = useState<string[]>([]);

  const handleCreateRoom = (roomName: string, isBreakout: boolean) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: roomName,
      participantCount: 0,
      isParent: !isBreakout,
      parentId: isBreakout ? 'band-hall' : undefined
    };

    setRooms(prev => [...prev, newRoom]);
    toast({
      title: "Room created",
      description: `${roomName} is ready for participants`,
    });
  };

  const handleRoomSelect = (roomId: string) => {
    setCurrentRoom(roomId);
    toast({
      title: "Joining room",
      description: rooms.find(r => r.id === roomId)?.name,
    });
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setShowMessaging(false);
  };

  const handleParticipantJoined = (participant: any) => {
    if (participant.displayName && !participants.includes(participant.displayName)) {
      setParticipants(prev => [...prev, participant.displayName]);
    }
  };

  const handleParticipantLeft = (participant: any) => {
    if (participant.displayName) {
      setParticipants(prev => prev.filter(p => p !== participant.displayName));
    }
  };

  const handleHandRaise = () => {
    toast({
      title: "Hand raised",
      description: "Other participants have been notified",
    });
  };

  // If in a room, show the video interface
  if (currentRoom) {
    const room = rooms.find(r => r.id === currentRoom);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveRoom}
            >
              <ArrowLeft size={16} className="mr-2" />
              Leave Room
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{room?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
              </p>
            </div>
          </div>
          <Button
            variant={showMessaging ? "audio-active" : "audio-inactive"}
            onClick={() => setShowMessaging(!showMessaging)}
          >
            <Video size={18} className="mr-2" />
            {showMessaging ? 'Show Video' : 'Show Messages'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-4">
            {!showMessaging ? (
              <Card className="bg-gradient-card border-border card-shadow">
                <CardContent className="p-4">
                  <JitsiMeet
                    roomName={currentRoom}
                    displayName={user?.email?.split('@')[0] || 'Participant'}
                    onParticipantJoined={handleParticipantJoined}
                    onParticipantLeft={handleParticipantLeft}
                  />
                </CardContent>
              </Card>
            ) : (
              <DirectMessaging
                currentRoomId={currentRoom}
                participants={participants}
                onClose={() => setShowMessaging(false)}
              />
            )}

            {/* Participant Controls */}
            <ParticipantControls
              onHandRaise={handleHandRaise}
              onMessageOpen={() => setShowMessaging(true)}
            />
          </div>

          {/* Room List Sidebar */}
          <div className="lg:col-span-1">
            <RoomList
              rooms={rooms}
              currentRoomId={currentRoom}
              onRoomSelect={handleRoomSelect}
            />
          </div>
        </div>
      </div>
    );
  }

  // Lobby view - show available rooms
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Band Room</h2>
        <p className="text-muted-foreground">
          Connect with other drummers and practice together in real-time
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Room */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Users size={20} />
              Room Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateRoomDialog onCreateRoom={handleCreateRoom} />
            
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <h4 className="font-semibold mb-2 text-sm">About Rooms</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Band Hall is the main gathering space</li>
                <li>• Create breakout rooms for focused practice</li>
                <li>• Move freely between rooms anytime</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Room List */}
        <RoomList
          rooms={rooms}
          currentRoomId={currentRoom}
          onRoomSelect={handleRoomSelect}
        />
      </div>

      {/* Features Info */}
      <Card className="bg-gradient-secondary border-accent/20 card-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Video size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-accent-foreground mb-2">
                Powered by Jitsi
              </h3>
              <p className="text-muted-foreground mb-4">
                High-quality video chat with mute, push-to-talk, hand raise, and direct messaging between participants across all rooms.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full">Video & Audio</span>
                <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full">Push to Talk</span>
                <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full">Hand Raise</span>
                <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full">Direct Messages</span>
                <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full">Breakout Rooms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
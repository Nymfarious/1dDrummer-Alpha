import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Video, ArrowLeft, UsersRound, Pin, PinOff } from 'lucide-react';
import { JitsiMeet } from '@/components/bandroom/JitsiMeet';
import { RoomList } from '@/components/bandroom/RoomList';
import { ParticipantControls } from '@/components/bandroom/ParticipantControls';
import { DirectMessaging } from '@/components/bandroom/DirectMessaging';
import { CreateRoomDialog } from '@/components/bandroom/CreateRoomDialog';
import { ParticipantNameDialog } from '@/components/bandroom/ParticipantNameDialog';
import { LobbyChat } from '@/components/bandroom/LobbyChat';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Room {
  id: string;
  name: string;
  participantCount: number;
  participants: string[];
  isParent: boolean;
  parentId?: string;
  isFavorite?: boolean;
  lastVisited?: Date;
}

export const BandRoomPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showRoomsList, setShowRoomsList] = useState(false);
  const [isPanelPinned, setIsPanelPinned] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([
    { id: 'band-hall', name: 'Band Hall', participantCount: 0, participants: [], isParent: true, isFavorite: false }
  ]);
  const [participants, setParticipants] = useState<string[]>([]);

  const handleCreateRoom = (roomName: string, isBreakout: boolean) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: roomName,
      participantCount: 0,
      participants: [],
      isParent: !isBreakout,
      parentId: isBreakout ? 'band-hall' : undefined,
      isFavorite: false
    };

    setRooms(prev => [...prev, newRoom]);
    
    const roomType = isBreakout ? 'Breakout room' : 'Main room';
    toast({
      title: "✓ Room created successfully",
      description: `${roomType} "${roomName}" is ready! ${isBreakout ? 'This room is connected to Band Hall.' : ''}`,
    });
  };

  const handleRoomSelect = (roomId: string) => {
    // Show name dialog if display name not set
    if (!displayName) {
      setPendingRoomId(roomId);
      setShowNameDialog(true);
      return;
    }
    
    joinRoom(roomId);
  };

  const joinRoom = (roomId: string) => {
    // Update last visited timestamp
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, lastVisited: new Date() }
        : room
    ));
    
    setCurrentRoom(roomId);
    if (!isPanelPinned) {
      setShowRoomsList(false);
    }
    toast({
      title: "Joining room",
      description: rooms.find(r => r.id === roomId)?.name,
    });
  };

  const handleNameConfirm = (name: string) => {
    setDisplayName(name);
    setShowNameDialog(false);
    if (pendingRoomId) {
      joinRoom(pendingRoomId);
      setPendingRoomId(null);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setShowMessaging(false);
  };

  const handleToggleFavorite = (roomId: string) => {
    setRooms(prev => prev.map(room =>
      room.id === roomId
        ? { ...room, isFavorite: !room.isFavorite }
        : room
    ));
  };

  const handleParticipantJoined = (participant: any) => {
    if (participant.displayName && !participants.includes(participant.displayName)) {
      const newParticipants = [...participants, participant.displayName];
      setParticipants(newParticipants);
      
      // Update room participant list
      if (currentRoom) {
        setRooms(prev => prev.map(room =>
          room.id === currentRoom
            ? { ...room, participantCount: newParticipants.length, participants: newParticipants }
            : room
        ));
      }
    }
  };

  const handleParticipantLeft = (participant: any) => {
    if (participant.displayName) {
      const newParticipants = participants.filter(p => p !== participant.displayName);
      setParticipants(newParticipants);
      
      // Update room participant list
      if (currentRoom) {
        setRooms(prev => prev.map(room =>
          room.id === currentRoom
            ? { ...room, participantCount: newParticipants.length, participants: newParticipants }
            : room
        ));
      }
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
      <div className="space-y-4 h-screen flex flex-col pb-4">
        <div className="flex items-center justify-between px-4 pt-4">
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
          <div className="flex items-center gap-2">
            <Button
              variant={showMessaging ? "audio-active" : "audio-inactive"}
              onClick={() => setShowMessaging(!showMessaging)}
            >
              <Video size={18} className="mr-2" />
              {showMessaging ? 'Show Video' : 'Show Messages'}
            </Button>
            
            <Sheet open={showRoomsList} onOpenChange={setShowRoomsList}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <UsersRound size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader className="flex-row items-center justify-between space-y-0">
                  <SheetTitle>Active Rooms</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPanelPinned(!isPanelPinned)}
                  >
                    {isPanelPinned ? <PinOff size={18} /> : <Pin size={18} />}
                  </Button>
                </SheetHeader>
                <RoomList
                  rooms={rooms}
                  currentRoomId={currentRoom}
                  onRoomSelect={handleRoomSelect}
                  onToggleFavorite={handleToggleFavorite}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-4 overflow-y-auto">
          {/* Main Video Area */}
          <div className="space-y-4">
            {!showMessaging ? (
              <Card className="bg-gradient-card border-border card-shadow">
                <CardContent className="p-4">
                  <JitsiMeet
                    roomName={currentRoom}
                    displayName={displayName || user?.email?.split('@')[0] || 'Participant'}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <li>• Breakout rooms are connected to Band Hall</li>
                <li>• Move freely between all rooms anytime</li>
                <li>• Chat with participants across rooms</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Room List */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="text-accent">Available Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <RoomList
              rooms={rooms}
              currentRoomId={currentRoom}
              onRoomSelect={handleRoomSelect}
              onToggleFavorite={handleToggleFavorite}
            />
          </CardContent>
        </Card>

        {/* Lobby Chat */}
        <LobbyChat 
          displayName={displayName} 
          rooms={rooms}
        />
      </div>

      {/* Features Info */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Video size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground/70">
                Powered by <span className="font-semibold text-primary">Jitsi</span> • Video, Audio, Messaging & Breakout Rooms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ParticipantNameDialog
        open={showNameDialog}
        onConfirm={handleNameConfirm}
        onCancel={() => {
          setShowNameDialog(false);
          setPendingRoomId(null);
        }}
      />
    </div>
  );
};
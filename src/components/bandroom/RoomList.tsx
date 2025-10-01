import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Room {
  id: string;
  name: string;
  participantCount: number;
  isParent: boolean;
  parentId?: string;
}

interface RoomListProps {
  rooms: Room[];
  currentRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

export const RoomList = ({ rooms, currentRoomId, onRoomSelect }: RoomListProps) => {
  const parentRoom = rooms.find(r => r.isParent);
  const breakoutRooms = rooms.filter(r => !r.isParent);

  return (
    <Card className="bg-gradient-card border-border card-shadow h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Users size={20} />
          Active Rooms
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* Parent Room - Band Hall */}
            {parentRoom && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Main Hall
                </p>
                <Button
                  variant={currentRoomId === parentRoom.id ? "audio-active" : "audio-inactive"}
                  className="w-full justify-between h-auto py-3"
                  onClick={() => onRoomSelect(parentRoom.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Users size={20} className="text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{parentRoom.name}</p>
                      <p className="text-xs opacity-70">
                        {parentRoom.participantCount} {parentRoom.participantCount === 1 ? 'participant' : 'participants'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* Breakout Rooms */}
            {breakoutRooms.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pt-2">
                  Breakout Rooms
                </p>
                <div className="space-y-2">
                  {breakoutRooms.map(room => (
                    <Button
                      key={room.id}
                      variant={currentRoomId === room.id ? "audio-active" : "audio-inactive"}
                      className="w-full justify-between h-auto py-3"
                      onClick={() => onRoomSelect(room.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Users size={18} className="text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{room.name}</p>
                          <p className="text-xs opacity-70">
                            {room.participantCount} {room.participantCount === 1 ? 'participant' : 'participants'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {rooms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No active rooms</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

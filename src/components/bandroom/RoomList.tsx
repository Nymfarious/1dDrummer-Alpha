import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, ArrowRight, Heart, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Room {
  id: string;
  name: string;
  participantCount: number;
  participants: string[];
  isParent: boolean;
  isFavorite?: boolean;
  lastVisited?: Date;
}

interface RoomListProps {
  rooms: Room[];
  currentRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onToggleFavorite?: (roomId: string) => void;
}

export const RoomList = ({ rooms, currentRoomId, onRoomSelect, onToggleFavorite }: RoomListProps) => {
  const [showRecents, setShowRecents] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  const parentRoom = rooms.find(r => r.isParent);
  const breakoutRooms = rooms.filter(r => !r.isParent);
  
  // Filter rooms based on favorites toggle
  const displayedBreakoutRooms = showOnlyFavorites 
    ? breakoutRooms.filter(r => r.isFavorite)
    : breakoutRooms;
  
  // Recent rooms (last 5 visited, excluding current)
  const recentRooms = rooms
    .filter(r => r.lastVisited && r.id !== currentRoomId)
    .sort((a, b) => (b.lastVisited?.getTime() || 0) - (a.lastVisited?.getTime() || 0))
    .slice(0, 5);

  const RoomButton = ({ room }: { room: Room }) => (
    <div className="relative group">
      <Button
        variant={currentRoomId === room.id ? "audio-active" : "outline"}
        className="w-full justify-between h-auto py-3 pr-12"
        onClick={() => onRoomSelect(room.id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Users size={16} className="flex-shrink-0" />
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold truncate">{room.name}</p>
            <p className="text-xs opacity-80 truncate">
              {room.participants.length > 0 
                ? room.participants.join(', ')
                : `${room.participantCount} ${room.participantCount === 1 ? 'participant' : 'participants'}`
              }
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="flex-shrink-0" />
      </Button>
      {onToggleFavorite && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(room.id);
          }}
        >
          <Heart 
            size={16} 
            className={room.isFavorite ? "fill-red-500 text-red-500" : ""}
          />
        </Button>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={showOnlyFavorites ? "audio-active" : "outline"}
          size="sm"
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className="flex-1"
        >
          <Heart size={14} className={showOnlyFavorites ? "fill-current mr-1" : "mr-1"} />
          Favorites
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOnlyFavorites(false)}
          className="flex-1"
        >
          Show All
        </Button>
      </div>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active rooms</p>
              <p className="text-xs mt-1">Create a room to get started</p>
            </div>
          ) : (
            <>
              {/* Parent Room */}
              {parentRoom && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    MAIN HALL
                  </p>
                  <RoomButton room={parentRoom} />
                </div>
              )}

              {/* Breakout Rooms */}
              {displayedBreakoutRooms.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    {showOnlyFavorites ? 'FAVORITE ROOMS' : 'BREAKOUT ROOMS'}
                  </p>
                  <div className="space-y-2">
                    {displayedBreakoutRooms.map(room => (
                      <RoomButton key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Rooms */}
              {!showOnlyFavorites && recentRooms.length > 0 && (
                <Collapsible open={showRecents} onOpenChange={setShowRecents}>
                  <div className="mt-4">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2 h-auto py-1"
                      >
                        {showRecents ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="text-xs font-semibold text-muted-foreground ml-1">
                          RECENTS
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {recentRooms.map(room => (
                        <RoomButton key={room.id} room={room} />
                      ))}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

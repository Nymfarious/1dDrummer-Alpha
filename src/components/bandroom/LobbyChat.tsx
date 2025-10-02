import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  roomId: string;
  roomName: string;
}

interface LobbyChatProps {
  displayName: string;
  rooms: Array<{ id: string; name: string }>;
}

export const LobbyChat = ({ displayName, rooms }: LobbyChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: displayName || 'Guest',
      content: newMessage,
      timestamp: new Date(),
      roomId: 'lobby',
      roomName: 'Lobby'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-gradient-card border-border card-shadow h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-accent">
          <MessageSquare size={20} />
          Lobby Chat
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Message anyone across all rooms
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0 space-y-3">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start a conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.sender === displayName
                      ? 'bg-primary/20 ml-8'
                      : 'bg-secondary/50 mr-8'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {msg.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{msg.content}</p>
                  <span className="text-xs text-muted-foreground/70">
                    from {msg.roomName}
                  </span>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-input border-border"
            disabled={!displayName}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !displayName}
            variant="audio-active"
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
        
        {!displayName && (
          <p className="text-xs text-muted-foreground text-center">
            Set your display name to start chatting
          </p>
        )}
      </CardContent>
    </Card>
  );
};
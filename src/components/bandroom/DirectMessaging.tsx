import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  roomId: string;
}

interface DirectMessagingProps {
  currentRoomId: string;
  participants: string[];
  onClose?: () => void;
}

export const DirectMessaging = ({ currentRoomId, participants, onClose }: DirectMessagingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      from: user.email || 'Anonymous',
      to: selectedParticipant,
      content: newMessage.trim(),
      timestamp: new Date(),
      roomId: currentRoomId
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    toast({
      title: "Message sent",
      description: selectedParticipant === 'all' ? 'To all participants' : `To ${selectedParticipant}`,
      duration: 2000,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.roomId === currentRoomId &&
    (msg.to === 'all' || msg.to === user?.email || msg.from === user?.email)
  );

  return (
    <Card className="bg-gradient-card border-border card-shadow h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-accent text-lg">
          <MessageCircle size={20} />
          Direct Messages
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-4 min-h-0">
        {/* Participant Selector */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedParticipant === 'all' ? 'audio-active' : 'audio-inactive'}
            size="sm"
            onClick={() => setSelectedParticipant('all')}
          >
            All Participants
          </Button>
          {participants.filter(p => p !== user?.email).map(participant => (
            <Button
              key={participant}
              variant={selectedParticipant === participant ? 'audio-active' : 'audio-inactive'}
              size="sm"
              onClick={() => setSelectedParticipant(participant)}
            >
              {participant.split('@')[0]}
            </Button>
          ))}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4 min-h-0" ref={scrollRef}>
          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start a conversation with participants</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.from === user?.email
                      ? 'bg-primary/20 ml-8'
                      : 'bg-secondary mr-8'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-accent">
                      {msg.from === user?.email ? 'You' : msg.from.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                  {msg.to !== 'all' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      To: {msg.to === user?.email ? 'You' : msg.to.split('@')[0]}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${selectedParticipant === 'all' ? 'everyone' : selectedParticipant.split('@')[0]}...`}
            className="flex-1 bg-input border-border"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            variant="audio-active"
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

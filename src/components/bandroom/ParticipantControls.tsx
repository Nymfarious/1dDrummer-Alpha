import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Hand, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParticipantControlsProps {
  onHandRaise: () => void;
  onMessageOpen: () => void;
}

export const ParticipantControls = ({ onHandRaise, onMessageOpen }: ParticipantControlsProps) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playDingSound = () => {
    // Create a simple ding sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Microphone unmuted" : "Microphone muted",
      duration: 2000,
    });
  };

  const handlePushToTalk = (active: boolean) => {
    setIsPushToTalk(active);
    if (!active) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleHandRaise = () => {
    setHandRaised(!handRaised);
    playDingSound();
    onHandRaise();
    
    toast({
      title: handRaised ? "Hand lowered" : "Hand raised",
      description: handRaised ? undefined : "Other participants will be notified",
      duration: 2000,
    });
  };

  return (
    <Card className="bg-gradient-card border-border card-shadow">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Mute Toggle */}
          <Button
            variant={isMuted ? "audio-danger" : "audio-active"}
            size="audio"
            onClick={handleMuteToggle}
            className="flex-col h-auto py-3 px-6"
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            <span className="text-xs mt-1">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </Button>

          {/* Push to Talk */}
          <Button
            variant={isPushToTalk ? "audio-active" : "audio-inactive"}
            size="audio"
            onMouseDown={() => handlePushToTalk(true)}
            onMouseUp={() => handlePushToTalk(false)}
            onMouseLeave={() => handlePushToTalk(false)}
            onTouchStart={() => handlePushToTalk(true)}
            onTouchEnd={() => handlePushToTalk(false)}
            className="flex-col h-auto py-3 px-6"
          >
            <Mic size={24} />
            <span className="text-xs mt-1">Push to Talk</span>
          </Button>

          {/* Hand Raise */}
          <Button
            variant={handRaised ? "audio-active" : "audio-inactive"}
            size="audio"
            onClick={handleHandRaise}
            className="flex-col h-auto py-3 px-6"
          >
            <Hand size={24} />
            <span className="text-xs mt-1">
              {handRaised ? 'Lower Hand' : 'Raise Hand'}
            </span>
          </Button>

          {/* Direct Messages */}
          <Button
            variant="audio-inactive"
            size="audio"
            onClick={onMessageOpen}
            className="flex-col h-auto py-3 px-6"
          >
            <MessageCircle size={24} />
            <span className="text-xs mt-1">Messages</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

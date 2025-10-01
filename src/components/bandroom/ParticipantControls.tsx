import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Hand, MessageCircle, Settings, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ParticipantControlsProps {
  onHandRaise: () => void;
  onMessageOpen: () => void;
}

export const ParticipantControls = ({ onHandRaise, onMessageOpen }: ParticipantControlsProps) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
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

  const handleVideoToggle = () => {
    setIsVideoOff(!isVideoOff);
    toast({
      title: isVideoOff ? "Video enabled" : "Video disabled",
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
          
          {/* Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="audio-inactive"
                size="audio"
                className="flex-col h-auto py-3 px-6"
              >
                <Settings size={24} />
                <span className="text-xs mt-1">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Audio & Video Settings</h4>
                  <div className="space-y-2">
                    <Button
                      variant={isVideoOff ? "outline" : "default"}
                      className="w-full justify-start"
                      onClick={handleVideoToggle}
                    >
                      {isVideoOff ? <VideoOff size={16} className="mr-2" /> : <Video size={16} className="mr-2" />}
                      {isVideoOff ? 'Enable Video' : 'Disable Video'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Settings size={16} className="mr-2" />
                      Audio Devices
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Video size={16} className="mr-2" />
                      Video Devices
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

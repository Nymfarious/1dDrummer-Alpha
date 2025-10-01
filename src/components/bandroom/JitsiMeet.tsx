import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
}

export const JitsiMeet = ({ roomName, displayName, onParticipantJoined, onParticipantLeft }: JitsiMeetProps) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!jitsiContainerRef.current) return;

    const loadJitsiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initializeJitsi();
      document.body.appendChild(script);
    };

    const initializeJitsi = () => {
      const domain = 'meet.jit.si';
      const options = {
        roomName: `dDrummer_${roomName}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName || user?.email?.split('@')[0] || 'Participant',
          email: user?.email
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'download', 'help', 'mute-everyone'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        }
      };

      const api = new (window as any).JitsiMeetExternalAPI(domain, options);
      setJitsiApi(api);

      // Event listeners
      api.addEventListener('participantJoined', (participant: any) => {
        console.log('Participant joined:', participant);
        onParticipantJoined?.(participant);
      });

      api.addEventListener('participantLeft', (participant: any) => {
        console.log('Participant left:', participant);
        onParticipantLeft?.(participant);
      });

      api.addEventListener('videoConferenceJoined', () => {
        console.log('Video conference joined');
      });
    };

    if (!(window as any).JitsiMeetExternalAPI) {
      loadJitsiScript();
    } else {
      initializeJitsi();
    }

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [roomName, displayName]);

  return (
    <div 
      ref={jitsiContainerRef} 
      className="w-full h-full rounded-lg overflow-hidden border border-border"
      style={{ minHeight: '500px' }}
    />
  );
};

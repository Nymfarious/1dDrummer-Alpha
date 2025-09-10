import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle, Upload, Download, Trash2, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const RecordingPanel = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<string[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "3-minute session recording in progress...",
      });

      // Simulate 3-minute recording
      setTimeout(() => {
        setIsRecording(false);
        const recordingName = `Session ${new Date().toLocaleTimeString()}`;
        setRecordings(prev => [...prev, recordingName]);
        
        toast({
          title: "Recording Complete",
          description: "3-minute session saved successfully!",
        });
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      }, 180000); // 3 minutes
      
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Microphone access denied or unavailable",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Recording Stopped",
      description: "Session recording ended early",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-6">Recording Studio</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Controls */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Mic size={20} />
              Audio Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "audio-danger" : "audio"}
              size="wide"
              className="w-full"
            >
              <Circle 
                size={20} 
                fill={isRecording ? "currentColor" : "transparent"} 
                className={isRecording ? "animate-pulse" : ""}
              />
              {isRecording ? 'Stop Recording' : 'Start 3-Min Recording'}
            </Button>
            
            <Button
              variant="audio-inactive"
              size="wide"
              className="w-full status-inactive"
              disabled
            >
              <Upload size={20} />
              Upload to Cloud
            </Button>
            
            {isRecording && (
              <div className="p-4 bg-audio-danger/10 rounded-lg border border-audio-danger/20">
                <div className="flex items-center justify-center gap-2">
                  <Circle size={12} className="text-audio-danger animate-pulse" fill="currentColor" />
                  <span className="text-sm font-medium">Recording in progress...</span>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Session will auto-stop after 3 minutes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recordings List */}
        <Card className="bg-gradient-card border-border card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Download size={20} />
              Your Recordings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mic size={48} className="mx-auto mb-4 opacity-50" />
                <p>No recordings yet</p>
                <p className="text-sm">Start recording to see your sessions here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recordings.map((recording, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                    <span className="text-sm font-medium">{recording}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setRecordings(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
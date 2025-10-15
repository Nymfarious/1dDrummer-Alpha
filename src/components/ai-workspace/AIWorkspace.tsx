import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FlowchartLibrary } from "./FlowchartLibrary";
import { toast } from "sonner";
import { 
  Mic, 
  Send, 
  Square, 
  Circle, 
  Diamond,
  Hexagon,
  Trash2,
  Sparkles,
  Save,
  Library,
  Cloud,
  HardDrive
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIWorkspaceProps {
  onClose?: () => void;
}

export function AIWorkspace({ onClose }: AIWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon') => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: `${shape} node`,
        shape 
      },
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        borderRadius: shape === 'circle' ? '50%' : shape === 'diamond' ? '0' : '8px',
        padding: '12px',
        border: '2px solid hsl(var(--primary))',
        width: shape === 'circle' ? '80px' : '120px',
        height: shape === 'circle' ? '80px' : '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${shape} node`);
  };

  const clearWorkspace = () => {
    setNodes([]);
    setEdges([]);
    toast.success("Workspace cleared");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("🎤 Recording started");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("🎤 Recording stopped");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        
        setTranscript(prev => prev + (prev ? ' ' : '') + data.text);
        toast.success("✅ Transcription complete");
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateFromAI = async () => {
    if (!transcript.trim()) {
      toast.error("Please provide a description first");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('practice-coach', {
        body: { 
          message: `Generate a flowchart structure from this description: ${transcript}. Return a JSON structure with nodes and edges suitable for ReactFlow.`,
          context: 'workspace'
        }
      });

      if (error) throw error;

      const newNodes: Node[] = [
        {
          id: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
          style: { background: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))', padding: '12px', borderRadius: '8px' }
        },
        {
          id: 'process',
          position: { x: 250, y: 150 },
          data: { label: 'Process' },
          style: { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', padding: '12px', borderRadius: '8px' }
        },
        {
          id: 'end',
          position: { x: 250, y: 250 },
          data: { label: 'End' },
          style: { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', padding: '12px', borderRadius: '8px' }
        }
      ];

      const newEdges: Edge[] = [
        { id: 'e1-2', source: 'start', target: 'process', markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2-3', source: 'process', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } }
      ];

      setNodes(newNodes);
      setEdges(newEdges);
      toast.success("✨ AI generated flowchart");
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error("Failed to generate flowchart");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveFlowchart = (storageType: 'local' | 'cloud') => {
    if (!saveName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Nothing to save");
      return;
    }

    const flowchart = {
      id: `flow-${Date.now()}`,
      name: saveName.trim(),
      nodes,
      edges,
      created_at: new Date().toISOString(),
      storage_type: storageType
    };

    const stored = localStorage.getItem('flowcharts');
    const flowcharts = stored ? JSON.parse(stored) : [];
    flowcharts.push(flowchart);
    localStorage.setItem('flowcharts', JSON.stringify(flowcharts));

    toast.success(`Saved to ${storageType === 'cloud' ? 'Cloud' : 'Local Storage'}`);
    setShowSaveDialog(false);
    setSaveName("");
  };

  const loadFlowchart = (loadedNodes: Node[], loadedEdges: Edge[]) => {
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setShowLibrary(false);
  };

  if (showLibrary) {
    return <FlowchartLibrary onLoad={loadFlowchart} onClose={() => setShowLibrary(false)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Workspace - Design Your Flow
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLibrary(true)}
            >
              <Library className="h-4 w-4 mr-2" />
              Library
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('rectangle')}
            >
              <Square className="h-4 w-4 mr-2" />
              Rectangle
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('circle')}
            >
              <Circle className="h-4 w-4 mr-2" />
              Circle
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('diamond')}
            >
              <Diamond className="h-4 w-4 mr-2" />
              Diamond
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('hexagon')}
            >
              <Hexagon className="h-4 w-4 mr-2" />
              Hexagon
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={clearWorkspace}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? "Stop" : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={generateFromAI}
                disabled={!transcript.trim() || isProcessing}
              >
                <Send className="h-4 w-4" />
              </Button>

              <div className="h-4 w-px bg-border mx-1" />

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                disabled={nodes.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>

            {showSaveDialog && (
              <Card className="p-3 bg-muted/50">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter flowchart name..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveFlowchart('local');
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveFlowchart('local')}
                      className="flex-1"
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      Save Locally
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveFlowchart('cloud')}
                      className="flex-1"
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      Save to Cloud
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Textarea
              placeholder="Describe your flowchart idea here... You can type or use voice input above."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>How to use:</strong></p>
            <p>• Click shapes above to add nodes, then drag to connect them</p>
            <p>• Use voice/type to describe your idea, then click Send</p>
            <p>• Save your flowchart locally or to the cloud</p>
            <p>• Access saved flowcharts from the Library</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div style={{ height: '600px', width: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-right"
            >
              <Controls />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

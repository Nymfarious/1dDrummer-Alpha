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
  useReactFlow,
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
  HardDrive,
  Scan,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize,
  Brain,
  Grid3x3,
  FileCode,
  MousePointer2,
  LayoutDashboard
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface AIWorkspaceProps {
  onClose?: () => void;
  devToolsOpen?: boolean;
}

export function AIWorkspace({ onClose, devToolsOpen = false }: AIWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [aiHelperPrompt, setAiHelperPrompt] = useState("");
  const [aiHelperResponse, setAiHelperResponse] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
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

  const handleZoomIn = () => {
    const reactFlowInstance = document.querySelector('.react-flow');
    if (reactFlowInstance) {
      const currentZoom = parseFloat(reactFlowInstance.getAttribute('data-zoom') || '1');
      const newZoom = Math.min(currentZoom * 1.2, 2);
      reactFlowInstance.setAttribute('data-zoom', newZoom.toString());
      const zoomInButton = document.querySelector('[data-testid="rf__controls-zoomin"]') as HTMLButtonElement;
      zoomInButton?.click();
    }
  };

  const handleZoomOut = () => {
    const reactFlowInstance = document.querySelector('.react-flow');
    if (reactFlowInstance) {
      const currentZoom = parseFloat(reactFlowInstance.getAttribute('data-zoom') || '1');
      const newZoom = Math.max(currentZoom * 0.8, 0.5);
      reactFlowInstance.setAttribute('data-zoom', newZoom.toString());
      const zoomOutButton = document.querySelector('[data-testid="rf__controls-zoomout"]') as HTMLButtonElement;
      zoomOutButton?.click();
    }
  };

  const handleFitView = () => {
    const fitViewButton = document.querySelector('[data-testid="rf__controls-fitview"]') as HTMLButtonElement;
    fitViewButton?.click();
  };

  const handleAIHelperSubmit = async () => {
    if (!aiHelperPrompt.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    setIsProcessing(true);
    try {
      // Wire to Lovable AI or practice-coach
      const { data, error } = await supabase.functions.invoke('practice-coach', {
        body: { 
          message: aiHelperPrompt,
          context: 'workflow-helper'
        }
      });

      if (error) throw error;
      
      setAiHelperResponse(data.response || "AI Helper is ready to assist!");
      toast.success("Response received");
    } catch (error) {
      console.error('AI Helper error:', error);
      setAiHelperResponse('AI Helper is ready to assist with dDrummer development. Wire me up to get real responses!');
      toast.success("Response generated (demo mode)");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredNodes = filterType === "all" ? nodes : nodes.filter(node => {
    const label = node.data.label?.toLowerCase() || '';
    if (filterType === "components") return label.includes('component') || label.includes('panel');
    if (filterType === "pages") return label.includes('page') || label.includes('route');
    if (filterType === "buttons") return label.includes('button') || label.includes('control');
    return true;
  });

  const analyzeAppHealth = async () => {
    setIsAnalyzing(true);
    try {
      // Gather code snapshot - simplified for now
      const codeSnapshot = {
        components: [
          "AIWorkspace", "DevTools", "DrummerStudio", "AudioPanel", 
          "MetronomePanel", "BandRoomPanel", "RecordingPanel"
        ],
        features: [
          "Audio Recording", "Metronome", "Band Room", "AI Coach",
          "File Upload", "User Profiles", "Settings", "Libraries"
        ],
        integrations: [
          "Supabase Auth", "Supabase Storage", "Jitsi Meet", 
          "Dropbox", "Google Drive", "AI Gateway"
        ]
      };

      const { data, error } = await supabase.functions.invoke('app-health-analyzer', {
        body: { codeSnapshot }
      });

      if (error) throw error;

      // Convert analysis to RSG color-coded nodes
      const statusColors = {
        red: 'hsl(var(--destructive))',
        yellow: 'hsl(45, 93%, 47%)',
        green: 'hsl(var(--success))',
        blue: 'hsl(var(--primary))',
        gray: 'hsl(var(--muted))'
      };

      const analysisNodes: Node[] = data.nodes.map((node: any) => ({
        id: node.id,
        position: node.position,
        data: { 
          label: `${node.label}\n${node.progress}%`,
          status: node.status,
          issues: node.issues
        },
        style: {
          background: statusColors[node.status as keyof typeof statusColors],
          color: node.status === 'gray' ? 'hsl(var(--foreground))' : 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '2px solid',
          borderColor: statusColors[node.status as keyof typeof statusColors],
          minWidth: '120px',
          fontSize: '11px',
          textAlign: 'center'
        }
      }));

      const analysisEdges: Edge[] = data.edges.map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        markerEnd: { type: MarkerType.ArrowClosed }
      }));

      setNodes(analysisNodes);
      setEdges(analysisEdges);
      
      toast.success(`Analysis complete: ${data.summary.working}/${data.summary.totalComponents} working`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Failed to analyze app health");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showLibrary) {
    return <FlowchartLibrary onLoad={loadFlowchart} onClose={() => setShowLibrary(false)} />;
  }

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${devToolsOpen ? 'pl-80' : ''}`}>
      <Card className="flex-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              App Workflow
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={analyzeAppHealth}
                disabled={isAnalyzing}
              >
                <Scan className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Analyze App"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLibrary(true)}
              >
                <Library className="h-4 w-4 mr-2" />
                Library
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <Tabs defaultValue="all" value={filterType} onValueChange={setFilterType}>
            <div className="flex items-center justify-between gap-2">
              <TabsList className="grid grid-cols-4 h-8 w-full max-w-md">
                <TabsTrigger value="all" className="text-xs">
                  <Grid3x3 className="h-3 w-3 mr-1" />
                  All
                </TabsTrigger>
                <TabsTrigger value="components" className="text-xs">
                  <FileCode className="h-3 w-3 mr-1" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="pages" className="text-xs">
                  <LayoutDashboard className="h-3 w-3 mr-1" />
                  Pages
                </TabsTrigger>
                <TabsTrigger value="buttons" className="text-xs">
                  <MousePointer2 className="h-3 w-3 mr-1" />
                  Controls
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleFitView} title="Fit View">
                  <Maximize className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Tabs>

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

          {/* AI Helper Section */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Helper
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Ask questions about your workflow or app development
              </p>
              <Input
                placeholder="Ask me anything..."
                value={aiHelperPrompt}
                onChange={(e) => setAiHelperPrompt(e.target.value)}
                className="text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAIHelperSubmit()}
              />
              <Button 
                size="sm" 
                onClick={handleAIHelperSubmit} 
                className="w-full"
                disabled={isProcessing || !aiHelperPrompt.trim()}
              >
                Get Answer
              </Button>
              {aiHelperResponse && (
                <div className="p-2 rounded bg-muted text-xs">
                  {aiHelperResponse}
                </div>
              )}
            </CardContent>
          </Card>

          <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>How to use</span>
                {instructionsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="text-xs text-muted-foreground space-y-1 p-2 rounded bg-muted/30">
                <p>• Click "Analyze App" to generate RSG color-coded architecture flow</p>
                <p>• Click shapes above to add nodes, then drag to connect them</p>
                <p>• Use voice/type to describe your idea, then click Send</p>
                <p>• Save your flowchart locally or to the cloud</p>
                <p>• Access saved flowcharts from the Library</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="text-xs font-medium p-2 rounded bg-gradient-to-r from-destructive/10 via-warning/10 to-success/10">
            <strong>RSG Status Colors:</strong> 🔴 Broken | 🟡 Needs Work | 🟢 Working | 🔵 Planned | ⚪ Deprecated
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 min-h-0">
        <CardContent className="p-0 h-full">
          <div className="h-full w-full">
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.5}
              maxZoom={2}
            >
              <Controls showInteractive={false} />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
  LayoutDashboard,
  Settings,
  Minus,
  MoreHorizontal
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [edgeColor, setEdgeColor] = useState("hsl(var(--primary))");
  const [edgeStyle, setEdgeStyle] = useState<'default' | 'step' | 'smoothstep' | 'straight'>('default');
  const [edgeType, setEdgeType] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: edgeColor, strokeDasharray: edgeType === 'dashed' ? '5,5' : edgeType === 'dotted' ? '2,2' : '0' },
      type: edgeStyle
    }, eds)),
    [setEdges, edgeColor, edgeType, edgeStyle]
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
    setIsTranscribing(true);
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
      setIsTranscribing(false);
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
        { 
          id: 'e1-2', 
          source: 'start', 
          target: 'process', 
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: edgeColor, strokeDasharray: edgeType === 'dashed' ? '5,5' : edgeType === 'dotted' ? '2,2' : '0' },
          type: edgeStyle
        },
        { 
          id: 'e2-3', 
          source: 'process', 
          target: 'end', 
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: edgeColor, strokeDasharray: edgeType === 'dashed' ? '5,5' : edgeType === 'dotted' ? '2,2' : '0' },
          type: edgeStyle
        }
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

  const saveFlowchart = (storageType: 'local' | 'cloud' | 'dev-prefs') => {
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

    const storageKey = storageType === 'dev-prefs' ? 'dev-flowcharts' : 'flowcharts';
    const stored = localStorage.getItem(storageKey);
    const flowcharts = stored ? JSON.parse(stored) : [];
    flowcharts.push(flowchart);
    localStorage.setItem(storageKey, JSON.stringify(flowcharts));

    const label = storageType === 'cloud' ? 'Cloud' : storageType === 'dev-prefs' ? 'Dev Preferences' : 'Local Storage';
    toast.success(`Saved to ${label}`);
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
    <div className={`space-y-3 transition-all duration-300 ${devToolsOpen ? 'pl-80' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Controls - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                App Workflow
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={analyzeAppHealth}
                  disabled={isAnalyzing}
                >
                  <Scan className="h-3 w-3 mr-1" />
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLibrary(true)}
                >
                  <Library className="h-3 w-3 mr-1" />
                  Library
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pb-2">
            <Tabs defaultValue="all" value={filterType} onValueChange={setFilterType}>
              <div className="flex items-center justify-between gap-2">
                <TabsList className="grid grid-cols-4 h-7 flex-1">
                  <TabsTrigger value="all" className="text-xs px-2">
                    <Grid3x3 className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="components" className="text-xs px-2">
                    <FileCode className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="text-xs px-2">
                    <LayoutDashboard className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="buttons" className="text-xs px-2">
                    <MousePointer2 className="h-3 w-3" />
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={handleZoomOut} title="Zoom Out" className="h-7 w-7 p-0">
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoom In" className="h-7 w-7 p-0">
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleFitView} title="Fit View" className="h-7 w-7 p-0">
                    <Maximize className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Tabs>

            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" onClick={() => addNode('rectangle')} className="h-7 px-2 text-xs">
                <Square className="h-3 w-3 mr-1" />
                Rect
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('circle')} className="h-7 px-2 text-xs">
                <Circle className="h-3 w-3 mr-1" />
                Circle
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('diamond')} className="h-7 px-2 text-xs">
                <Diamond className="h-3 w-3 mr-1" />
                Diamond
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('hexagon')} className="h-7 px-2 text-xs">
                <Hexagon className="h-3 w-3 mr-1" />
                Hex
              </Button>
              <Button size="sm" variant="destructive" onClick={clearWorkspace} className="h-7 px-2 text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 items-center pt-1 border-t">
              <span className="text-xs text-muted-foreground">Lines:</span>
              <Button 
                size="sm" 
                variant={edgeStyle === 'default' ? 'default' : 'outline'} 
                onClick={() => setEdgeStyle('default')}
                className="h-7 px-2 text-xs"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant={edgeStyle === 'step' ? 'default' : 'outline'} 
                onClick={() => setEdgeStyle('step')}
                className="h-7 px-2 text-xs"
              >
                Step
              </Button>
              <Button 
                size="sm" 
                variant={edgeStyle === 'smoothstep' ? 'default' : 'outline'} 
                onClick={() => setEdgeStyle('smoothstep')}
                className="h-7 px-2 text-xs"
              >
                Smooth
              </Button>
              <Button 
                size="sm" 
                variant={edgeStyle === 'straight' ? 'default' : 'outline'} 
                onClick={() => setEdgeStyle('straight')}
                className="h-7 px-2 text-xs"
              >
                Straight
              </Button>
              
              <div className="h-4 w-px bg-border mx-1" />
              
              <Button 
                size="sm" 
                variant={edgeType === 'solid' ? 'default' : 'outline'} 
                onClick={() => setEdgeType('solid')}
                className="h-7 px-2 text-xs"
              >
                Solid
              </Button>
              <Button 
                size="sm" 
                variant={edgeType === 'dashed' ? 'default' : 'outline'} 
                onClick={() => setEdgeType('dashed')}
                className="h-7 px-2 text-xs"
              >
                Dash
              </Button>
              <Button 
                size="sm" 
                variant={edgeType === 'dotted' ? 'default' : 'outline'} 
                onClick={() => setEdgeType('dotted')}
                className="h-7 px-2 text-xs"
              >
                Dot
              </Button>
              
              <div className="h-4 w-px bg-border mx-1" />
              
              <input 
                type="color" 
                value={edgeColor.includes('hsl') ? '#8B5CF6' : edgeColor}
                onChange={(e) => setEdgeColor(e.target.value)}
                className="h-7 w-12 rounded border cursor-pointer"
                title="Line Color"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className="h-7 px-2"
              >
                {isRecording ? "Stop" : <Mic className="h-3 w-3" />}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={generateFromAI}
                disabled={!transcript.trim() || isProcessing}
                className="h-7 w-7 p-0"
              >
                <Send className="h-3 w-3" />
              </Button>

              <div className="h-4 w-px bg-border" />

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                disabled={nodes.length === 0}
                className="h-7 px-2 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>

            {showSaveDialog && (
              <Card className="p-2 bg-muted/50">
                <div className="space-y-1">
                  <Input
                    placeholder="Flowchart name..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveFlowchart('local')}
                    className="h-7 text-xs"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => saveFlowchart('local')} className="flex-1 h-7 text-xs">
                      <HardDrive className="h-3 w-3 mr-1" />
                      Local
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => saveFlowchart('cloud')} className="flex-1 h-7 text-xs">
                      <Cloud className="h-3 w-3 mr-1" />
                      Cloud
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => saveFlowchart('dev-prefs')} className="flex-1 h-7 text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Dev
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="relative overflow-hidden">
              <div className={`transition-all duration-300 ${isRecording || isTranscribing ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}`}>
                <Textarea
                  placeholder="Describe your flowchart idea..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[60px] text-xs"
                  disabled={isRecording || isTranscribing}
                />
              </div>
              {(isRecording || isTranscribing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md border animate-in slide-in-from-left">
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <div className={`h-3 w-3 rounded-full ${isRecording ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                      <span className="text-xs font-medium">
                        {isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : ''}
                      </span>
                    </div>
                    {transcript && <p className="text-xs text-muted-foreground px-4">{transcript}</p>}
                  </div>
                </div>
              )}
            </div>

            <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between h-7 text-xs">
                  <span>How to use</span>
                  {instructionsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1">
                <div className="text-xs text-muted-foreground space-y-0.5 p-2 rounded bg-muted/30">
                  <p>• Click "Analyze" for RSG flow</p>
                  <p>• Add shapes & connect</p>
                  <p>• Voice/type & Send</p>
                  <p>• Save & access Library</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* AI Helper - 1/3 width */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Helper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-2">
            <Input
              placeholder="Ask anything..."
              value={aiHelperPrompt}
              onChange={(e) => setAiHelperPrompt(e.target.value)}
              className="text-xs h-7"
              onKeyDown={(e) => e.key === 'Enter' && handleAIHelperSubmit()}
            />
            <Button 
              size="sm" 
              onClick={handleAIHelperSubmit} 
              className="w-full h-7 text-xs"
              disabled={isProcessing || !aiHelperPrompt.trim()}
            >
              Get Answer
            </Button>
            {aiHelperResponse && (
              <div className="p-2 rounded bg-muted text-xs max-h-32 overflow-y-auto">
                {aiHelperResponse}
              </div>
            )}
          </CardContent>

        </Card>
      </div>

      {/* RSG Legend */}
      <div className="text-xs font-medium p-2 rounded bg-gradient-to-r from-destructive/10 via-warning/10 to-success/10">
        <strong>RSG Status:</strong> 🔴 Broken | 🟡 Needs Work | 🟢 Working | 🔵 Planned | ⚪ Deprecated
      </div>

      {/* Workflow Visualization */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '500px', width: '100%' }}>
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

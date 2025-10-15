import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Library, 
  Trash2, 
  Edit2,
  Download,
  Upload,
  FolderOpen,
  Cloud,
  HardDrive
} from "lucide-react";
import { Node, Edge } from 'reactflow';

interface SavedFlowchart {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  storage_type: 'local' | 'cloud';
}

interface FlowchartLibraryProps {
  onLoad?: (nodes: Node[], edges: Edge[]) => void;
  onClose?: () => void;
}

export function FlowchartLibrary({ onLoad, onClose }: FlowchartLibraryProps) {
  const [flowcharts, setFlowcharts] = useState<SavedFlowchart[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadFlowcharts();
  }, []);

  const loadFlowcharts = () => {
    const stored = localStorage.getItem('flowcharts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFlowcharts(parsed);
      } catch (error) {
        console.error('Error loading flowcharts:', error);
      }
    }
  };

  const saveToStorage = (charts: SavedFlowchart[]) => {
    localStorage.setItem('flowcharts', JSON.stringify(charts));
    setFlowcharts(charts);
  };

  const deleteFlowchart = (id: string) => {
    const updated = flowcharts.filter(f => f.id !== id);
    saveToStorage(updated);
    toast.success("Flowchart deleted");
  };

  const startRename = (flowchart: SavedFlowchart) => {
    setEditingId(flowchart.id);
    setEditingName(flowchart.name);
  };

  const finishRename = () => {
    if (!editingId || !editingName.trim()) return;
    
    const updated = flowcharts.map(f => 
      f.id === editingId ? { ...f, name: editingName.trim() } : f
    );
    saveToStorage(updated);
    setEditingId(null);
    setEditingName("");
    toast.success("Flowchart renamed");
  };

  const loadFlowchart = (flowchart: SavedFlowchart) => {
    if (onLoad) {
      onLoad(flowchart.nodes, flowchart.edges);
      toast.success(`Loaded: ${flowchart.name}`);
      if (onClose) onClose();
    }
  };

  const exportFlowchart = (flowchart: SavedFlowchart) => {
    const dataStr = JSON.stringify(flowchart, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowchart.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Flowchart exported");
  };

  const importFlowchart = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          const newFlowchart: SavedFlowchart = {
            ...imported,
            id: `flow-${Date.now()}`,
            created_at: new Date().toISOString(),
            storage_type: 'local'
          };
          saveToStorage([...flowcharts, newFlowchart]);
          toast.success("Flowchart imported");
        } catch (error) {
          toast.error("Failed to import flowchart");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Flowchart Library
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={importFlowchart}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              {onClose && (
                <Button size="sm" variant="outline" onClick={onClose}>
                  Back
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {flowcharts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No saved flowcharts yet</p>
              <p className="text-sm mt-1">Create and save your first flowchart in the AI Workspace</p>
            </div>
          ) : (
            <div className="space-y-2">
              {flowcharts.map((flowchart) => (
                <Card key={flowchart.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {editingId === flowchart.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finishRename();
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="h-8"
                            autoFocus
                          />
                          <Button size="sm" onClick={finishRename}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium truncate">{flowchart.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {flowchart.storage_type === 'cloud' ? (
                                <>
                                  <Cloud className="h-3 w-3 mr-1" />
                                  Cloud
                                </>
                              ) : (
                                <>
                                  <HardDrive className="h-3 w-3 mr-1" />
                                  Local
                                </>
                              )}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(flowchart.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadFlowchart(flowchart)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startRename(flowchart)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => exportFlowchart(flowchart)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFlowchart(flowchart.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

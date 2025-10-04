import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, ChevronRight, Plus, Minus, Triangle, MoreVertical } from "lucide-react";

interface TestLabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TestLabDialog = ({ open, onOpenChange }: TestLabDialogProps) => {
  const [expandIconOpen, setExpandIconOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            Test Lab - UI Component Testing
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buttons">Button Styles</TabsTrigger>
            <TabsTrigger value="icons">Icon Styles</TabsTrigger>
            <TabsTrigger value="expand">Expand Icons</TabsTrigger>
          </TabsList>

          {/* Button Style Tests */}
          <TabsContent value="buttons" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Button Style Comparison</h3>
              
              <div className="grid grid-cols-2 gap-8 p-6 bg-background-darker rounded-lg">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Test A: Concave (Inset)</h4>
                  <Button 
                    className="w-full button-concave"
                    onClick={() => console.log('Concave button clicked')}
                  >
                    Press Me (Concave)
                  </Button>
                  <p className="text-xs text-muted-foreground">Pressed-in effect, like a button pushed into the surface</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Test B: Embossed (Raised)</h4>
                  <Button 
                    className="w-full button-embossed"
                    onClick={() => console.log('Embossed button clicked')}
                  >
                    Press Me (Embossed)
                  </Button>
                  <p className="text-xs text-muted-foreground">Raised effect, like a button coming out of the surface</p>
                </div>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm">
                  <strong>Test Instructions:</strong> Click both buttons to feel the press-down animation. 
                  Concave buttons appear pressed in, while embossed buttons appear raised.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Icon Style Tests */}
          <TabsContent value="icons" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Icon Style Preview</h3>
              
              <div className="grid grid-cols-2 gap-8 p-6 bg-background-darker rounded-lg">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Standard Icons</h4>
                  <div className="flex gap-4 items-center justify-center p-4">
                    <Music className="w-8 h-8" />
                    <Music className="w-12 h-12 text-primary" />
                    <Music className="w-16 h-16 text-accent" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Hollow Glow Icons</h4>
                  <div className="flex gap-4 items-center justify-center p-4">
                    <Music className="w-8 h-8 icon-hollow-glow" />
                    <Music className="w-12 h-12 icon-hollow-glow text-primary" />
                    <Music className="w-16 h-16 icon-hollow-glow text-accent" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-6 bg-background-darker rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">Butterfly Icons (Outline Style)</h4>
                <div className="flex gap-8 items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <div className="text-4xl icon-hollow-glow text-blue-400">🦋</div>
                    <p className="text-xs">Blue Butterfly</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-4xl icon-hollow-glow text-purple-400">🦋</div>
                    <p className="text-xs">Purple Butterfly</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm">
                  <strong>Note:</strong> Hollow glow icons use outline strokes with Tron-like glow effects. 
                  These will adapt to the active theme colors when color picker is implemented.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Expand Icon Tests */}
          <TabsContent value="expand" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Expand Icon Options</h3>
              
              <div className="grid grid-cols-2 gap-4 p-6 bg-background-darker rounded-lg">
                {/* Option 1: Chevron */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Option 1: Chevron</h4>
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Collapsed:</p>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Expanded:</p>
                      <ChevronRight className="w-5 h-5 rotate-90 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Option 2: Plus/Minus */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Option 2: Plus/Minus</h4>
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Collapsed:</p>
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Expanded:</p>
                      <Minus className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Option 3: Triangle */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Option 3: Triangle</h4>
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Collapsed:</p>
                      <Triangle className="w-5 h-5 rotate-90" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Expanded:</p>
                      <Triangle className="w-5 h-5 rotate-180 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Option 4: Dots Expand (SELECTED) */}
                <div className="p-4 border-2 border-primary rounded-lg space-y-3 bg-primary/5">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    Option 4: Dots Expand ⋯
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Selected</span>
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Collapsed:</p>
                      <MoreVertical className="w-5 h-5 icon-hollow-glow" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Expanded:</p>
                      <MoreVertical className="w-5 h-5 rotate-90 transition-transform icon-hollow-glow" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Demo */}
              <div className="p-6 bg-background-darker rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Live Preview - Dots Expand</h4>
                <button
                  onClick={() => setExpandIconOpen(!expandIconOpen)}
                  className="flex items-center gap-2 p-3 rounded-lg bg-background hover:bg-accent/20 transition-colors w-full"
                >
                  <MoreVertical 
                    className={`w-5 h-5 icon-hollow-glow transition-transform ${
                      expandIconOpen ? 'rotate-90' : ''
                    }`}
                  />
                  <span>Click to test expand/collapse</span>
                </button>
                {expandIconOpen && (
                  <div className="p-4 bg-accent/10 rounded animate-accordion-down">
                    <p className="text-sm">Content expands here! The dots rotate 90° with a smooth transition and glow effect.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm">
                  <strong>Your Selection:</strong> Dots Expand (⋯) with glow effect. 
                  This will be used for all expandable sections in DevTools.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

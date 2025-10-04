import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BugTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BugItem {
  id: string;
  description: string;
  checked: boolean;
}

const STORAGE_KEY = 'ddrummer-bug-tracker';

export const BugTracker = ({ open, onOpenChange }: BugTrackerProps) => {
  const [bugs, setBugs] = useState({
    transport: [
      { id: 't1', description: 'Audio playback not starting on first click', checked: false },
      { id: 't2', description: 'Pause button enabled when no file loaded', checked: false },
      { id: 't3', description: 'Rewind/Skip buttons active without audio', checked: false },
      { id: 't4', description: 'Volume slider not syncing on mount', checked: false },
      { id: 't5', description: 'Loop toggle state not visible', checked: false },
      { id: 't6', description: 'Progress slider jumpy during playback', checked: false },
      { id: 't7', description: 'Green LED missing on functional buttons', checked: false },
    ] as BugItem[],
    metronome: [
      { id: 'm1', description: 'BPM changes not restarting metronome during playback', checked: false },
      { id: 'm2', description: 'Metronome LED missing when active', checked: false },
      { id: 'm3', description: 'Tap tempo not working', checked: false },
    ] as BugItem[],
    bandroom: [
      { id: 'b1', description: 'Room creation not refreshing list', checked: false },
      { id: 'b2', description: 'Jitsi integration loading issues', checked: false },
    ] as BugItem[],
    aicoach: [
      { id: 'a1', description: 'Coach responses not displaying', checked: false },
      { id: 'a2', description: 'Practice suggestions loading slowly', checked: false },
    ] as BugItem[],
    recording: [
      { id: 'r1', description: 'File upload validation errors unclear', checked: false },
      { id: 'r2', description: 'Recording LED missing during capture', checked: false },
      { id: 'r3', description: 'Upload button LED missing when functional', checked: false },
    ] as BugItem[],
    settings: [
      { id: 's1', description: 'Theme changes not persisting', checked: false },
      { id: 's2', description: 'Audio device selection not working', checked: false },
    ] as BugItem[],
  });

  const [wishlist, setWishlist] = useState([
    { id: 'w1', description: 'Embossed button system with press-down animation', checked: false },
    { id: 'w2', description: 'Tron-like glowing strokes for active states', checked: false },
    { id: 'w3', description: 'Auto-unpress previous button when new button activated', checked: false },
    { id: 'w4', description: 'Theme-aware glow colors from Preferences', checked: false },
    { id: 'w5', description: 'Color picker/theme settings expansion', checked: false },
    { id: 'w6', description: 'Hollow glowing icon style system', checked: false },
  ] as BugItem[]);

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setBugs(data.bugs || bugs);
        setWishlist(data.wishlist || wishlist);
      } catch (e) {
        console.error('Failed to load bug tracker state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bugs, wishlist }));
  }, [bugs, wishlist]);

  const toggleBug = (section: keyof typeof bugs, id: string) => {
    setBugs(prev => ({
      ...prev,
      [section]: prev[section].map(bug =>
        bug.id === id ? { ...bug, checked: !bug.checked } : bug
      )
    }));
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev =>
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const clearAll = () => {
    if (confirm('Clear all checked items? This cannot be undone.')) {
      setBugs({
        transport: bugs.transport.map(b => ({ ...b, checked: false })),
        metronome: bugs.metronome.map(b => ({ ...b, checked: false })),
        bandroom: bugs.bandroom.map(b => ({ ...b, checked: false })),
        aicoach: bugs.aicoach.map(b => ({ ...b, checked: false })),
        recording: bugs.recording.map(b => ({ ...b, checked: false })),
        settings: bugs.settings.map(b => ({ ...b, checked: false })),
      });
      setWishlist(wishlist.map(w => ({ ...w, checked: false })));
    }
  };

  const sections = [
    { key: 'transport' as const, label: 'Transport Controls', items: bugs.transport },
    { key: 'metronome' as const, label: 'Metronome Panel', items: bugs.metronome },
    { key: 'bandroom' as const, label: 'Band Room Panel', items: bugs.bandroom },
    { key: 'aicoach' as const, label: 'AI Coach Panel', items: bugs.aicoach },
    { key: 'recording' as const, label: 'Recording Panel', items: bugs.recording },
    { key: 'settings' as const, label: 'Settings Panel', items: bugs.settings },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🪱</span>
            Bug Tracker - dDrummer Development
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transport" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="panels">Panels</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Transport Controls */}
          <TabsContent value="transport">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Transport Controls</h3>
                {bugs.transport.map((bug) => (
                  <div key={bug.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent/10">
                    <Checkbox
                      id={bug.id}
                      checked={bug.checked}
                      onCheckedChange={() => toggleBug('transport', bug.id)}
                    />
                    <label
                      htmlFor={bug.id}
                      className={`text-sm cursor-pointer ${bug.checked ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {bug.description}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Other Panels */}
          <TabsContent value="panels">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {sections.slice(1).map((section) => (
                  <div key={section.key}>
                    <h3 className="font-semibold mb-3">{section.label}</h3>
                    <div className="space-y-3">
                      {section.items.map((bug) => (
                        <div key={bug.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent/10">
                          <Checkbox
                            id={bug.id}
                            checked={bug.checked}
                            onCheckedChange={() => toggleBug(section.key, bug.id)}
                          />
                          <label
                            htmlFor={bug.id}
                            className={`text-sm cursor-pointer ${bug.checked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {bug.description}
                          </label>
                        </div>
                      ))}
                    </div>
                    {section.key !== 'settings' && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Feature Wishlist</h3>
                {wishlist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent/10">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => toggleWishlist(item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.description}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Actions */}
          <TabsContent value="actions">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Bug Tracker Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your bug tracking data and preferences
                </p>
              </div>

              <Separator />

              <Button variant="destructive" onClick={clearAll} className="w-full">
                Clear All Checked Items
              </Button>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Bug tracker data is automatically saved to localStorage and persists across sessions.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

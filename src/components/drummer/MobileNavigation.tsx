import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Play, Music, Circle, Users, Settings, LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'transport', label: 'Transport', icon: Play },
  { id: 'metronome', label: 'Metronome', icon: Music },
  { id: 'recording', label: 'Recording', icon: Circle },
  { id: 'libraries', label: 'Libraries', icon: Music },
  { id: 'bandroom', label: 'Band Room', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const MobileNavigation = ({ activeTab, onTabChange }: MobileNavigationProps) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveIcon = activeTabData?.icon || Play;

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="bg-sidebar border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            dDrummer
          </h1>
          
          {/* Active Tab Indicator */}
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <ActiveIcon size={18} />
            <span className="text-sm font-medium">{activeTabData?.label}</span>
          </div>

          {/* Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sidebar-foreground">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-sidebar border-sidebar-border">
              <SheetHeader>
                <SheetTitle className="text-sidebar-foreground text-left">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-full">
                {/* Navigation */}
                <nav className="flex-1 mt-6 space-y-2">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        variant={isActive ? "audio-active" : "audio-inactive"}
                        className="w-full justify-start gap-3 h-12"
                      >
                        <Icon size={20} />
                        <span className="font-medium">{tab.label}</span>
                      </Button>
                    );
                  })}
                </nav>

                {/* User Info & Logout */}
                <div className="pt-4 border-t border-sidebar-border space-y-3">
                  <div className="flex items-center gap-3 px-3 py-2 bg-sidebar-accent rounded-lg">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User size={16} className="text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="w-full justify-start gap-3"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border px-2 py-2 safe-area-pb">
        <div className="flex justify-around">
          {tabs.slice(0, 4).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-sidebar-foreground'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-medium truncate max-w-16">
                  {tab.label}
                </span>
              </Button>
            );
          })}
          
          {/* Settings in menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  activeTab === 'settings' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-sidebar-foreground'
                }`}
              >
                <Settings size={18} />
                <span className="text-xs font-medium">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-sidebar border-sidebar-border rounded-t-xl">
              <div className="py-4">
                <Button
                  onClick={() => onTabChange('settings')}
                  variant={activeTab === 'settings' ? "audio-active" : "audio-inactive"}
                  className="w-full justify-start gap-3 h-12 mb-4"
                >
                  <Settings size={20} />
                  <span className="font-medium">Settings</span>
                </Button>
                
                <div className="border-t border-sidebar-border pt-4">
                  <div className="flex items-center gap-3 px-3 py-2 bg-sidebar-accent rounded-lg mb-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User size={16} className="text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="w-full justify-start gap-3"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Play, Music, Circle, Users, Settings, LogOut, User, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'transport', label: 'Transport', icon: Play },
  { id: 'metronome', label: 'Metronome', icon: Music },
  { id: 'recording', label: 'Recording', icon: Circle },
  { id: 'aicoach', label: 'AI Coach', icon: Sparkles },
  { id: 'libraries', label: 'Library', icon: Music },
  { id: 'bandroom', label: 'Band Room', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { user, signOut } = useAuth();

  const TabButton = ({ tab, isActive, onClick }: { 
    tab: typeof tabs[0]; 
    isActive: boolean; 
    onClick: () => void; 
  }) => {
    const Icon = tab.icon;
    return (
      <Button
        onClick={onClick}
        variant={isActive ? "audio-active" : "audio-inactive"}
        className="w-full justify-start gap-3 h-12"
      >
        <Icon size={20} />
        <span className="font-medium">{tab.label}</span>
      </Button>
    );
  };

  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-center">
          dDrummer
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
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
    </aside>
  );
};
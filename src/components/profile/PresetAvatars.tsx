import { Music, Drum, Radio, Headphones, Mic2, Guitar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PresetAvatarsProps {
  onSelect: (url: string) => void;
}

export const PresetAvatars = ({ onSelect }: PresetAvatarsProps) => {
  const presets = [
    { id: 'drum', icon: Drum, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { id: 'music', icon: Music, color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { id: 'radio', icon: Radio, color: 'bg-gradient-to-br from-green-500 to-teal-500' },
    { id: 'headphones', icon: Headphones, color: 'bg-gradient-to-br from-orange-500 to-red-500' },
    { id: 'mic', icon: Mic2, color: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
    { id: 'guitar', icon: Guitar, color: 'bg-gradient-to-br from-yellow-500 to-orange-500' },
  ];

  const generatePresetUrl = (preset: typeof presets[0]) => {
    // For now, we'll use a data URL with SVG
    const svg = `
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-${preset.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${preset.color.includes('purple') ? '#a855f7' : preset.color.includes('blue') ? '#3b82f6' : preset.color.includes('green') ? '#10b981' : preset.color.includes('orange') ? '#f97316' : preset.color.includes('indigo') ? '#6366f1' : '#eab308'};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${preset.color.includes('pink') ? '#ec4899' : preset.color.includes('cyan') ? '#06b6d4' : preset.color.includes('teal') ? '#14b8a6' : preset.color.includes('red') ? '#ef4444' : preset.color.includes('purple') ? '#a855f7' : '#f97316'};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#grad-${preset.id})" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="48" fill="white">
          ${preset.id === 'drum' ? '🥁' : preset.id === 'music' ? '🎵' : preset.id === 'radio' ? '📻' : preset.id === 'headphones' ? '🎧' : preset.id === 'mic' ? '🎤' : '🎸'}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {presets.map((preset) => {
        const Icon = preset.icon;
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(generatePresetUrl(preset))}
            className="group relative aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform"
          >
            <div className={`w-full h-full ${preset.color} flex items-center justify-center`}>
              <Icon className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        );
      })}
    </div>
  );
};
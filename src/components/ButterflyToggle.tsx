import { useState } from "react";

interface ButterflyToggleProps {
  onToggle: () => void;
  isVisible: boolean;
}

export const ButterflyToggle = ({ onToggle, isVisible }: ButterflyToggleProps) => {
  const [variant, setVariant] = useState<'blue' | 'purple'>('blue');

  return (
    <button
      onClick={onToggle}
      onDoubleClick={() => setVariant(v => v === 'blue' ? 'purple' : 'blue')}
      className={`
        fixed bottom-6 right-6 z-50
        w-8 h-8 
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-30 hover:opacity-100' : 'opacity-20 hover:opacity-80'}
        hover:scale-110
        group
      `}
      title="Toggle DevTools (double-click to change color)"
    >
      <div 
        className={`
          text-3xl icon-hollow-glow
          ${variant === 'blue' ? 'text-blue-400' : 'text-purple-400'}
          group-hover:animate-pulse
        `}
      >
        🦋
      </div>
    </button>
  );
};

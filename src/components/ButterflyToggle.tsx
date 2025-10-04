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
        w-12 h-12 
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-60 hover:opacity-100' : 'opacity-40 hover:opacity-80'}
        hover:scale-110
        group
      `}
      title="Toggle DevTools (double-click to change color)"
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          w-full h-full icon-hollow-glow
          ${variant === 'blue' ? 'text-blue-400' : 'text-purple-400'}
        `}
      >
        {/* Hollow butterfly outline */}
        <path d="M6.5 7.5C6.5 5.5 7 4 9 4c2 0 3 1.5 3 3.5S11 11 9 11s-2.5-1.5-2.5-3.5z" />
        <path d="M17.5 7.5C17.5 5.5 17 4 15 4c-2 0-3 1.5-3 3.5S13 11 15 11s2.5-1.5 2.5-3.5z" />
        <path d="M6.5 16.5C6.5 18.5 7 20 9 20c2 0 3-1.5 3-3.5S11 13 9 13s-2.5 1.5-2.5 3.5z" />
        <path d="M17.5 16.5c0 2-0.5 3.5-2.5 3.5-2 0-3-1.5-3-3.5S13 13 15 13s2.5 1.5 2.5 3.5z" />
        <path d="M12 4v7m0 2v7" />
      </svg>
    </button>
  );
};

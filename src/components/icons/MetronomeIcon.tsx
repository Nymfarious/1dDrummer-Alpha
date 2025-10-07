import React from 'react';

interface MetronomeIconProps {
  size?: number;
  className?: string;
}

export const MetronomeIcon: React.FC<MetronomeIconProps> = ({ 
  size = 24, 
  className = "" 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Base */}
      <path d="M6 22 h12" />
      
      {/* Body - pyramidal shape */}
      <path d="M9 22 L11 8 L13 8 L15 22" />
      
      {/* Top cap */}
      <path d="M10.5 8 h3" />
      <circle cx="12" cy="6.5" r="1" />
      
      {/* Pendulum arm */}
      <path d="M12 6.5 L13.5 16" strokeWidth="1.5" />
      
      {/* Weight on pendulum */}
      <rect x="12.5" y="14.5" width="2" height="3" rx="0.5" fill="currentColor" />
      
      {/* Tick marks on body */}
      <path d="M10 12 h1.5" strokeWidth="1" opacity="0.5" />
      <path d="M10 15 h1.5" strokeWidth="1" opacity="0.5" />
      <path d="M10 18 h1.5" strokeWidth="1" opacity="0.5" />
    </svg>
  );
};

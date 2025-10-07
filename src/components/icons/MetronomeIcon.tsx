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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Base */}
      <line x1="7" y1="22" x2="17" y2="22" />
      
      {/* Body - pyramidal/triangular shape */}
      <path d="M8.5 22 L10 6 L14 6 L15.5 22 Z" />
      
      {/* Top arc */}
      <path d="M9 6 Q12 4 15 6" />
      
      {/* Pendulum arm - make it more visible with thicker stroke */}
      <line x1="12" y1="5" x2="14" y2="16" strokeWidth="2.5" />
      
      {/* Weight on pendulum */}
      <circle cx="14" cy="16" r="1.5" fill="currentColor" />
      
      {/* Tick marks on body for detail */}
      <line x1="10.5" y1="12" x2="12" y2="12" strokeWidth="1" opacity="0.6" />
      <line x1="10.8" y1="15" x2="12" y2="15" strokeWidth="1" opacity="0.6" />
      <line x1="11.2" y1="18" x2="12.5" y2="18" strokeWidth="1" opacity="0.6" />
    </svg>
  );
};


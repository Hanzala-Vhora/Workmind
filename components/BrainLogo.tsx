import React from 'react';
import logoUrl from '../assets/logo.jpeg';

interface BrainLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({ className, width = 40, height = 40 }) => (
  <img 
    src={logoUrl} 
    alt="Logo" 
    width={width} 
    height={height} 
    className={`object-contain rounded-full bg-transparent ${className || ''}`}
    style={{ width, height }}
  />
);

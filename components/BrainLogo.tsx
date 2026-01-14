import React from 'react';

interface BrainLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({ className, width = 40, height = 40 }) => (
  <svg width={width} height={height} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36C28.8366 36 28.8366 36 20 20C36 11.1634 28.8366 4 20 4Z" fill="url(#paint0_linear_logo)" fillOpacity="0.1"/>
    <path d="M20 8C15 8 11 11 11 16C11 18 12 21 15 22C13 24 12 28 14 31C16 34 20 34 20 34C20 34 24 34 26 31C28 28 27 24 25 22C28 21 29 18 29 16C29 11 25 8 20 8Z" stroke="url(#paint1_linear_logo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 12V16M16 16H24M16 20C16 20 18 22 20 22C22 22 24 20 24 20" stroke="url(#paint2_linear_logo)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="1.5" fill="#3EE3F0"/>
    <circle cx="24" cy="16" r="1.5" fill="#3EE3F0"/>
    <circle cx="20" cy="10" r="1.5" fill="#3EE3F0"/>
    <defs>
      <linearGradient id="paint0_linear_logo" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#19B6C6"/>
        <stop offset="1" stopColor="#5B4B8A"/>
      </linearGradient>
      <linearGradient id="paint1_linear_logo" x1="11" y1="8" x2="29" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#19B6C6"/>
        <stop offset="0.5" stopColor="#1F6FAF"/>
        <stop offset="1" stopColor="#5B4B8A"/>
      </linearGradient>
      <linearGradient id="paint2_linear_logo" x1="16" y1="12" x2="24" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3EE3F0"/>
        <stop offset="1" stopColor="#7DF0F7"/>
      </linearGradient>
    </defs>
  </svg>
);

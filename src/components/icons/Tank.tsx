import * as React from 'react';

export const Tank = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Tank body - cylindrical shape */}
    <ellipse cx="12" cy="6" rx="8" ry="2" />
    <path d="M4 6v10c0 1.1 3.6 2 8 2s8-.9 8-2V6" />
    
    {/* Water level indicator */}
    <ellipse cx="12" cy="12" rx="7" ry="1.5" opacity="0.5" />
    
    {/* Valve/outlet at bottom */}
    <path d="M11 18v2" />
    <path d="M13 18v2" />
    <circle cx="12" cy="20.5" r="1" fill="currentColor" />
    
    {/* Top cap/lid */}
    <path d="M10 4h4" />
    <circle cx="12" cy="3" r="0.5" fill="currentColor" />
  </svg>
);

export default Tank;

import React from 'react';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ContentWrapper component provides proper spacing for page content
 * to prevent overlap with fixed header and footer components.
 * 
 * Uses CSS custom properties for dynamic spacing:
 * - --header-height: Height of the fixed header
 * - --footer-height: Height of the fixed footer
 * 
 * Requirements: 5.1, 5.2
 */
const ContentWrapper: React.FC<ContentWrapperProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`content-wrapper ${className}`}
      data-testid="content-wrapper"
      style={{
        paddingTop: 'var(--header-height, 64px)',
        paddingBottom: 'var(--footer-height, 80px)',
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
};

export default ContentWrapper;

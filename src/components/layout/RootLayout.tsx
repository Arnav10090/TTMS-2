import React from 'react';
import Header from '@/components/layout/Header';
import SystemAlertsBanner from '@/components/reports/SystemAlertsBanner';

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * RootLayout component provides a persistent layout wrapper that remains mounted
 * across all route transitions. This prevents flickering and layout shifts by
 * keeping the Header and Footer (SystemAlertsBanner) components stable.
 * 
 * The Header component dynamically displays either TTMS or PTMS title based on the current route.
 * 
 * Requirements: 3.1, 3.4
 */
export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="root-layout" data-testid="root-layout">
      {/* Header - Fixed at top, dynamically shows TTMS or PTMS title */}
      <div data-testid="root-layout-header">
        <Header />
      </div>

      {/* Content Area - Wrapped with proper spacing */}
      <div className="content-wrapper" data-testid="content-wrapper">
        {children}
        {/* Spacer to ensure content is not hidden behind fixed footer. Adds extra gap. */}
        <div style={{ height: 'calc(var(--footer-height, 80px) + 24px)' }} aria-hidden="true" />
      </div>

      {/* Footer - Fixed at bottom */}
      <div data-testid="root-layout-footer">
        <SystemAlertsBanner />
      </div>
    </div>
  );
};

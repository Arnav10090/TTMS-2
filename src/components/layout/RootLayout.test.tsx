import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';

// Mock the child components to avoid complex dependencies
vi.mock('@/components/Navbar', () => ({
  Navbar: ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div data-testid="navbar-mock">Navbar (collapsed: {String(isCollapsed)})</div>
  ),
}));

vi.mock('@/components/reports/SystemAlertsBanner', () => ({
  default: () => <div data-testid="system-alerts-banner-mock">SystemAlertsBanner</div>,
}));

describe('RootLayout Component', () => {
  const renderRootLayout = (props = {}) => {
    return render(
      <BrowserRouter>
        <RootLayout {...props}>
          <div data-testid="test-content">Test Content</div>
        </RootLayout>
      </BrowserRouter>
    );
  };

  describe('Component Structure', () => {
    it('should render the root layout container', () => {
      renderRootLayout();
      const rootLayout = screen.getByTestId('root-layout');
      expect(rootLayout).toBeInTheDocument();
      expect(rootLayout).toHaveClass('root-layout');
    });

    it('should render Header (Navbar) component once', () => {
      renderRootLayout();
      const header = screen.getByTestId('root-layout-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('header-fixed');
      expect(screen.getByTestId('navbar-mock')).toBeInTheDocument();
    });

    it('should render Footer (SystemAlertsBanner) component once', () => {
      renderRootLayout();
      const footer = screen.getByTestId('root-layout-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('footer-fixed');
      expect(screen.getByTestId('system-alerts-banner-mock')).toBeInTheDocument();
    });

    it('should render content wrapper with children', () => {
      renderRootLayout();
      const contentWrapper = screen.getByTestId('content-wrapper');
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper).toHaveClass('content-wrapper');
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should render all three sections in correct order', () => {
      const { container } = renderRootLayout();
      const rootLayout = container.querySelector('.root-layout');
      const children = rootLayout?.children;
      
      expect(children).toHaveLength(3);
      expect(children?.[0]).toHaveClass('header-fixed');
      expect(children?.[1]).toHaveClass('content-wrapper');
      expect(children?.[2]).toHaveClass('footer-fixed');
    });
  });

  describe('Props Handling', () => {
    it('should pass isCollapsed prop to Navbar', () => {
      renderRootLayout({ isCollapsed: true });
      expect(screen.getByTestId('navbar-mock')).toHaveTextContent('collapsed: true');
    });

    it('should default isCollapsed to false', () => {
      renderRootLayout();
      expect(screen.getByTestId('navbar-mock')).toHaveTextContent('collapsed: false');
    });

    it('should render custom children content', () => {
      render(
        <BrowserRouter>
          <RootLayout>
            <div data-testid="custom-child-1">Child 1</div>
            <div data-testid="custom-child-2">Child 2</div>
          </RootLayout>
        </BrowserRouter>
      );
      
      expect(screen.getByTestId('custom-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-child-2')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Data Attributes', () => {
    it('should apply correct CSS classes to header', () => {
      renderRootLayout();
      const header = screen.getByTestId('root-layout-header');
      expect(header).toHaveClass('header-fixed');
    });

    it('should apply correct CSS classes to footer', () => {
      renderRootLayout();
      const footer = screen.getByTestId('root-layout-footer');
      expect(footer).toHaveClass('footer-fixed');
    });

    it('should have data-testid attributes for testing', () => {
      renderRootLayout();
      expect(screen.getByTestId('root-layout')).toBeInTheDocument();
      expect(screen.getByTestId('root-layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('content-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('root-layout-footer')).toBeInTheDocument();
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 3.1: Layout component wraps routing logic', () => {
      renderRootLayout();
      // RootLayout should contain header, content area, and footer
      expect(screen.getByTestId('root-layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('content-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('root-layout-footer')).toBeInTheDocument();
    });

    it('should satisfy Requirement 3.4: Layout wraps routing to ensure persistence', () => {
      renderRootLayout();
      // The structure allows children (Routes) to be wrapped by persistent layout
      const contentWrapper = screen.getByTestId('content-wrapper');
      expect(contentWrapper).toContainElement(screen.getByTestId('test-content'));
    });
  });
});

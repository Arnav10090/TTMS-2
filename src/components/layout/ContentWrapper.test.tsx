import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentWrapper from './ContentWrapper';

describe('ContentWrapper Component', () => {
  beforeEach(() => {
    // Clear any CSS custom properties before each test
    document.documentElement.style.removeProperty('--header-height');
    document.documentElement.style.removeProperty('--footer-height');
  });

  describe('Component Structure', () => {
    it('should render the content wrapper container', () => {
      render(
        <ContentWrapper>
          <div data-testid="test-content">Test Content</div>
        </ContentWrapper>
      );
      
      const wrapper = screen.getByTestId('content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('content-wrapper');
    });

    it('should render children content', () => {
      render(
        <ContentWrapper>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ContentWrapper>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should have data-testid attribute', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      expect(screen.getByTestId('content-wrapper')).toBeInTheDocument();
    });
  });

  describe('CSS Spacing with Default Values', () => {
    it('should apply default padding-top when CSS custom property is not set', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      // Check inline style contains the CSS custom property with fallback
      const style = wrapper.getAttribute('style');
      expect(style).toContain('padding-top: var(--header-height, 64px)');
    });

    it('should apply default padding-bottom when CSS custom property is not set', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const style = wrapper.getAttribute('style');
      expect(style).toContain('padding-bottom: var(--footer-height, 80px)');
    });

    it('should apply min-height of 100vh', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const style = wrapper.getAttribute('style');
      expect(style).toContain('min-height: 100vh');
    });
  });

  describe('CSS Spacing with Custom Properties', () => {
    it('should use CSS custom property for padding-top when set', () => {
      // Set custom property
      document.documentElement.style.setProperty('--header-height', '80px');
      
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      // The inline style should reference the CSS variable
      const style = wrapper.getAttribute('style');
      expect(style).toContain('padding-top: var(--header-height, 64px)');
      
      // Verify the CSS custom property is set on document root
      const rootStyle = getComputedStyle(document.documentElement);
      expect(document.documentElement.style.getPropertyValue('--header-height')).toBe('80px');
    });

    it('should use CSS custom property for padding-bottom when set', () => {
      // Set custom property
      document.documentElement.style.setProperty('--footer-height', '100px');
      
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const style = wrapper.getAttribute('style');
      expect(style).toContain('padding-bottom: var(--footer-height, 80px)');
      
      // Verify the CSS custom property is set on document root
      expect(document.documentElement.style.getPropertyValue('--footer-height')).toBe('100px');
    });

    it('should update spacing when CSS custom properties change', () => {
      const { rerender } = render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      // Initial state - inline style should reference CSS variable
      let style = wrapper.getAttribute('style');
      expect(style).toContain('padding-top: var(--header-height, 64px)');
      
      // Update CSS custom property
      document.documentElement.style.setProperty('--header-height', '72px');
      
      // Rerender to pick up changes
      rerender(<ContentWrapper><div>Content</div></ContentWrapper>);
      
      // Style should still reference the CSS variable
      style = wrapper.getAttribute('style');
      expect(style).toContain('padding-top: var(--header-height, 64px)');
      expect(document.documentElement.style.getPropertyValue('--header-height')).toBe('72px');
    });
  });

  describe('Props Handling', () => {
    it('should apply additional className when provided', () => {
      render(
        <ContentWrapper className="custom-class another-class">
          <div>Content</div>
        </ContentWrapper>
      );
      
      const wrapper = screen.getByTestId('content-wrapper');
      expect(wrapper).toHaveClass('content-wrapper');
      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveClass('another-class');
    });

    it('should work without additional className', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      expect(wrapper).toHaveClass('content-wrapper');
    });

    it('should handle empty className prop', () => {
      render(
        <ContentWrapper className="">
          <div>Content</div>
        </ContentWrapper>
      );
      
      const wrapper = screen.getByTestId('content-wrapper');
      expect(wrapper).toHaveClass('content-wrapper');
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 5.1: Apply top padding to prevent header overlap', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const style = wrapper.getAttribute('style');
      expect(style).toContain('padding-top');
      
      // Should reference CSS variable with fallback
      expect(style).toContain('var(--header-height, 64px)');
    });

    it('should satisfy Requirement 5.2: Apply bottom padding to prevent footer overlap', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const style = wrapper.getAttribute('style');
      expect(style).toContain('padding-bottom');
      
      // Should reference CSS variable with fallback
      expect(style).toContain('var(--footer-height, 80px)');
    });

    it('should satisfy Requirement 5.5: Maintain consistent spacing', () => {
      const { rerender } = render(
        <ContentWrapper><div>Content 1</div></ContentWrapper>
      );
      
      const wrapper = screen.getByTestId('content-wrapper');
      const initialStyle = wrapper.getAttribute('style');
      
      // Rerender with different content
      rerender(<ContentWrapper><div>Content 2</div></ContentWrapper>);
      
      const newStyle = wrapper.getAttribute('style');
      
      // Spacing CSS should remain consistent
      expect(newStyle).toBe(initialStyle);
    });
  });

  describe('Fallback Values', () => {
    it('should use 64px fallback for header height', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      // Without CSS custom property set, should use fallback in CSS variable
      const style = wrapper.getAttribute('style');
      expect(style).toContain('var(--header-height, 64px)');
    });

    it('should use 80px fallback for footer height', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const style = wrapper.getAttribute('style');
      expect(style).toContain('var(--footer-height, 80px)');
    });
  });

  describe('Full Viewport Coverage', () => {
    it('should ensure min-height is 100vh for full viewport coverage', () => {
      render(<ContentWrapper><div>Content</div></ContentWrapper>);
      const wrapper = screen.getByTestId('content-wrapper');
      
      const computedStyle = window.getComputedStyle(wrapper);
      expect(computedStyle.minHeight).toBe('100vh');
    });
  });
});

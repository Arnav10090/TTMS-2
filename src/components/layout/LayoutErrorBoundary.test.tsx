import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayoutErrorBoundary } from './LayoutErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('LayoutErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <LayoutErrorBoundary>
        <div data-testid="child">Child content</div>
      </LayoutErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render fallback UI when an error occurs', () => {
    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong with the layout/i)).toBeInTheDocument();
  });

  it('should display error message in fallback UI', () => {
    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    expect(screen.getByText(/We encountered an unexpected error/i)).toBeInTheDocument();
  });

  it('should render action buttons in fallback UI', () => {
    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
  });

  it('should call window.location.reload when Reload Page is clicked', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should display timestamp when error occurs', () => {
    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    expect(screen.getByText(/Error occurred at/i)).toBeInTheDocument();
  });

  it('should log error to console when error is caught', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    render(
      <LayoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LayoutErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

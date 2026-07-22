import { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { DocumentRenderer } from './DocumentRenderer';

interface DocumentPreviewModalProps {
  src: string | null;
  onClose: () => void;
  filename?: string;
}

export function DocumentPreviewModal({ src, onClose, filename = 'Unknown document' }: DocumentPreviewModalProps) {
  // Reference to the close button for initial focus
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Reference to the element that triggered the modal (for focus restoration)
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Conditional rendering - only render when src is not null
  if (!src) {
    return null;
  }

  // Store the triggering element when modal opens
  useEffect(() => {
    // Store the currently focused element (the element that triggered the modal)
    triggerElementRef.current = document.activeElement as HTMLElement;

    // Set initial focus to close button when modal opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Restore focus to triggering element when modal closes
    return () => {
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, []);

  // Escape key handler - closes modal when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener when modal is open
    document.addEventListener('keydown', handleKeyDown);

    // Clean up listener when modal closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Scroll prevention - prevent background page scrolling when modal is open
  useEffect(() => {
    // Store original overflow value
    const originalOverflow = document.body.style.overflow;

    // Set overflow to hidden when modal opens
    document.body.style.overflow = 'hidden';

    // Restore original overflow when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleLoad = () => {
    // Document loaded successfully
  };

  const handleError = (error: string) => {
    // Error handled by DocumentRenderer
    console.error('Document load error:', error);
  };

  // Click-outside-to-close handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: () => closeButtonRef.current || undefined,
        allowOutsideClick: true,
      }}
    >
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl flex flex-col h-[80vh] max-h-[90vh]">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex-shrink-0">
            <h2 id="modal-title" className="text-base sm:text-lg font-semibold text-slate-900 truncate pr-2 sm:pr-4">
              {filename}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close document preview"
              className="flex-shrink-0 p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-auto min-h-0 bg-slate-100">
            <DocumentRenderer
              src={src}
              filename={filename}
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>

          {/* Modal Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg flex-shrink-0">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1.5 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>Open in New Tab</span>
              <span className="sr-only"> - Opens document in a new browser tab</span>
            </a>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}

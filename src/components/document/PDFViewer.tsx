import { useEffect } from 'react';

interface PDFViewerProps {
  src: string;
  onLoad: () => void;
  onError: (error: string) => void;
}

export function PDFViewer({ src, onLoad, onError }: PDFViewerProps) {
  useEffect(() => {
    // Call onLoad after a short delay to allow PDF to start rendering
    // The embed element doesn't reliably fire onLoad events
    const timer = setTimeout(() => {
      onLoad();
    }, 500);

    return () => clearTimeout(timer);
  }, [onLoad]);

  const handleError = () => {
    onError('Failed to load PDF');
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <embed
        src={src}
        type="application/pdf"
        onError={handleError}
        className="w-full h-full rounded"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}

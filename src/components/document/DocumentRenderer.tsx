import { useState, useEffect } from 'react';
import { PDFViewer } from './PDFViewer';
import { ImageViewer } from './ImageViewer';
import { getDocumentType, DocumentType } from '../../utils/documentType';

interface DocumentRendererProps {
  src: string;
  filename: string;
  onLoad: () => void;
  onError: (error: string) => void;
}

export function DocumentRenderer({ src, filename, onLoad, onError }: DocumentRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const documentType = getDocumentType(src, filename);

  useEffect(() => {
    // Reset loading state when src or retryKey changes
    setIsLoading(true);
    setError(null);
  }, [src, retryKey]);

  useEffect(() => {
    if (documentType === DocumentType.UNKNOWN) {
      const msg = 'Unsupported document type';
      setIsLoading(false);
      setError(msg);
      onError(msg);
    }
  }, [documentType, onError]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    onLoad();
  };

  const handleError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
    onError(errorMessage);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryKey(prev => prev + 1);
  };

  const viewer = (() => {
    if (documentType === DocumentType.PDF) {
      return <PDFViewer key={retryKey} src={src} onLoad={handleLoad} onError={handleError} />;
    }
    if (documentType === DocumentType.IMAGE) {
      return <ImageViewer key={retryKey} src={src} alt={filename} onLoad={handleLoad} onError={handleError} />;
    }
    return null;
  })();

  return (
    <div className="relative w-full h-full">
      {/* Viewer area */}
      <div className="w-full h-full">
        {error ? (
          <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center">
            <div className="mb-4">
              <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to load document</h3>
            <p className="text-sm text-slate-600 mb-1"><span className="font-medium">{filename}</span></p>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button onClick={handleRetry} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Retry</button>
          </div>
        ) : (
          <div className="w-full h-full">
            {viewer}
          </div>
        )}
      </div>

      {/* Loading overlay (always mount viewer so it can call onLoad) */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  );
}

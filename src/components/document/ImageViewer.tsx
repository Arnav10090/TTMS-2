interface ImageViewerProps {
  src: string;
  alt: string;
  onLoad: () => void;
  onError: (error: string) => void;
}

export function ImageViewer({ src, alt, onLoad, onError }: ImageViewerProps) {
  const handleLoad = () => {
    onLoad();
  };

  const handleError = () => {
    onError('Failed to load image');
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className="object-contain max-w-full max-h-full rounded"
        style={{ maxHeight: '70vh' }}
      />
    </div>
  );
}

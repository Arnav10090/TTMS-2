/**
 * Document type enumeration
 */
export enum DocumentType {
  PDF = 'pdf',
  IMAGE = 'image',
  UNKNOWN = 'unknown',
}

/**
 * Supported image file extensions
 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

/**
 * Detects the document type from a URL or filename based on file extension
 * 
 * @param url - The document URL to analyze
 * @param filename - Optional filename to use for type detection (useful for blob URLs)
 * @returns The detected document type (PDF, IMAGE, or UNKNOWN)
 * 
 * @example
 * getDocumentType('/documents/file.pdf') // Returns DocumentType.PDF
 * getDocumentType('/images/photo.JPG') // Returns DocumentType.IMAGE
 * getDocumentType('blob:http://...', 'document.pdf') // Returns DocumentType.PDF
 * getDocumentType('/files/doc.txt') // Returns DocumentType.UNKNOWN
 */
export function getDocumentType(url: string, filename?: string): DocumentType {
  // If filename is provided, use it for type detection (useful for blob URLs)
  const source = filename || url;
  
  // Extract the file extension from the source
  const extension = source.split('.').pop()?.toLowerCase();

  // Check if it's a PDF
  if (extension === 'pdf') {
    return DocumentType.PDF;
  }

  // Check if it's an image
  if (extension && IMAGE_EXTENSIONS.includes(extension)) {
    return DocumentType.IMAGE;
  }

  // Unknown or unsupported type
  return DocumentType.UNKNOWN;
}

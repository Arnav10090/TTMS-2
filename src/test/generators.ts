import * as fc from 'fast-check';

/**
 * Document type enumeration for testing
 */
export enum DocumentType {
  PDF = 'pdf',
  IMAGE = 'image',
  UNKNOWN = 'unknown',
}

/**
 * Supported image extensions
 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg'] as const;

/**
 * Generator for PDF file extensions with random casing
 */
export const pdfExtensionArb = fc.constantFrom('pdf', 'PDF', 'Pdf', 'pDf', 'pdF');

/**
 * Generator for image file extensions with random casing
 */
export const imageExtensionArb = fc.oneof(
  ...IMAGE_EXTENSIONS.map(ext =>
    fc.constantFrom(
      ext,
      ext.toUpperCase(),
      ext.charAt(0).toUpperCase() + ext.slice(1)
    )
  )
);

/**
 * Generator for unsupported file extensions
 */
export const unsupportedExtensionArb = fc.constantFrom(
  'doc',
  'docx',
  'txt',
  'zip',
  'mp4',
  'mp3'
);

/**
 * Generator for valid filenames (without extension)
 */
export const filenameArb = fc
  .stringMatching(/^[a-zA-Z0-9_-]+$/)
  .filter(s => s.length > 0 && s.length < 50);

/**
 * Generator for document URLs with PDF extension
 */
export const pdfUrlArb = fc
  .tuple(
    fc.constantFrom('/public/', '/documents/', '/uploads/', 'https://example.com/'),
    filenameArb,
    pdfExtensionArb
  )
  .map(([path, name, ext]) => `${path}${name}.${ext}`);

/**
 * Generator for document URLs with image extension
 */
export const imageUrlArb = fc
  .tuple(
    fc.constantFrom('/public/', '/images/', '/uploads/', 'https://example.com/'),
    filenameArb,
    imageExtensionArb
  )
  .map(([path, name, ext]) => `${path}${name}.${ext}`);

/**
 * Generator for document URLs with unsupported extension
 */
export const unsupportedUrlArb = fc
  .tuple(
    fc.constantFrom('/public/', '/documents/', '/uploads/'),
    filenameArb,
    unsupportedExtensionArb
  )
  .map(([path, name, ext]) => `${path}${name}.${ext}`);

/**
 * Generator for any valid document URL (PDF or image)
 */
export const validDocumentUrlArb = fc.oneof(pdfUrlArb, imageUrlArb);

/**
 * Generator for any document URL (including unsupported types)
 */
export const anyDocumentUrlArb = fc.oneof(
  pdfUrlArb,
  imageUrlArb,
  unsupportedUrlArb
);

/**
 * Generator for document filenames with extension
 */
export const documentFilenameArb = fc
  .tuple(filenameArb, fc.oneof(pdfExtensionArb, imageExtensionArb))
  .map(([name, ext]) => `${name}.${ext}`);

/**
 * Generator for error messages
 */
export const errorMessageArb = fc.constantFrom(
  'Failed to load document',
  'Network error',
  'Document not found',
  'Access denied',
  'Invalid document format',
  'CORS error'
);

/**
 * Generator for null or undefined values
 */
export const nullishArb = fc.constantFrom(null, undefined);

/**
 * Generator for invalid URLs (null, undefined, or malformed)
 */
export const invalidUrlArb = fc.oneof(
  nullishArb,
  fc.constant(''),
  fc.constant('not-a-url'),
  fc.constant('://malformed')
);

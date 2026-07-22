import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDocumentType, DocumentType } from './documentType';
import { pdfUrlArb, imageUrlArb, unsupportedUrlArb } from '../test/generators';

describe('getDocumentType', () => {
  describe('PDF detection', () => {
    it('should detect lowercase .pdf extension', () => {
      expect(getDocumentType('/documents/file.pdf')).toBe(DocumentType.PDF);
    });

    it('should detect uppercase .PDF extension', () => {
      expect(getDocumentType('/documents/file.PDF')).toBe(DocumentType.PDF);
    });

    it('should detect mixed case .Pdf extension', () => {
      expect(getDocumentType('/documents/file.Pdf')).toBe(DocumentType.PDF);
    });
  });

  describe('Image detection', () => {
    it('should detect .jpg extension', () => {
      expect(getDocumentType('/images/photo.jpg')).toBe(DocumentType.IMAGE);
    });

    it('should detect .jpeg extension', () => {
      expect(getDocumentType('/images/photo.jpeg')).toBe(DocumentType.IMAGE);
    });

    it('should detect .png extension', () => {
      expect(getDocumentType('/images/photo.png')).toBe(DocumentType.IMAGE);
    });

    it('should detect .gif extension', () => {
      expect(getDocumentType('/images/photo.gif')).toBe(DocumentType.IMAGE);
    });

    it('should detect .svg extension', () => {
      expect(getDocumentType('/images/photo.svg')).toBe(DocumentType.IMAGE);
    });

    it('should detect uppercase image extensions', () => {
      expect(getDocumentType('/images/photo.JPG')).toBe(DocumentType.IMAGE);
      expect(getDocumentType('/images/photo.PNG')).toBe(DocumentType.IMAGE);
    });
  });

  describe('Unknown type detection', () => {
    it('should return UNKNOWN for unsupported extensions', () => {
      expect(getDocumentType('/files/document.doc')).toBe(DocumentType.UNKNOWN);
      expect(getDocumentType('/files/document.txt')).toBe(DocumentType.UNKNOWN);
      expect(getDocumentType('/files/video.mp4')).toBe(DocumentType.UNKNOWN);
    });

    it('should return UNKNOWN for URLs without extensions', () => {
      expect(getDocumentType('/files/document')).toBe(DocumentType.UNKNOWN);
    });
  });

  describe('Filename parameter (for blob URLs)', () => {
    it('should detect PDF type from filename when URL has no extension', () => {
      expect(getDocumentType('blob:http://localhost:3000/abc123', 'document.pdf')).toBe(DocumentType.PDF);
    });

    it('should detect IMAGE type from filename when URL has no extension', () => {
      expect(getDocumentType('blob:http://localhost:3000/xyz789', 'photo.jpg')).toBe(DocumentType.IMAGE);
      expect(getDocumentType('blob:http://localhost:3000/xyz789', 'photo.png')).toBe(DocumentType.IMAGE);
    });

    it('should prioritize filename over URL extension', () => {
      expect(getDocumentType('/wrong/path.txt', 'correct.pdf')).toBe(DocumentType.PDF);
    });

    it('should handle uppercase extensions in filename', () => {
      expect(getDocumentType('blob:http://localhost:3000/abc', 'Document.PDF')).toBe(DocumentType.PDF);
      expect(getDocumentType('blob:http://localhost:3000/xyz', 'Photo.JPG')).toBe(DocumentType.IMAGE);
    });
  });
});

describe('Property-Based Tests', () => {
  describe('Property 1: Document Type Detection', () => {
    it('should detect PDF type for any PDF URL with various casings', () => {
      fc.assert(
        fc.property(pdfUrlArb, (url) => {
          const type = getDocumentType(url);
          return type === DocumentType.PDF;
        }),
        { numRuns: 100 }
      );
    });

    it('should detect IMAGE type for any image URL with various extensions and casings', () => {
      fc.assert(
        fc.property(imageUrlArb, (url) => {
          const type = getDocumentType(url);
          return type === DocumentType.IMAGE;
        }),
        { numRuns: 100 }
      );
    });

    it('should detect UNKNOWN type for any unsupported URL', () => {
      fc.assert(
        fc.property(unsupportedUrlArb, (url) => {
          const type = getDocumentType(url);
          return type === DocumentType.UNKNOWN;
        }),
        { numRuns: 100 }
      );
    });
  });
});

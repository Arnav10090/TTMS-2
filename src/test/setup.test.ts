import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  pdfUrlArb,
  imageUrlArb,
  validDocumentUrlArb,
  documentFilenameArb,
  errorMessageArb,
} from './generators';

describe('Testing Infrastructure', () => {
  it('should have vitest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      })
    );
  });

  it('should generate valid PDF URLs', () => {
    fc.assert(
      fc.property(pdfUrlArb, (url) => {
        return url.toLowerCase().endsWith('.pdf');
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid image URLs', () => {
    fc.assert(
      fc.property(imageUrlArb, (url) => {
        const lowerUrl = url.toLowerCase();
        return (
          lowerUrl.endsWith('.jpg') ||
          lowerUrl.endsWith('.jpeg') ||
          lowerUrl.endsWith('.png') ||
          lowerUrl.endsWith('.gif') ||
          lowerUrl.endsWith('.svg')
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid document URLs', () => {
    fc.assert(
      fc.property(validDocumentUrlArb, (url) => {
        return typeof url === 'string' && url.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid document filenames', () => {
    fc.assert(
      fc.property(documentFilenameArb, (filename) => {
        return filename.includes('.') && filename.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should generate error messages', () => {
    fc.assert(
      fc.property(errorMessageArb, (message) => {
        return typeof message === 'string' && message.length > 0;
      }),
      { numRuns: 100 }
    );
  });
});

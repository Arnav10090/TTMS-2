# Testing Infrastructure

This directory contains the testing infrastructure and utilities for the document preview feature.

## Files

### setup.ts
Test setup file that configures the testing environment:
- Imports `@testing-library/jest-dom` for DOM matchers
- Configures automatic cleanup after each test
- Referenced in `vite.config.ts` as the setupFiles

### utils.tsx
Custom render utilities for testing React components:
- `renderWithProviders`: Wrapper function for rendering components with necessary providers
- Re-exports all React Testing Library utilities for convenience
- Use this instead of importing directly from `@testing-library/react`

### generators.ts
Property-based testing generators using fast-check:
- **Document Type Generators**:
  - `pdfUrlArb`: Generates PDF URLs with various casings
  - `imageUrlArb`: Generates image URLs (jpg, jpeg, png, gif, svg)
  - `unsupportedUrlArb`: Generates URLs with unsupported extensions
  - `validDocumentUrlArb`: Generates any valid document URL (PDF or image)
  - `anyDocumentUrlArb`: Generates any document URL including unsupported types

- **Filename Generators**:
  - `filenameArb`: Generates valid filenames without extensions
  - `documentFilenameArb`: Generates complete document filenames with extensions

- **Error Generators**:
  - `errorMessageArb`: Generates realistic error messages
  - `invalidUrlArb`: Generates null, undefined, or malformed URLs

- **Extension Generators**:
  - `pdfExtensionArb`: PDF extensions with various casings
  - `imageExtensionArb`: Image extensions with various casings
  - `unsupportedExtensionArb`: Unsupported file extensions

### setup.test.ts
Verification tests for the testing infrastructure:
- Validates vitest configuration
- Validates fast-check integration
- Tests all generators to ensure they produce valid data

## Usage

### Unit Testing

```typescript
import { render, screen } from '@/test/utils';
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Property-Based Testing

```typescript
import * as fc from 'fast-check';
import { pdfUrlArb, imageUrlArb } from '@/test/generators';
import { describe, it } from 'vitest';

describe('Document Type Detection', () => {
  it('should detect PDF documents', () => {
    fc.assert(
      fc.property(pdfUrlArb, (url) => {
        const type = getDocumentType(url);
        return type === DocumentType.PDF;
      }),
      { numRuns: 100 }
    );
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/test/setup.test.ts
```

## Configuration

Test configuration is located in `vite.config.ts`:
- Environment: jsdom (for DOM testing)
- Setup file: `./src/test/setup.ts`
- Coverage provider: v8
- Globals: enabled (no need to import describe, it, expect)

## Dependencies

- **vitest**: Test runner
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **fast-check**: Property-based testing library
- **@fast-check/vitest**: Vitest integration for fast-check
- **jsdom**: DOM implementation for Node.js

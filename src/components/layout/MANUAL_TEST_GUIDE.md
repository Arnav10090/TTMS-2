# Manual Testing Guide for Layout Components

This guide provides instructions for manually testing the RootLayout and ContentWrapper components, particularly the ResizeObserver functionality.

## Prerequisites

- Development server running (`npm run dev`)
- Browser DevTools open (F12)

## Test 1: Verify RootLayout Structure

### Steps:
1. Navigate to any page in the application
2. Open DevTools and inspect the DOM structure
3. Look for the following elements:
   - `<div class="root-layout" data-testid="root-layout">`
   - `<div class="header-fixed" data-testid="root-layout-header">`
   - `<div class="content-wrapper" data-testid="content-wrapper">`
   - `<div class="footer-fixed" data-testid="root-layout-footer">`

### Expected Results:
- All four elements should be present
- They should be in the correct hierarchical order (header → content → footer)
- Header and footer should have fixed positioning classes

## Test 2: Verify CSS Custom Properties

### Steps:
1. Open DevTools Console
2. Run the following commands:
   ```javascript
   // Check header height
   getComputedStyle(document.documentElement).getPropertyValue('--header-height')
   
   // Check footer height
   getComputedStyle(document.documentElement).getPropertyValue('--footer-height')
   ```

### Expected Results:
- `--header-height` should return a value (e.g., "64px" or similar)
- `--footer-height` should return a value (e.g., "80px" or similar)
- Values should match the actual rendered heights of header and footer

## Test 3: Verify ResizeObserver Functionality (Header)

### Steps:
1. Open DevTools Console
2. Note the current `--header-height` value:
   ```javascript
   console.log('Initial header height:', getComputedStyle(document.documentElement).getPropertyValue('--header-height'))
   ```
3. Open DevTools Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)
4. Change the viewport width to trigger responsive design changes
5. Check the header height again:
   ```javascript
   console.log('Updated header height:', getComputedStyle(document.documentElement).getPropertyValue('--header-height'))
   ```

### Expected Results:
- The `--header-height` CSS custom property should update automatically when the header size changes
- The content area padding should adjust accordingly (no overlap with header)

## Test 4: Verify ResizeObserver Functionality (Footer)

### Steps:
1. Navigate to any page with the SystemAlertsBanner visible
2. Open DevTools Console
3. Note the current `--footer-height` value:
   ```javascript
   console.log('Initial footer height:', getComputedStyle(document.documentElement).getPropertyValue('--footer-height'))
   ```
4. Click the toggle button on the SystemAlertsBanner to expand/collapse it
5. Check the footer height again:
   ```javascript
   console.log('Updated footer height:', getComputedStyle(document.documentElement).getPropertyValue('--footer-height'))
   ```

### Expected Results:
- The `--footer-height` CSS custom property should update when the banner expands/collapses
- The content area padding should adjust accordingly (no overlap with footer)

## Test 5: Verify ContentWrapper Spacing

### Steps:
1. Open DevTools and inspect the content wrapper element
2. Check the computed styles for:
   - `padding-top`
   - `padding-bottom`
   - `min-height`

### Expected Results:
- `padding-top` should equal the header height (from `--header-height`)
- `padding-bottom` should equal the footer height (from `--footer-height`)
- `min-height` should be `100vh`
- Content should never be hidden behind header or footer

## Test 6: Verify Layout Persistence During Navigation

### Steps:
1. Open DevTools Console
2. Add a unique identifier to the header:
   ```javascript
   document.querySelector('[data-testid="root-layout-header"]').setAttribute('data-test-id', 'unique-' + Date.now())
   ```
3. Note the unique ID
4. Navigate to different pages (TTMS → PTMS, different routes)
5. Check if the header still has the same unique ID:
   ```javascript
   document.querySelector('[data-testid="root-layout-header"]').getAttribute('data-test-id')
   ```

### Expected Results:
- The header should maintain the same unique ID across all route transitions
- This confirms the header is not being unmounted/remounted

## Test 7: Visual Inspection

### Steps:
1. Navigate through different pages in the application
2. Observe the header and footer during transitions
3. Look for any:
   - Flickering
   - Layout shifts
   - Content jumping
   - Overlapping content

### Expected Results:
- No visible flickering during page transitions
- Header and footer remain stable and fixed
- Content never overlaps with header or footer
- Smooth, professional transitions

## Test 8: Browser Compatibility

### Steps:
1. Test in Chrome, Firefox, Safari, and Edge
2. Repeat Tests 1-7 in each browser
3. Note any differences in behavior

### Expected Results:
- Consistent behavior across all browsers
- ResizeObserver should work in all modern browsers
- CSS custom properties should be supported

## Troubleshooting

### Issue: CSS custom properties not updating
**Solution:** Check if ResizeObserver is supported in your browser. Open console and run:
```javascript
console.log('ResizeObserver supported:', typeof ResizeObserver !== 'undefined')
```

### Issue: Content overlapping with header/footer
**Solution:** Check if the CSS custom properties are being set correctly:
```javascript
console.log('Header height:', getComputedStyle(document.documentElement).getPropertyValue('--header-height'))
console.log('Footer height:', getComputedStyle(document.documentElement).getPropertyValue('--footer-height'))
```

### Issue: Layout components remounting on navigation
**Solution:** Verify that RootLayout is wrapping the Routes component in App.tsx, not inside individual route components.

## Automated Test Verification

To verify all automated tests pass:

```bash
npm test -- src/components/layout/RootLayout.test.tsx src/components/layout/ContentWrapper.test.tsx
```

All tests should pass with no failures.

# Modern UI Design System

A comprehensive, modern component library built for the Steel Manufacturing ERP system. This library provides Procore-inspired, professional UI components that maintain full compatibility with existing Material-UI functionality while offering enhanced styling and user experience.

## Features

- **Modern Design**: Clean, professional aesthetics inspired by Procore
- **Full Compatibility**: Maintains 100% compatibility with existing Material-UI components
- **Type Safety**: Complete TypeScript support with comprehensive type definitions
- **Accessibility**: WCAG 2.1 AA compliant components
- **Testing**: Property-based testing with fast-check for reliability
- **Responsive**: Mobile-first design with responsive breakpoints
- **Theme Integration**: Seamless integration with Material-UI theme system
- **CSS-in-JS**: Built with styled-components for maintainable styling

## Components

### ModernButton

A comprehensive button component with multiple variants, sizes, and states.

#### Variants
- `primary` - Main action button with solid background
- `secondary` - Secondary action with outlined style
- `tertiary` - Subtle action button
- `ghost` - Minimal styling for less prominent actions
- `danger` - For destructive actions

#### Sizes
- `small` - Compact button for tight spaces
- `medium` - Default size for most use cases
- `large` - Prominent button for important actions

#### Features
- Loading states with spinner
- Icon support (start and end icons)
- Disabled states
- Full width option
- Link rendering with href prop
- Keyboard navigation support
- Screen reader compatibility

#### Usage

```tsx
import { ModernButton } from '@/components/modern';

// Basic usage
<ModernButton variant="primary">Click me</ModernButton>

// With icons
<ModernButton 
  variant="secondary" 
  startIcon={<PlayIcon />}
  onClick={handleClick}
>
  Play Video
</ModernButton>

// Loading state
<ModernButton 
  variant="primary" 
  loading={isLoading}
  onClick={handleSubmit}
>
  Submit
</ModernButton>

// As a link
<ModernButton 
  variant="tertiary" 
  href="/dashboard"
>
  Go to Dashboard
</ModernButton>
```

## Design Tokens

The design system is built on a comprehensive set of design tokens:

### Colors
- **Primary**: Professional blue-gray palette
- **Secondary**: Warm orange accent colors
- **Semantic**: Success, warning, error, and info colors
- **Neutral**: Grayscale palette for text and backgrounds

### Typography
- **Font Family**: Inter for primary text, JetBrains Mono for code
- **Font Sizes**: 8-level scale from xs (12px) to 4xl (36px)
- **Font Weights**: Light, normal, medium, semibold, bold
- **Line Heights**: Tight, normal, relaxed

### Spacing
- **Base Unit**: 4px for consistent spacing
- **Scale**: 0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

### Shadows
- **Elevation System**: None, sm, base, md, lg, xl
- **Consistent Depth**: Subtle shadows for modern appearance

### Border Radius
- **Rounded Corners**: None, sm (2px), base (4px), md (6px), lg (8px), xl (12px), full (9999px)

## Testing

The component library includes comprehensive testing:

### Unit Tests
- Component rendering with different props
- Event handling and user interactions
- State management and prop validation
- Accessibility compliance

### Property-Based Tests
- **Functional Interface Preservation**: Ensures all existing functionality works
- **Interactive State Feedback**: Validates hover, focus, and active states
- **Theme Consistency**: Verifies design token adherence
- **Cross-browser Compatibility**: Tests across different environments

### Running Tests

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- ModernButton.test.tsx

# Run with coverage
npm test -- --coverage
```

## Theme Integration

The modern components integrate seamlessly with Material-UI themes:

```tsx
import { ThemeProvider } from '@mui/material/styles';
import { modernTheme } from '@/theme/modernTheme';
import { ModernButton } from '@/components/modern';

function App() {
  return (
    <ThemeProvider theme={modernTheme}>
      <ModernButton variant="primary">
        Themed Button
      </ModernButton>
    </ThemeProvider>
  );
}
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Management**: Visible focus indicators
- **Touch Targets**: Minimum 44px touch targets

## Performance

The component library is optimized for performance:

- **Tree Shaking**: Import only what you need
- **CSS-in-JS**: Efficient runtime styling
- **Bundle Size**: Minimal impact on application size
- **Render Performance**: Optimized for fast rendering

## Migration Guide

### From Material-UI Button to ModernButton

```tsx
// Before (Material-UI)
import { Button } from '@mui/material';
<Button variant="contained" color="primary">
  Click me
</Button>

// After (Modern UI)
import { ModernButton } from '@/components/modern';
<ModernButton variant="primary">
  Click me
</ModernButton>
```

### Prop Mapping
- `variant="contained"` → `variant="primary"`
- `variant="outlined"` → `variant="secondary"`
- `variant="text"` → `variant="tertiary"`
- `color="primary"` → `variant="primary"`
- `color="secondary"` → `variant="secondary"`

## Development

### Adding New Components

1. Create component directory in `src/components/modern/`
2. Implement component with TypeScript interfaces
3. Add comprehensive tests (unit + property-based)
4. Update main index.ts export
5. Add to demo component
6. Update documentation

### Design Token Updates

1. Modify `designTokens.ts` for new tokens
2. Update `modernTheme.ts` for Material-UI integration
3. Update component utilities in `utils.ts`
4. Run tests to ensure compatibility
5. Update documentation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow existing code patterns and conventions
2. Write comprehensive tests for new components
3. Ensure accessibility compliance
4. Update documentation and examples
5. Test across supported browsers

## License

This component library is part of the Steel Manufacturing ERP system and follows the same licensing terms.
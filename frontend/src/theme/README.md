# Modern Design System

A comprehensive, Procore-inspired design system built with Material-UI and styled-components for the Steel Manufacturing ERP application.

## Overview

This design system provides a modern, professional, and consistent visual language across the entire application while maintaining 100% backward compatibility with existing functionality.

## Features

- **Procore-inspired Design**: Clean, compact, and professional styling
- **Comprehensive Design Tokens**: Colors, typography, spacing, shadows, and border radius
- **Dual Theme Support**: Light and dark mode with smooth transitions
- **Material-UI Integration**: Enhanced Material-UI components with custom styling
- **Styled-Components Support**: Full integration with styled-components for custom components
- **TypeScript Support**: Fully typed design tokens and theme interfaces
- **Responsive Design**: Mobile-first approach with consistent breakpoints

## Design Tokens

### Colors

#### Primary (Professional Blue-Gray)
- **Primary 500**: `#64748b` (Base)
- **Primary 600**: `#475569` (Material-UI main)
- **Primary 700**: `#334155` (Dark variant)

#### Secondary (Warm Orange)
- **Secondary 500**: `#f97316` (Base)
- **Secondary 600**: `#ea580c` (Material-UI main)

#### Semantic Colors
- **Success**: Green scale for positive actions
- **Warning**: Yellow/Orange scale for caution
- **Error**: Red scale for errors and destructive actions
- **Info**: Blue scale for informational content

### Typography

- **Primary Font**: Inter (Modern, clean, professional)
- **Monospace Font**: JetBrains Mono (For code and data)
- **Font Sizes**: xs (12px) to 4xl (36px)
- **Font Weights**: Light (300) to Bold (700)

### Spacing

Based on a 4px grid system:
- **Base Unit**: 4px
- **Scale**: 0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

### Shadows

Subtle elevation system:
- **sm**: Subtle shadow for cards
- **md**: Medium shadow for elevated elements
- **lg**: Large shadow for modals and overlays

## Usage

### Basic Setup

The theme is automatically applied when you wrap your app with `ModernThemeProvider`:

```tsx
import { ModernThemeProvider } from './theme';

function App() {
  return (
    <ModernThemeProvider defaultMode="light">
      {/* Your app content */}
    </ModernThemeProvider>
  );
}
```

### Using Design Tokens in Styled Components

```tsx
import styled from 'styled-components';
import { getColor, getSpacing, getShadow } from './theme';

const StyledCard = styled.div`
  background: ${getColor('neutral.white')};
  padding: ${getSpacing(4)};
  border-radius: ${getBorderRadius('lg')};
  box-shadow: ${getShadow('md')};
  
  &:hover {
    box-shadow: ${getShadow('lg')};
  }
`;
```

### Using Theme Context

```tsx
import { useModernTheme } from './theme';

function ThemeToggle() {
  const { mode, toggleTheme } = useModernTheme();
  
  return (
    <button onClick={toggleTheme}>
      Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}
```

### Accessing Design Tokens in Material-UI Components

```tsx
import { useTheme } from '@mui/material/styles';

function CustomComponent() {
  const theme = useTheme();
  const primaryColor = theme.custom.colors.primary[600];
  const spacing = theme.custom.spacing[4];
  
  return (
    <div style={{ color: primaryColor, padding: spacing }}>
      Content with theme tokens
    </div>
  );
}
```

## Responsive Design

Use the provided breakpoints and media query helpers:

```tsx
import styled from 'styled-components';
import { mediaQuery } from './theme';

const ResponsiveContainer = styled.div`
  padding: 1rem;
  
  ${mediaQuery.md`
    padding: 2rem;
  `}
  
  ${mediaQuery.lg`
    padding: 3rem;
  `}
`;
```

## Component Variants

The design system includes predefined component variants:

### Buttons
- **Primary**: Main call-to-action buttons
- **Secondary**: Secondary actions
- **Tertiary**: Subtle actions
- **Ghost**: Minimal styling
- **Danger**: Destructive actions

### Cards
- **Elevated**: Default card with shadow
- **Outlined**: Card with border, no shadow
- **Flat**: Minimal card styling

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Follow the spacing scale** for consistent layouts
3. **Use semantic colors** for status and actions
4. **Test in both light and dark modes**
5. **Ensure accessibility** with proper contrast ratios
6. **Use responsive breakpoints** for mobile-friendly designs

## Migration from Old Theme

The new theme system is designed to be backward compatible. Existing Material-UI components will automatically use the new styling, while custom components can gradually adopt the new design tokens.

## File Structure

```
src/theme/
├── designTokens.ts      # Core design tokens
├── modernTheme.ts       # Material-UI theme configuration
├── ThemeContext.tsx     # Theme provider and context
├── StyledThemeProvider.tsx # Styled-components integration
├── utils.ts            # Theme utility functions
├── index.ts            # Main exports
└── __tests__/          # Theme tests
```

## Testing

The theme system includes comprehensive tests to ensure:
- Design tokens are properly defined
- Theme integration works correctly
- Components render with theme providers
- Color contrast meets accessibility standards

Run theme tests:
```bash
npm test theme.test.tsx
```

## Future Enhancements

- Component-specific design tokens
- Animation and transition tokens
- Advanced responsive utilities
- Theme customization tools
- Design system documentation site
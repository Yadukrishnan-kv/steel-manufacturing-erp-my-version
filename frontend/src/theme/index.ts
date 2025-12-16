/**
 * Theme System Exports
 * Central export point for all theme-related functionality
 */

// Design tokens and theme creation
export { designTokens } from './designTokens';
export type { DesignTokens, ColorScale, SemanticColors, NeutralColors, SpacingKey } from './designTokens';

// Modern theme
export { createModernTheme, modernTheme, modernDarkTheme } from './modernTheme';

// Theme providers and context
export { ModernThemeProvider, useModernTheme } from './ThemeContext';
export { ModernStyledThemeProvider } from './StyledThemeProvider';
export type { StyledTheme } from './StyledThemeProvider';

// Theme utilities
export {
  getColor,
  getSpacing,
  getFontSize,
  getFontWeight,
  getFontFamily,
  getShadow,
  getBorderRadius,
  breakpoints,
  mediaQuery,
  flexCenter,
  flexBetween,
  truncateText,
  visuallyHidden,
} from './utils';
/**
 * Theme System Exports - Customer Portal
 * Central export point for all theme-related functionality
 */

// Design tokens and theme creation
export { designTokens } from './designTokens';
export type { DesignTokens, ColorScale, SemanticColors, NeutralColors, SpacingKey } from './designTokens';

// Modern theme
export { createCustomerPortalTheme, customerPortalTheme, customerPortalDarkTheme } from './modernTheme';
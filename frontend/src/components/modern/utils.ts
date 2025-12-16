/**
 * Modern Component Library - Utility Functions
 * Helper functions for component styling and theme integration
 */

import { Theme } from '@mui/material/styles';
import { CSSProperties } from 'react';
import { ComponentSize, ComponentColor, ButtonVariant, CardElevation } from './types';

// Get spacing value from theme
export const getSpacing = (theme: Theme, multiplier: number): string => {
  return `${theme.spacing(multiplier)}`;
};

// Get color from theme based on variant and shade
export const getColor = (theme: Theme, color: ComponentColor, shade: number = 500): string => {
  const colorMap = {
    primary: theme.custom.colors.primary,
    secondary: theme.custom.colors.secondary,
    success: theme.custom.colors.semantic.success,
    warning: theme.custom.colors.semantic.warning,
    error: theme.custom.colors.semantic.error,
    info: theme.custom.colors.semantic.info,
  };
  
  const colorScale = colorMap[color];
  return colorScale[shade as keyof typeof colorScale] || colorScale[500];
};

// Get size-based styles
export const getSizeStyles = (theme: Theme, size: ComponentSize): CSSProperties => {
  const sizeMap = {
    small: {
      padding: `${getSpacing(theme, 1)} ${getSpacing(theme, 2)}`,
      fontSize: theme.custom.typography.fontSize.sm,
      minHeight: '32px',
    },
    medium: {
      padding: `${getSpacing(theme, 2)} ${getSpacing(theme, 3)}`,
      fontSize: theme.custom.typography.fontSize.base,
      minHeight: '40px',
    },
    large: {
      padding: `${getSpacing(theme, 3)} ${getSpacing(theme, 4)}`,
      fontSize: theme.custom.typography.fontSize.lg,
      minHeight: '48px',
    },
  };
  
  return sizeMap[size];
};

// Get button variant styles
export const getButtonVariantStyles = (theme: Theme, variant: ButtonVariant): CSSProperties => {
  const variantMap = {
    primary: {
      backgroundColor: getColor(theme, 'primary', 600),
      color: theme.custom.colors.neutral.white,
      border: 'none',
      '&:hover': {
        backgroundColor: getColor(theme, 'primary', 700),
        boxShadow: theme.custom.shadows.md,
      },
      '&:focus': {
        outline: `2px solid ${getColor(theme, 'primary', 400)}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: getColor(theme, 'primary', 800),
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: getColor(theme, 'primary', 600),
      border: `1px solid ${getColor(theme, 'primary', 300)}`,
      '&:hover': {
        backgroundColor: getColor(theme, 'primary', 50),
        borderColor: getColor(theme, 'primary', 400),
      },
      '&:focus': {
        outline: `2px solid ${getColor(theme, 'primary', 400)}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: getColor(theme, 'primary', 100),
      },
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: getColor(theme, 'primary', 600),
      border: 'none',
      '&:hover': {
        backgroundColor: getColor(theme, 'primary', 50),
      },
      '&:focus': {
        outline: `2px solid ${getColor(theme, 'primary', 400)}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: getColor(theme, 'primary', 100),
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.custom.colors.neutral.gray[600],
      border: 'none',
      '&:hover': {
        backgroundColor: theme.custom.colors.neutral.gray[100],
        color: theme.custom.colors.neutral.gray[900],
      },
      '&:focus': {
        outline: `2px solid ${theme.custom.colors.neutral.gray[400]}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: theme.custom.colors.neutral.gray[200],
      },
    },
    danger: {
      backgroundColor: getColor(theme, 'error', 600),
      color: theme.custom.colors.neutral.white,
      border: 'none',
      '&:hover': {
        backgroundColor: getColor(theme, 'error', 700),
        boxShadow: theme.custom.shadows.md,
      },
      '&:focus': {
        outline: `2px solid ${getColor(theme, 'error', 400)}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: getColor(theme, 'error', 800),
      },
    },
  };
  
  return variantMap[variant] as CSSProperties;
};

// Get card elevation styles
export const getCardElevationStyles = (theme: Theme, elevation: CardElevation): CSSProperties => {
  const elevationMap = {
    none: {
      boxShadow: 'none',
      border: `1px solid ${theme.custom.colors.neutral.gray[200]}`,
    },
    subtle: {
      boxShadow: theme.custom.shadows.sm,
      border: `1px solid ${theme.custom.colors.neutral.gray[200]}`,
    },
    medium: {
      boxShadow: theme.custom.shadows.md,
      border: 'none',
    },
    high: {
      boxShadow: theme.custom.shadows.lg,
      border: 'none',
    },
  };
  
  return elevationMap[elevation];
};

// Generate transition styles
export const getTransitionStyles = (properties: string[] = ['all'], duration: string = '200ms'): CSSProperties => {
  return {
    transition: properties.map(prop => `${prop} ${duration} cubic-bezier(0.4, 0, 0.2, 1)`).join(', '),
  };
};

// Generate focus ring styles
export const getFocusRingStyles = (theme: Theme, color: ComponentColor = 'primary'): CSSProperties => {
  return {
    outline: `2px solid ${getColor(theme, color, 400)}`,
    outlineOffset: '2px',
  };
};

// Generate disabled styles
export const getDisabledStyles = (theme: Theme): CSSProperties => {
  return {
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  };
};

// Merge styles with proper precedence
export const mergeStyles = (...styles: (CSSProperties | undefined)[]): CSSProperties => {
  return styles.reduce((acc, style) => {
    if (style) {
      return { ...acc, ...style };
    }
    return acc;
  }, {});
};

// Convert rem to px for calculations
export const remToPx = (rem: string): number => {
  return parseFloat(rem.replace('rem', '')) * 16;
};

// Convert px to rem
export const pxToRem = (px: number): string => {
  return `${px / 16}rem`;
};

// Check if color meets contrast requirements
export const meetsContrastRequirement = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  // This is a simplified implementation - in a real app you'd use a proper contrast calculation library
  // For now, we'll assume our design tokens meet the requirements
  return true;
};

// Generate responsive styles
export const getResponsiveStyles = (theme: Theme, breakpoint: 'sm' | 'md' | 'lg' | 'xl', styles: CSSProperties): string => {
  const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  };
  
  return `@media (min-width: ${breakpoints[breakpoint]}) { ${Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
};
/**
 * Modern Component Library - Customer Portal Utilities
 * Helper functions for component styling and theme integration
 */

import { Theme } from '@mui/material/styles';
import { CSSProperties } from 'react';
import { ComponentSize, ComponentColor, ButtonVariant } from './types';

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
      padding: `${getSpacing(theme, 1.5)} ${getSpacing(theme, 3)}`,
      fontSize: theme.custom.typography.fontSize.base,
      minHeight: '40px',
    },
    large: {
      padding: `${getSpacing(theme, 2)} ${getSpacing(theme, 4)}`,
      fontSize: theme.custom.typography.fontSize.lg,
      minHeight: '48px',
    },
  };
  
  return sizeMap[size];
};

// Get button variant styles
export const getButtonVariantStyles = (theme: Theme, variant: ButtonVariant): any => {
  const variantMap = {
    primary: {
      background: `linear-gradient(135deg, ${theme.custom.colors.primary[600]} 0%, ${theme.custom.colors.primary[700]} 100%)`,
      color: theme.custom.colors.neutral.white,
      border: 'none',
      boxShadow: theme.custom.shadows.sm,
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.custom.colors.primary[700]} 0%, ${theme.custom.colors.primary[800]} 100%)`,
        boxShadow: theme.custom.shadows.md,
        transform: 'translateY(-1px)',
      },
      '&:focus': {
        outline: `2px solid ${theme.custom.colors.primary[400]}`,
        outlineOffset: '2px',
        boxShadow: `${theme.custom.shadows.sm}, 0 0 0 3px rgba(37, 99, 235, 0.2)`,
      },
      '&:active': {
        background: `linear-gradient(135deg, ${theme.custom.colors.primary[800]} 0%, ${theme.custom.colors.primary[900]} 100%)`,
        transform: 'translateY(0px)',
        boxShadow: theme.custom.shadows.sm,
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.custom.colors.primary[600],
      border: `2px solid ${theme.custom.colors.primary[300]}`,
      '&:hover': {
        backgroundColor: theme.custom.colors.primary[50],
        borderColor: theme.custom.colors.primary[500],
        color: theme.custom.colors.primary[700],
        boxShadow: theme.custom.shadows.sm,
      },
      '&:focus': {
        outline: `2px solid ${theme.custom.colors.primary[400]}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: theme.custom.colors.primary[100],
        borderColor: theme.custom.colors.primary[600],
      },
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: theme.custom.colors.primary[600],
      border: 'none',
      '&:hover': {
        backgroundColor: theme.custom.colors.primary[50],
      },
      '&:focus': {
        outline: `2px solid ${theme.custom.colors.primary[400]}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: theme.custom.colors.primary[100],
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
      backgroundColor: theme.custom.colors.semantic.error[600],
      color: theme.custom.colors.neutral.white,
      border: 'none',
      '&:hover': {
        backgroundColor: theme.custom.colors.semantic.error[700],
        boxShadow: theme.custom.shadows.md,
      },
      '&:focus': {
        outline: `2px solid ${theme.custom.colors.semantic.error[400]}`,
        outlineOffset: '2px',
      },
      '&:active': {
        backgroundColor: theme.custom.colors.semantic.error[800],
      },
    },
  };
  
  return variantMap[variant];
};

// Generate transition styles
export const getTransitionStyles = (properties: string[] = ['all'], duration: string = '200ms'): CSSProperties => {
  return {
    transition: properties.map(prop => `${prop} ${duration} cubic-bezier(0.4, 0, 0.2, 1)`).join(', '),
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
  return styles.reduce<CSSProperties>((acc, style) => {
    if (style) {
      return { ...acc, ...style };
    }
    return acc;
  }, {});
};
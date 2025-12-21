/**
 * Modern Component Library - Customer Portal Types
 * Defines the foundational types for the modern component system
 */

import { CSSProperties, ReactNode, MouseEvent } from 'react';
import { Theme } from '@mui/material/styles';

// Base component props that all modern components should support
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'data-testid'?: string;
}

// Theme-aware component props
export interface ThemedComponentProps extends BaseComponentProps {
  theme?: Theme;
}

// Component size variants
export type ComponentSize = 'small' | 'medium' | 'large';

// Component color variants
export type ComponentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Button specific types
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';

export interface ModernButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  color?: ComponentColor;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
}
/**
 * Modern Component Library - Base Types and Interfaces
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

// Interactive component states
export interface InteractiveStates {
  hover?: CSSProperties;
  focus?: CSSProperties;
  active?: CSSProperties;
  disabled?: CSSProperties;
}

// Component variant system
export interface ComponentVariant {
  base: CSSProperties;
  states: InteractiveStates;
}

// Size variants
export type ComponentSize = 'small' | 'medium' | 'large';

// Color variants
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

// Card component types
export type CardElevation = 'none' | 'subtle' | 'medium' | 'high';
export type CardVariant = 'outlined' | 'filled' | 'elevated';

export interface ModernCardProps extends BaseComponentProps {
  elevation?: CardElevation;
  variant?: CardVariant;
  padding?: ComponentSize;
  interactive?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

// Input component types
export type InputVariant = 'outlined' | 'filled' | 'underlined';

export interface ModernInputProps extends BaseComponentProps {
  variant?: InputVariant;
  size?: ComponentSize;
  error?: boolean;
  helperText?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// TextField component types (extends InputProps with additional features)
export interface ModernTextFieldProps extends ModernInputProps {
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  name?: string;
  id?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  pattern?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  maxLength?: number;
  minLength?: number;
}

// Layout component types
export interface ModernLayoutProps extends BaseComponentProps {
  direction?: 'row' | 'column';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

// Sidebar component types
export interface ModernSidebarProps extends BaseComponentProps {
  items: NavigationItem[];
  collapsed?: boolean;
  onItemClick?: (item: NavigationItem) => void;
  onToggleCollapse?: () => void;
  width?: number;
  collapsedWidth?: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  active?: boolean;
  disabled?: boolean;
  children?: NavigationItem[];
  badge?: string | number;
}

// Component style system
export interface ComponentStyles {
  [key: string]: ComponentVariant;
}

// Theme integration
export interface ModernThemeExtension {
  components: {
    ModernButton: ComponentStyles;
    ModernCard: ComponentStyles;
    ModernInput: ComponentStyles;
    ModernLayout: ComponentStyles;
    ModernSidebar: ComponentStyles;
  };
}
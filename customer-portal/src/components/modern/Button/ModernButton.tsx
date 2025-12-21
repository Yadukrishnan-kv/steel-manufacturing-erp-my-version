/**
 * Modern Button Component - Customer Portal
 * A comprehensive button component following the modern design system
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import { ModernButtonProps } from '../types';
import { 
  getSizeStyles, 
  getButtonVariantStyles, 
  getTransitionStyles, 
  getDisabledStyles,
} from '../utils';

// Styled button component with comprehensive styling
const StyledButton = styled.button<{
  $variant: ModernButtonProps['variant'];
  $size: ModernButtonProps['size'];
  $fullWidth: boolean;
  $disabled: boolean;
  $loading: boolean;
  theme: any;
}>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.custom.spacing[2]};
  border-radius: ${({ theme }) => theme.custom.borderRadius.lg};
  font-family: ${({ theme }) => theme.custom.typography.fontFamily.primary};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  text-decoration: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  /* Transitions */
  ${({ theme }) => {
    const transitions = getTransitionStyles(['background-color', 'border-color', 'box-shadow', 'transform'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  /* Size styles */
  ${({ theme, $size = 'medium' }) => {
    const sizeStyles = getSizeStyles(theme, $size);
    return Object.entries(sizeStyles).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  /* Variant styles */
  ${({ theme, $variant = 'primary' }) => {
    const variantStyles = getButtonVariantStyles(theme, $variant);
    return Object.entries(variantStyles).map(([key, value]) => {
      if (key.startsWith('&:')) return ''; // Skip pseudo-selectors for base styles
      return `${key}: ${value};`;
    }).join('\n  ');
  }}
  
  /* Full width */
  ${({ $fullWidth }) => $fullWidth && 'width: 100%;'}
  
  /* Disabled state */
  ${({ theme, $disabled, $loading }) => {
    if ($disabled || $loading) {
      const disabledStyles = getDisabledStyles(theme);
      return Object.entries(disabledStyles).map(([key, value]) => `${key}: ${value};`).join('\n  ');
    }
    return '';
  }}
  
  /* Hover state */
  &:hover:not(:disabled) {
    ${({ theme, $variant = 'primary' }) => {
      const variantStyles = getButtonVariantStyles(theme, $variant);
      const hoverKey = '&:hover' as keyof typeof variantStyles;
      const hoverStyles = variantStyles[hoverKey] as any;
      if (hoverStyles) {
        return Object.entries(hoverStyles).map(([key, value]) => `${key}: ${value};`).join('\n    ');
      }
      return '';
    }}
  }
  
  /* Focus state */
  &:focus-visible {
    ${({ theme, $variant = 'primary' }) => {
      const variantStyles = getButtonVariantStyles(theme, $variant);
      const focusKey = '&:focus' as keyof typeof variantStyles;
      const focusStyles = variantStyles[focusKey] as any;
      if (focusStyles) {
        return Object.entries(focusStyles).map(([key, value]) => `${key}: ${value};`).join('\n    ');
      }
      return '';
    }}
  }
  
  /* Active state */
  &:active:not(:disabled) {
    ${({ theme, $variant = 'primary' }) => {
      const variantStyles = getButtonVariantStyles(theme, $variant);
      const activeKey = '&:active' as keyof typeof variantStyles;
      const activeStyles = variantStyles[activeKey] as any;
      if (activeStyles) {
        return Object.entries(activeStyles).map(([key, value]) => `${key}: ${value};`).join('\n    ');
      }
      return '';
    }}
  }
  
  /* Loading state */
  ${({ $loading }) => $loading && `
    color: transparent !important;
  `}
`;

// Loading spinner container
const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Icon container
const IconContainer = styled.span<{ $position: 'start' | 'end' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${({ $position }) => $position === 'start' ? 'margin-right: 4px;' : 'margin-left: 4px;'}
`;

/**
 * Modern Button Component
 * 
 * A comprehensive button component that supports multiple variants, sizes, and states.
 * Follows the modern design system patterns for consistent styling.
 */
export const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  children,
  className,
  style,
  type = 'button',
  href,
  target,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  // Handle click events
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  
  // Get loading spinner size based on button size
  const getSpinnerSize = () => {
    const sizeMap = {
      small: 16,
      medium: 20,
      large: 24,
    };
    return sizeMap[size];
  };
  
  // If href is provided, render as link
  if (href) {
    return (
      <StyledButton
        as="a"
        href={href}
        target={target}
        ref={ref as any}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        $disabled={disabled}
        $loading={loading}
        theme={theme}
        className={className}
        style={style}
        data-testid={dataTestId}
        {...rest}
      >
        {loading && (
          <LoadingSpinner>
            <CircularProgress 
              size={getSpinnerSize()} 
              color="inherit"
              thickness={4}
            />
          </LoadingSpinner>
        )}
        {startIcon && !loading && (
          <IconContainer $position="start">
            {startIcon}
          </IconContainer>
        )}
        {children}
        {endIcon && !loading && (
          <IconContainer $position="end">
            {endIcon}
          </IconContainer>
        )}
      </StyledButton>
    );
  }
  
  return (
    <StyledButton
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $disabled={disabled}
      $loading={loading}
      theme={theme}
      className={className}
      style={style}
      data-testid={dataTestId}
      {...rest}
    >
      {loading && (
        <LoadingSpinner>
          <CircularProgress 
            size={getSpinnerSize()} 
            color="inherit"
            thickness={4}
          />
        </LoadingSpinner>
      )}
      {startIcon && !loading && (
        <IconContainer $position="start">
          {startIcon}
        </IconContainer>
      )}
      {children}
      {endIcon && !loading && (
        <IconContainer $position="end">
          {endIcon}
        </IconContainer>
      )}
    </StyledButton>
  );
});

ModernButton.displayName = 'ModernButton';

export default ModernButton;
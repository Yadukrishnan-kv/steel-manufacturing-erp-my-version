/**
 * Modern TextField Component
 * A comprehensive text input component with clean, minimal design
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { ModernTextFieldProps } from '../types';
import { 
  getSizeStyles, 
  getTransitionStyles, 
  getDisabledStyles,
  getFocusRingStyles 
} from '../utils';

// Styled container for the text field
const TextFieldContainer = styled.div<{
  $fullWidth: boolean;
  $disabled: boolean;
}>`
  display: ${({ $fullWidth }) => $fullWidth ? 'block' : 'inline-block'};
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1};
`;

// Styled label
const StyledLabel = styled.label<{
  $required: boolean;
  $error: boolean;
  theme: any;
}>`
  display: block;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  color: ${({ theme, $error }) => 
    $error 
      ? theme.custom.colors.semantic.error[600]
      : theme.custom.colors.neutral.gray[700]
  };
  margin-bottom: ${({ theme }) => theme.custom.spacing[1]};
  
  ${({ $required }) => $required && `
    &::after {
      content: ' *';
      color: #ef4444;
    }
  `}
`;

// Styled input wrapper
const InputWrapper = styled.div<{
  $variant: ModernTextFieldProps['variant'];
  $size: ModernTextFieldProps['size'];
  $error: boolean;
  $focused: boolean;
  $disabled: boolean;
  theme: any;
}>`
  position: relative;
  display: flex;
  align-items: center;
  
  ${({ theme, $variant, $error, $focused, $disabled }) => {
    const baseStyles = {
      borderRadius: theme.custom.borderRadius.md,
      transition: getTransitionStyles(['border-color', 'box-shadow', 'background-color'], '200ms').transition,
    };
    
    if ($variant === 'outlined') {
      return {
        ...baseStyles,
        border: `1px solid ${
          $error 
            ? theme.custom.colors.semantic.error[400]
            : $focused 
              ? theme.custom.colors.primary[500]
              : theme.custom.colors.neutral.gray[300]
        }`,
        backgroundColor: $disabled 
          ? theme.custom.colors.neutral.gray[50]
          : theme.custom.colors.neutral.white,
        boxShadow: $focused && !$error 
          ? `0 0 0 3px ${theme.custom.colors.primary[100]}`
          : $error && $focused
            ? `0 0 0 3px ${theme.custom.colors.semantic.error[100]}`
            : 'none',
      };
    }
    
    if ($variant === 'filled') {
      return {
        ...baseStyles,
        border: `1px solid transparent`,
        backgroundColor: $disabled 
          ? theme.custom.colors.neutral.gray[100]
          : theme.custom.colors.neutral.gray[50],
        borderBottomColor: $error 
          ? theme.custom.colors.semantic.error[400]
          : $focused 
            ? theme.custom.colors.primary[500]
            : theme.custom.colors.neutral.gray[400],
        boxShadow: $focused && !$error 
          ? `0 0 0 3px ${theme.custom.colors.primary[100]}`
          : $error && $focused
            ? `0 0 0 3px ${theme.custom.colors.semantic.error[100]}`
            : 'none',
      };
    }
    
    // underlined variant
    return {
      ...baseStyles,
      border: 'none',
      borderBottom: `2px solid ${
        $error 
          ? theme.custom.colors.semantic.error[400]
          : $focused 
            ? theme.custom.colors.primary[500]
            : theme.custom.colors.neutral.gray[300]
      }`,
      backgroundColor: 'transparent',
      borderRadius: 0,
    };
  }}
  
  ${({ theme, $size = 'medium' }) => {
    const sizeStyles = getSizeStyles(theme, $size);
    return `padding: ${sizeStyles.padding};`;
  }}
`;

// Styled input element
const StyledInput = styled.input<{
  $size: ModernTextFieldProps['size'];
  theme: any;
}>`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${({ theme }) => theme.custom.typography.fontFamily.primary};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.normal};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  
  ${({ theme, $size = 'medium' }) => {
    const sizeStyles = getSizeStyles(theme, $size);
    return `font-size: ${sizeStyles.fontSize};`;
  }}
  
  &::placeholder {
    color: ${({ theme }) => theme.custom.colors.neutral.gray[400]};
  }
  
  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.custom.colors.neutral.gray[500]};
  }
`;

// Helper text container
const HelperText = styled.div<{
  $error: boolean;
  theme: any;
}>`
  margin-top: ${({ theme }) => theme.custom.spacing[1]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  color: ${({ theme, $error }) => 
    $error 
      ? theme.custom.colors.semantic.error[600]
      : theme.custom.colors.neutral.gray[600]
  };
`;

// Start and end adornment containers
const Adornment = styled.div<{
  $position: 'start' | 'end';
  theme: any;
}>`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.custom.colors.neutral.gray[500]};
  ${({ $position, theme }) => 
    $position === 'start' 
      ? `margin-right: ${theme.custom.spacing[2]};`
      : `margin-left: ${theme.custom.spacing[2]};`
  }
`;

/**
 * Modern TextField Component
 * 
 * A comprehensive text input component with clean, minimal design that supports
 * multiple variants, validation states, and full compatibility with react-hook-form.
 * 
 * @param variant - Input style variant (outlined, filled, underlined)
 * @param size - Input size (small, medium, large)
 * @param error - Whether the input is in error state
 * @param helperText - Helper text to display below the input
 * @param label - Label text for the input
 * @param placeholder - Placeholder text
 * @param disabled - Whether the input is disabled
 * @param required - Whether the input is required
 * @param fullWidth - Whether the input should take full width
 * @param startAdornment - Element to display at the start of the input
 * @param endAdornment - Element to display at the end of the input
 * @param value - Input value
 * @param onChange - Change handler function
 * @param onBlur - Blur handler function
 * @param onFocus - Focus handler function
 */
export const ModernTextField = forwardRef<HTMLInputElement, ModernTextFieldProps>(({
  variant = 'outlined',
  size = 'medium',
  error = false,
  helperText,
  label,
  placeholder,
  disabled = false,
  required = false,
  fullWidth = false,
  startAdornment,
  endAdornment,
  value,
  onChange,
  onBlur,
  onFocus,
  className,
  style,
  type = 'text',
  name,
  id,
  autoComplete,
  autoFocus,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  const [focused, setFocused] = React.useState(false);
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };
  
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(event);
  };
  
  const inputId = id || `modern-textfield-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <TextFieldContainer
      $fullWidth={fullWidth}
      $disabled={disabled}
      className={className}
      style={style}
      data-testid={dataTestId}
    >
      {label && (
        <StyledLabel
          htmlFor={inputId}
          $required={required}
          $error={error}
          theme={theme}
        >
          {label}
        </StyledLabel>
      )}
      
      <InputWrapper
        $variant={variant}
        $size={size}
        $error={error}
        $focused={focused}
        $disabled={disabled}
        theme={theme}
      >
        {startAdornment && (
          <Adornment $position="start" theme={theme}>
            {startAdornment}
          </Adornment>
        )}
        
        <StyledInput
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          $size={size}
          theme={theme}
          {...rest}
        />
        
        {endAdornment && (
          <Adornment $position="end" theme={theme}>
            {endAdornment}
          </Adornment>
        )}
      </InputWrapper>
      
      {helperText && (
        <HelperText $error={error} theme={theme}>
          {helperText}
        </HelperText>
      )}
    </TextFieldContainer>
  );
});

ModernTextField.displayName = 'ModernTextField';

export default ModernTextField;
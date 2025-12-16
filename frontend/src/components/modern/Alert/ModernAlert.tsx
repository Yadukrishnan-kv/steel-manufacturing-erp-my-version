/**
 * Modern Alert Component
 * A clean, minimal alert component for displaying messages and notifications
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { BaseComponentProps } from '../types';

export type AlertSeverity = 'success' | 'info' | 'warning' | 'error';

export interface ModernAlertProps extends BaseComponentProps {
  severity?: AlertSeverity;
  variant?: 'filled' | 'outlined' | 'standard';
  onClose?: () => void;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

// Styled alert container
const StyledAlert = styled.div<{
  $severity: AlertSeverity;
  $variant: ModernAlertProps['variant'];
  theme: any;
}>`
  display: flex;
  align-items: flex-start;
  padding: ${({ theme }) => `${theme.custom.spacing[3]} ${theme.custom.spacing[4]}`};
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.normal};
  
  ${({ theme, $severity, $variant = 'standard' }) => {
    const severityColors = {
      success: theme.custom.colors.semantic.success,
      info: theme.custom.colors.primary,
      warning: theme.custom.colors.semantic.warning,
      error: theme.custom.colors.semantic.error,
    };
    
    const colors = severityColors[$severity];
    
    if ($variant === 'filled') {
      return {
        backgroundColor: colors[500],
        color: theme.custom.colors.neutral.white,
        border: 'none',
      };
    }
    
    if ($variant === 'outlined') {
      return {
        backgroundColor: 'transparent',
        color: colors[700],
        border: `1px solid ${colors[300]}`,
      };
    }
    
    // standard variant
    return {
      backgroundColor: colors[50],
      color: colors[800],
      border: `1px solid ${colors[200]}`,
    };
  }}
`;

// Icon container
const IconContainer = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.custom.spacing[2]};
  flex-shrink: 0;
`;

// Content container
const ContentContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

// Action container
const ActionContainer = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: flex-start;
  margin-left: ${({ theme }) => theme.custom.spacing[2]};
  flex-shrink: 0;
`;

// Default icons for each severity
const DefaultIcons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Modern Alert Component
 * 
 * A clean, minimal alert component for displaying messages and notifications.
 * Supports different severity levels and variants with appropriate styling.
 * 
 * @param severity - Alert severity level (success, info, warning, error)
 * @param variant - Alert style variant (filled, outlined, standard)
 * @param onClose - Close handler function
 * @param icon - Custom icon to display
 * @param action - Custom action element (like close button)
 * @param children - Alert content
 */
export const ModernAlert = forwardRef<HTMLDivElement, ModernAlertProps>(({
  severity = 'info',
  variant = 'standard',
  onClose,
  icon,
  action,
  children,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  const displayIcon = icon !== null ? (icon || DefaultIcons[severity]) : null;
  
  return (
    <StyledAlert
      ref={ref}
      $severity={severity}
      $variant={variant}
      theme={theme}
      className={className}
      style={style}
      data-testid={dataTestId}
      role="alert"
      {...rest}
    >
      {displayIcon && (
        <IconContainer theme={theme}>
          {displayIcon}
        </IconContainer>
      )}
      
      <ContentContainer>
        {children}
      </ContentContainer>
      
      {(action || onClose) && (
        <ActionContainer theme={theme}>
          {action}
          {onClose && !action && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'inherit',
                opacity: 0.7,
              }}
              aria-label="Close alert"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          )}
        </ActionContainer>
      )}
    </StyledAlert>
  );
});

ModernAlert.displayName = 'ModernAlert';

export default ModernAlert;
/**
 * Modern Card Component
 * A versatile card component with subtle elevation and modern styling
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { ModernCardProps } from '../types';
import { 
  getCardElevationStyles, 
  getSizeStyles, 
  getTransitionStyles 
} from '../utils';

// Styled card container
const StyledCard = styled.div<{
  $elevation: ModernCardProps['elevation'];
  $variant: ModernCardProps['variant'];
  $padding: ModernCardProps['padding'];
  $interactive: boolean;
  theme: any;
}>`
  border-radius: ${({ theme }) => theme.custom.borderRadius.lg};
  background-color: ${({ theme }) => theme.custom.colors.neutral.white};
  position: relative;
  overflow: hidden;
  
  /* Transitions */
  ${({ theme }) => {
    const transitions = getTransitionStyles(['box-shadow', 'transform', 'border-color'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  /* Elevation and variant styles */
  ${({ theme, $elevation = 'subtle', $variant = 'elevated' }) => {
    if ($variant === 'outlined') {
      return {
        border: `1px solid ${theme.custom.colors.neutral.gray[200]}`,
        boxShadow: 'none',
      };
    }
    
    if ($variant === 'filled') {
      return {
        backgroundColor: theme.custom.colors.neutral.gray[50],
        border: 'none',
        boxShadow: 'none',
      };
    }
    
    // elevated variant (default)
    const elevationStyles = getCardElevationStyles(theme, $elevation);
    return Object.entries(elevationStyles).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  /* Padding */
  ${({ theme, $padding = 'medium' }) => {
    const paddingMap = {
      small: theme.custom.spacing[3],
      medium: theme.custom.spacing[4],
      large: theme.custom.spacing[6],
    };
    return `padding: ${paddingMap[$padding]};`;
  }}
  
  /* Interactive styles */
  ${({ $interactive, theme }) => $interactive && `
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.custom.shadows.md};
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:focus-visible {
      outline: 2px solid ${theme.custom.colors.primary[400]};
      outline-offset: 2px;
    }
  `}
`;

// Card header component
const CardHeader = styled.div<{
  theme?: any;
}>`
  margin-bottom: ${({ theme }) => theme?.custom?.spacing?.[4] || '1rem'};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// Card title component
const CardTitle = styled.h3<{
  theme?: any;
}>`
  margin: 0 0 ${({ theme }) => theme?.custom?.spacing?.[1] || '0.25rem'} 0;
  font-size: ${({ theme }) => theme?.custom?.typography?.fontSize?.lg || '1.125rem'};
  font-weight: ${({ theme }) => theme?.custom?.typography?.fontWeight?.semibold || 600};
  color: ${({ theme }) => theme?.custom?.colors?.neutral?.gray?.[900] || '#111827'};
  line-height: ${({ theme }) => theme?.custom?.typography?.lineHeight?.tight || 1.25};
`;

// Card subtitle component
const CardSubtitle = styled.p<{
  theme?: any;
}>`
  margin: 0;
  font-size: ${({ theme }) => theme?.custom?.typography?.fontSize?.sm || '0.875rem'};
  font-weight: ${({ theme }) => theme?.custom?.typography?.fontWeight?.normal || 400};
  color: ${({ theme }) => theme?.custom?.colors?.neutral?.gray?.[600] || '#4b5563'};
  line-height: ${({ theme }) => theme?.custom?.typography?.lineHeight?.normal || 1.5};
`;

// Card content component
const CardContent = styled.div<{
  theme?: any;
}>`
  color: ${({ theme }) => theme?.custom?.colors?.neutral?.gray?.[700] || '#374151'};
  font-size: ${({ theme }) => theme?.custom?.typography?.fontSize?.base || '1rem'};
  line-height: ${({ theme }) => theme?.custom?.typography?.lineHeight?.normal || 1.5};
  
  &:not(:last-child) {
    margin-bottom: ${({ theme }) => theme?.custom?.spacing?.[4] || '1rem'};
  }
`;

// Card actions component
const CardActions = styled.div<{
  $align: 'start' | 'center' | 'end';
  theme?: any;
}>`
  display: flex;
  gap: ${({ theme }) => theme?.custom?.spacing?.[2] || '0.5rem'};
  margin-top: ${({ theme }) => theme?.custom?.spacing?.[4] || '1rem'};
  
  ${({ $align }) => {
    if ($align === 'center') return 'justify-content: center;';
    if ($align === 'end') return 'justify-content: flex-end;';
    return 'justify-content: flex-start;';
  }}
  
  &:first-child {
    margin-top: 0;
  }
`;

/**
 * Modern Card Component
 * 
 * A versatile card component that provides a clean container for content
 * with customizable elevation, variants, and interactive states.
 * 
 * @param elevation - Card elevation level (none, subtle, medium, high)
 * @param variant - Card style variant (outlined, filled, elevated)
 * @param padding - Internal padding size (small, medium, large)
 * @param interactive - Whether the card should have hover/focus effects
 * @param onClick - Click handler function
 * @param children - Card content
 */
export const ModernCard = forwardRef<HTMLDivElement, ModernCardProps>(({
  elevation = 'subtle',
  variant = 'elevated',
  padding = 'medium',
  interactive = false,
  onClick,
  children,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactive && onClick) {
      onClick(event);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(event as any);
    }
  };
  
  return (
    <StyledCard
      ref={ref}
      $elevation={elevation}
      $variant={variant}
      $padding={padding}
      $interactive={interactive}
      theme={theme}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      className={className}
      style={style}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </StyledCard>
  );
});

ModernCard.displayName = 'ModernCard';

// CardActions wrapper component with align prop
const CardActionsWrapper = React.forwardRef<HTMLDivElement, {
  align?: 'start' | 'center' | 'end';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}>(({ align = 'start', children, ...props }, ref) => {
  const theme = useTheme();
  
  return (
    <CardActions
      ref={ref}
      $align={align}
      theme={theme}
      {...props}
    >
      {children}
    </CardActions>
  );
});

CardActionsWrapper.displayName = 'CardActions';

// Export sub-components for flexible composition
export { CardHeader, CardTitle, CardSubtitle, CardContent, CardActionsWrapper as CardActions };

export default ModernCard;
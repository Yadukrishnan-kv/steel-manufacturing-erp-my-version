/**
 * Modern Dashboard Card Component
 * A specialized card component for displaying KPIs and dashboard metrics
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { ModernCard } from '../Card/ModernCard';
import { BaseComponentProps } from '../types';

export interface ModernDashboardCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  loading?: boolean;
  onClick?: () => void;
}

// Icon container with color background
const IconContainer = styled.div<{
  $color: string;
  theme: any;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.custom.borderRadius.lg};
  background-color: ${({ $color }) => $color};
  color: ${({ theme }) => theme.custom.colors.neutral.white};
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

// Card header with icon and title
const CardHeader = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[3]};
  margin-bottom: ${({ theme }) => theme.custom.spacing[4]};
`;

// Title text
const Title = styled.h3<{
  theme: any;
}>`
  margin: 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[700]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.normal};
`;

// Main value display
const Value = styled.div<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.tight};
  margin-bottom: ${({ theme }) => theme.custom.spacing[2]};
`;

// Subtitle text
const Subtitle = styled.p<{
  theme: any;
}>`
  margin: 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.normal};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.normal};
`;

// Trend indicator
const TrendContainer = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[1]};
  margin-top: ${({ theme }) => theme.custom.spacing[2]};
`;

const TrendValue = styled.span<{
  $direction: 'up' | 'down' | 'neutral';
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  color: ${({ $direction, theme }) => {
    if ($direction === 'up') return theme.custom.colors.semantic.success[600];
    if ($direction === 'down') return theme.custom.colors.semantic.error[600];
    return theme.custom.colors.neutral.gray[600];
  }};
`;

const TrendLabel = styled.span<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[500]};
`;

// Loading skeleton
const LoadingSkeleton = styled.div<{
  theme: any;
}>`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.custom.colors.neutral.gray[200]} 25%,
    ${({ theme }) => theme.custom.colors.neutral.gray[100]} 50%,
    ${({ theme }) => theme.custom.colors.neutral.gray[200]} 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: ${({ theme }) => theme.custom.borderRadius.base};
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const LoadingTitle = styled(LoadingSkeleton)`
  height: 16px;
  width: 120px;
  margin-bottom: ${({ theme }) => theme.custom.spacing[4]};
`;

const LoadingValue = styled(LoadingSkeleton)`
  height: 36px;
  width: 80px;
  margin-bottom: ${({ theme }) => theme.custom.spacing[2]};
`;

const LoadingSubtitle = styled(LoadingSkeleton)`
  height: 14px;
  width: 100px;
`;

/**
 * Modern Dashboard Card Component
 * 
 * A specialized card for displaying KPIs and metrics with clean, information-dense design.
 * Features icon, title, main value, subtitle, and optional trend indicator.
 * 
 * @param title - Card title/label
 * @param value - Main metric value to display
 * @param subtitle - Optional subtitle or description
 * @param icon - Optional icon element
 * @param color - Background color for icon container
 * @param trend - Optional trend data with direction and value
 * @param loading - Whether to show loading skeleton
 * @param onClick - Click handler for interactive cards
 */
export const ModernDashboardCard = forwardRef<HTMLDivElement, ModernDashboardCardProps>(({
  title,
  value,
  subtitle,
  icon,
  color = '#64748b',
  trend,
  loading = false,
  onClick,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with appropriate suffixes
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toString();
    }
    return val;
  };
  
  const formatTrendValue = (val: number): string => {
    if (val === 0) return '0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val}%`;
  };
  
  if (loading) {
    return (
      <ModernCard
        ref={ref}
        elevation="subtle"
        padding="medium"
        className={className}
        style={style}
        data-testid={dataTestId}
        {...rest}
      >
        <LoadingTitle theme={theme} />
        <LoadingValue theme={theme} />
        <LoadingSubtitle theme={theme} />
      </ModernCard>
    );
  }
  
  return (
    <ModernCard
      ref={ref}
      elevation="subtle"
      padding="medium"
      interactive={!!onClick}
      onClick={onClick}
      className={className}
      style={style}
      data-testid={dataTestId}
      {...rest}
    >
      <CardHeader theme={theme}>
        {icon && (
          <IconContainer $color={color} theme={theme}>
            {icon}
          </IconContainer>
        )}
        <Title theme={theme}>{title}</Title>
      </CardHeader>
      
      <Value theme={theme}>{formatValue(value)}</Value>
      
      {subtitle && (
        <Subtitle theme={theme}>{subtitle}</Subtitle>
      )}
      
      {trend && (
        <TrendContainer theme={theme}>
          <TrendValue $direction={trend.direction} theme={theme}>
            {formatTrendValue(trend.value)}
          </TrendValue>
          {trend.label && (
            <TrendLabel theme={theme}>{trend.label}</TrendLabel>
          )}
        </TrendContainer>
      )}
    </ModernCard>
  );
});

ModernDashboardCard.displayName = 'ModernDashboardCard';

export default ModernDashboardCard;
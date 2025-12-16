/**
 * Modern Chart Component
 * A wrapper for chart libraries with consistent modern styling
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { ModernCard } from '../Card/ModernCard';
import { BaseComponentProps } from '../types';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface ModernChartProps extends BaseComponentProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'area';
  data: ChartData;
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  options?: any; // Chart.js options
  showLegend?: boolean;
  responsive?: boolean;
}

// Chart container
const ChartContainer = styled.div<{
  $height: number;
  theme: any;
}>`
  position: relative;
  height: ${({ $height }) => $height}px;
  width: 100%;
`;

// Chart header
const ChartHeader = styled.div<{
  theme: any;
}>`
  margin-bottom: ${({ theme }) => theme.custom.spacing[4]};
`;

// Chart title
const ChartTitle = styled.h3<{
  theme: any;
}>`
  margin: 0 0 ${({ theme }) => theme.custom.spacing[1]} 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.tight};
`;

// Chart subtitle
const ChartSubtitle = styled.p<{
  theme: any;
}>`
  margin: 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.normal};
`;

// Loading skeleton
const LoadingSkeleton = styled.div<{
  theme: any;
}>`
  width: 100%;
  height: 100%;
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

// Simple chart implementation (placeholder for actual chart library)
const SimpleChart = styled.div<{
  $type: string;
  theme: any;
}>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.custom.colors.neutral.gray[50]};
  border: 2px dashed ${({ theme }) => theme.custom.colors.neutral.gray[300]};
  border-radius: ${({ theme }) => theme.custom.borderRadius.base};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[500]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  text-align: center;
  flex-direction: column;
  gap: ${({ theme }) => theme.custom.spacing[2]};
`;

// Chart legend
const ChartLegend = styled.div<{
  theme: any;
}>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.custom.spacing[3]};
  margin-top: ${({ theme }) => theme.custom.spacing[3]};
  padding-top: ${({ theme }) => theme.custom.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
`;

const LegendItem = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[2]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[700]};
`;

const LegendColor = styled.div<{
  $color: string;
  theme: any;
}>`
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.custom.borderRadius.sm};
  background-color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

/**
 * Modern Chart Component
 * 
 * A wrapper component for charts with consistent modern styling.
 * This is a placeholder implementation - in a real app, you'd integrate
 * with Chart.js, Recharts, or another charting library.
 * 
 * @param type - Chart type (line, bar, doughnut, pie, area)
 * @param data - Chart data with labels and datasets
 * @param title - Chart title
 * @param subtitle - Chart subtitle
 * @param height - Chart height in pixels
 * @param loading - Whether to show loading state
 * @param options - Chart configuration options
 * @param showLegend - Whether to show legend
 * @param responsive - Whether chart should be responsive
 */
export const ModernChart = forwardRef<HTMLDivElement, ModernChartProps>(({
  type,
  data,
  title,
  subtitle,
  height = 300,
  loading = false,
  options = {},
  showLegend = true,
  responsive = true,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  // Generate default colors from theme
  const getDefaultColors = () => {
    return [
      theme.custom.colors.primary[500],
      theme.custom.colors.secondary[500],
      theme.custom.colors.accent[500],
      theme.custom.colors.semantic.success[500],
      theme.custom.colors.semantic.warning[500],
      theme.custom.colors.semantic.error[500],
      theme.custom.colors.semantic.info[500],
    ];
  };
  
  // Apply default colors to datasets if not provided
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || getDefaultColors()[index % getDefaultColors().length],
      borderColor: dataset.borderColor || getDefaultColors()[index % getDefaultColors().length],
      borderWidth: dataset.borderWidth || 2,
    })),
  };
  
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
      {(title || subtitle) && (
        <ChartHeader theme={theme}>
          {title && <ChartTitle theme={theme}>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle theme={theme}>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}
      
      <ChartContainer $height={height} theme={theme}>
        {loading ? (
          <LoadingSkeleton theme={theme} />
        ) : (
          <SimpleChart $type={type} theme={theme}>
            <div>📊</div>
            <div>
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart
              <br />
              <small>Chart library integration needed</small>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              {data.datasets.length} dataset(s), {data.labels.length} data points
            </div>
          </SimpleChart>
        )}
      </ChartContainer>
      
      {showLegend && !loading && data.datasets.length > 0 && (
        <ChartLegend theme={theme}>
          {processedData.datasets.map((dataset, index) => (
            <LegendItem key={index} theme={theme}>
              <LegendColor 
                $color={Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[0] 
                  : dataset.backgroundColor || getDefaultColors()[0]
                } 
                theme={theme} 
              />
              <span>{dataset.label}</span>
            </LegendItem>
          ))}
        </ChartLegend>
      )}
    </ModernCard>
  );
});

ModernChart.displayName = 'ModernChart';

export default ModernChart;
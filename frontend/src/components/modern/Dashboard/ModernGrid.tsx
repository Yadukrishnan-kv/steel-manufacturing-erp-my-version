/**
 * Modern Grid Component
 * A responsive grid system for dashboard layouts
 */

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { BaseComponentProps } from '../types';

export interface ModernGridProps extends BaseComponentProps {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number | string;
  minItemWidth?: string;
  autoFit?: boolean;
  autoFill?: boolean;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

export interface ModernGridItemProps extends BaseComponentProps {
  span?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  start?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  end?: number | { sm?: number; md?: number; lg?: number; xl?: number };
}

// Grid container
const GridContainer = styled.div<{
  $columns: number | { sm?: number; md?: number; lg?: number; xl?: number };
  $gap: number | string;
  $minItemWidth?: string;
  $autoFit: boolean;
  $autoFill: boolean;
  $alignItems: string;
  $justifyItems: string;
  theme: any;
}>`
  display: grid;
  gap: ${({ $gap, theme }) => 
    typeof $gap === 'number' ? theme.custom.spacing[$gap as keyof typeof theme.custom.spacing] || `${$gap}px` : $gap
  };
  align-items: ${({ $alignItems }) => $alignItems};
  justify-items: ${({ $justifyItems }) => $justifyItems};
  
  ${({ $columns, $minItemWidth, $autoFit, $autoFill, theme }) => {
    if ($autoFit && $minItemWidth) {
      return `grid-template-columns: repeat(auto-fit, minmax(${$minItemWidth}, 1fr));`;
    }
    
    if ($autoFill && $minItemWidth) {
      return `grid-template-columns: repeat(auto-fill, minmax(${$minItemWidth}, 1fr));`;
    }
    
    if (typeof $columns === 'number') {
      return `grid-template-columns: repeat(${$columns}, 1fr);`;
    }
    
    // Responsive columns
    const { sm = 1, md = 2, lg = 3, xl = 4 } = $columns;
    return `
      grid-template-columns: repeat(${sm}, 1fr);
      
      @media (min-width: 640px) {
        grid-template-columns: repeat(${md}, 1fr);
      }
      
      @media (min-width: 768px) {
        grid-template-columns: repeat(${lg}, 1fr);
      }
      
      @media (min-width: 1024px) {
        grid-template-columns: repeat(${xl}, 1fr);
      }
    `;
  }}
`;

// Grid item
const GridItem = styled.div<{
  $span?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  $start?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  $end?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  theme: any;
}>`
  ${({ $span }) => {
    if (typeof $span === 'number') {
      return `grid-column: span ${$span};`;
    }
    
    if ($span && typeof $span === 'object') {
      const { sm, md, lg, xl } = $span;
      return `
        ${sm ? `grid-column: span ${sm};` : ''}
        
        @media (min-width: 640px) {
          ${md ? `grid-column: span ${md};` : ''}
        }
        
        @media (min-width: 768px) {
          ${lg ? `grid-column: span ${lg};` : ''}
        }
        
        @media (min-width: 1024px) {
          ${xl ? `grid-column: span ${xl};` : ''}
        }
      `;
    }
    
    return '';
  }}
  
  ${({ $start }) => {
    if (typeof $start === 'number') {
      return `grid-column-start: ${$start};`;
    }
    
    if ($start && typeof $start === 'object') {
      const { sm, md, lg, xl } = $start;
      return `
        ${sm ? `grid-column-start: ${sm};` : ''}
        
        @media (min-width: 640px) {
          ${md ? `grid-column-start: ${md};` : ''}
        }
        
        @media (min-width: 768px) {
          ${lg ? `grid-column-start: ${lg};` : ''}
        }
        
        @media (min-width: 1024px) {
          ${xl ? `grid-column-start: ${xl};` : ''}
        }
      `;
    }
    
    return '';
  }}
  
  ${({ $end }) => {
    if (typeof $end === 'number') {
      return `grid-column-end: ${$end};`;
    }
    
    if ($end && typeof $end === 'object') {
      const { sm, md, lg, xl } = $end;
      return `
        ${sm ? `grid-column-end: ${sm};` : ''}
        
        @media (min-width: 640px) {
          ${md ? `grid-column-end: ${md};` : ''}
        }
        
        @media (min-width: 768px) {
          ${lg ? `grid-column-end: ${lg};` : ''}
        }
        
        @media (min-width: 1024px) {
          ${xl ? `grid-column-end: ${xl};` : ''}
        }
      `;
    }
    
    return '';
  }}
`;

/**
 * Modern Grid Component
 * 
 * A flexible CSS Grid-based layout system with responsive breakpoints.
 * Supports both fixed and responsive column configurations.
 * 
 * @param columns - Number of columns or responsive breakpoint object
 * @param gap - Gap between grid items (theme spacing key or CSS value)
 * @param minItemWidth - Minimum width for auto-fit/auto-fill layouts
 * @param autoFit - Use auto-fit for responsive columns
 * @param autoFill - Use auto-fill for responsive columns
 * @param alignItems - Vertical alignment of grid items
 * @param justifyItems - Horizontal alignment of grid items
 */
export const ModernGrid = forwardRef<HTMLDivElement, ModernGridProps>(({
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  minItemWidth,
  autoFit = false,
  autoFill = false,
  alignItems = 'stretch',
  justifyItems = 'stretch',
  children,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  return (
    <GridContainer
      ref={ref}
      $columns={columns}
      $gap={gap}
      $minItemWidth={minItemWidth}
      $autoFit={autoFit}
      $autoFill={autoFill}
      $alignItems={alignItems}
      $justifyItems={justifyItems}
      theme={theme}
      className={className}
      style={style}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </GridContainer>
  );
});

ModernGrid.displayName = 'ModernGrid';

/**
 * Modern Grid Item Component
 * 
 * A grid item with responsive span, start, and end positioning.
 * 
 * @param span - Number of columns to span or responsive breakpoint object
 * @param start - Grid column start position or responsive breakpoint object
 * @param end - Grid column end position or responsive breakpoint object
 */
export const ModernGridItem = forwardRef<HTMLDivElement, ModernGridItemProps>(({
  span,
  start,
  end,
  children,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  
  return (
    <GridItem
      ref={ref}
      $span={span}
      $start={start}
      $end={end}
      theme={theme}
      className={className}
      style={style}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </GridItem>
  );
});

ModernGridItem.displayName = 'ModernGridItem';

export default ModernGrid;
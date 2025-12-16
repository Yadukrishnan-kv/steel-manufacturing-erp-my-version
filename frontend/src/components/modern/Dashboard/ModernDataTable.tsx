/**
 * Modern Data Table Component
 * A high-density data table with modern styling and advanced features
 */

import React, { useState, useMemo, forwardRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { BaseComponentProps } from '../types';
import { getTransitionStyles } from '../utils';

export interface TableColumn<T = any> {
  id: string;
  label: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface ModernDataTableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortable?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowKey?: keyof T | ((row: T) => string);
  emptyMessage?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  stickyHeader?: boolean;
  maxHeight?: string | number;
}

// Table container
const TableContainer = styled.div<{
  $maxHeight?: string | number;
  theme: any;
}>`
  border: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
  border-radius: ${({ theme }) => theme.custom.borderRadius.lg};
  overflow: hidden;
  background-color: ${({ theme }) => theme.custom.colors.neutral.white};
  
  ${({ $maxHeight }) => $maxHeight && `
    max-height: ${typeof $maxHeight === 'number' ? `${$maxHeight}px` : $maxHeight};
    overflow-y: auto;
  `}
`;

// Table element
const Table = styled.table<{
  theme: any;
}>`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
`;

// Table header
const TableHead = styled.thead<{
  $sticky: boolean;
  theme: any;
}>`
  ${({ $sticky, theme }) => $sticky && `
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: ${theme.custom.colors.neutral.gray[50]};
  `}
`;

// Header row
const HeaderRow = styled.tr<{
  theme: any;
}>`
  background-color: ${({ theme }) => theme.custom.colors.neutral.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
`;

// Header cell
const HeaderCell = styled.th<{
  $align: 'left' | 'center' | 'right';
  $sortable: boolean;
  $width?: string | number;
  theme: any;
}>`
  padding: ${({ theme }) => theme.custom.spacing[3]} ${({ theme }) => theme.custom.spacing[4]};
  text-align: ${({ $align }) => $align};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[700]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  
  ${({ $width }) => $width && `
    width: ${typeof $width === 'number' ? `${$width}px` : $width};
  `}
  
  ${({ $sortable, theme }) => $sortable && `
    cursor: pointer;
    user-select: none;
    ${getTransitionStyles(['background-color'], '150ms')}
    
    &:hover {
      background-color: ${theme.custom.colors.neutral.gray[100]};
    }
  `}
`;

// Table body
const TableBody = styled.tbody<{
  theme: any;
}>``;

// Body row
const BodyRow = styled.tr<{
  $density: 'compact' | 'comfortable' | 'spacious';
  $selectable: boolean;
  $selected: boolean;
  theme: any;
}>`
  border-bottom: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[100]};
  ${getTransitionStyles(['background-color'], '150ms')}
  
  ${({ $selected, theme }) => $selected && `
    background-color: ${theme.custom.colors.primary[50]};
  `}
  
  ${({ $selectable, theme }) => $selectable && `
    cursor: pointer;
    
    &:hover {
      background-color: ${theme.custom.colors.neutral.gray[50]};
    }
  `}
  
  &:last-child {
    border-bottom: none;
  }
`;

// Body cell
const BodyCell = styled.td<{
  $align: 'left' | 'center' | 'right';
  $density: 'compact' | 'comfortable' | 'spacious';
  theme: any;
}>`
  text-align: ${({ $align }) => $align};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.normal};
  
  ${({ $density, theme }) => {
    const densityMap = {
      compact: `padding: ${theme.custom.spacing[2]} ${theme.custom.spacing[4]};`,
      comfortable: `padding: ${theme.custom.spacing[3]} ${theme.custom.spacing[4]};`,
      spacious: `padding: ${theme.custom.spacing[4]} ${theme.custom.spacing[4]};`,
    };
    return densityMap[$density];
  }}
`;

// Checkbox cell
const CheckboxCell = styled(BodyCell)`
  width: 48px;
  padding-left: ${({ theme }) => theme.custom.spacing[4]};
  padding-right: ${({ theme }) => theme.custom.spacing[2]};
`;

// Sort indicator
const SortIndicator = styled.span<{
  $direction?: 'asc' | 'desc';
  theme: any;
}>`
  margin-left: ${({ theme }) => theme.custom.spacing[1]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[500]};
  
  ${({ $direction }) => !$direction && 'opacity: 0.3;'}
`;

// Empty state
const EmptyState = styled.div<{
  theme: any;
}>`
  padding: ${({ theme }) => theme.custom.spacing[12]} ${({ theme }) => theme.custom.spacing[4]};
  text-align: center;
  color: ${({ theme }) => theme.custom.colors.neutral.gray[500]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
`;

// Loading skeleton row
const LoadingRow = styled(BodyRow)`
  &:hover {
    background-color: transparent;
  }
`;

const LoadingSkeleton = styled.div<{
  $width?: string;
  theme: any;
}>`
  height: 16px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.custom.colors.neutral.gray[200]} 25%,
    ${({ theme }) => theme.custom.colors.neutral.gray[100]} 50%,
    ${({ theme }) => theme.custom.colors.neutral.gray[200]} 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: ${({ theme }) => theme.custom.borderRadius.base};
  width: ${({ $width }) => $width || '100%'};
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Pagination container
const PaginationContainer = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: ${({ theme }) => theme.custom.spacing[3]} ${({ theme }) => theme.custom.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
  background-color: ${({ theme }) => theme.custom.colors.neutral.gray[50]};
  gap: ${({ theme }) => theme.custom.spacing[4]};
`;

const PaginationInfo = styled.div<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
`;

const PaginationControls = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[2]};
  margin-left: auto;
`;

const PaginationButton = styled.button<{
  $disabled: boolean;
  theme: any;
}>`
  padding: ${({ theme }) => theme.custom.spacing[1]} ${({ theme }) => theme.custom.spacing[2]};
  border: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[300]};
  border-radius: ${({ theme }) => theme.custom.borderRadius.base};
  background-color: ${({ theme }) => theme.custom.colors.neutral.white};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[700]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  cursor: pointer;
  ${getTransitionStyles(['background-color', 'border-color'], '150ms')}
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.custom.colors.neutral.gray[50]};
    border-color: ${({ theme }) => theme.custom.colors.neutral.gray[400]};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Modern Data Table Component
 * 
 * A feature-rich data table with sorting, pagination, selection, and responsive design.
 * Optimized for high information density while maintaining readability.
 */
export const ModernDataTable = forwardRef<HTMLDivElement, ModernDataTableProps>(({
  columns,
  data,
  loading = false,
  sortable = true,
  pagination,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = 'id',
  emptyMessage = 'No data available',
  density = 'comfortable',
  stickyHeader = false,
  maxHeight,
  className,
  style,
  'data-testid': dataTestId,
  ...rest
}, ref) => {
  const theme = useTheme();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Get row key
  const getRowKey = (row: any, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return row[rowKey] || index.toString();
  };
  
  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;
    
    setSortConfig(current => {
      if (current?.key === columnId) {
        return current.direction === 'asc' 
          ? { key: columnId, direction: 'desc' }
          : null;
      }
      return { key: columnId, direction: 'asc' };
    });
  };
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    const column = columns.find(col => col.id === sortConfig.key);
    if (!column) return data;
    
    return [...data].sort((a, b) => {
      let aValue, bValue;
      
      if (typeof column.accessor === 'function') {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else {
        aValue = a[column.accessor];
        bValue = b[column.accessor];
      }
      
      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [data, sortConfig, columns]);
  
  // Handle row selection
  const handleRowSelect = (rowId: string) => {
    if (!selectable || !onSelectionChange) return;
    
    const newSelection = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    
    onSelectionChange(newSelection);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange) return;
    
    const allRowIds = sortedData.map((row, index) => getRowKey(row, index));
    const allSelected = allRowIds.every(id => selectedRows.includes(id));
    
    onSelectionChange(allSelected ? [] : allRowIds);
  };
  
  // Get cell value
  const getCellValue = (row: any, column: TableColumn) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };
  
  // Render loading rows
  const renderLoadingRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <LoadingRow
        key={index}
        $density={density}
        $selectable={false}
        $selected={false}
        theme={theme}
      >
        {selectable && (
          <CheckboxCell $align="center" $density={density} theme={theme}>
            <LoadingSkeleton $width="16px" theme={theme} />
          </CheckboxCell>
        )}
        {columns.map(column => (
          <BodyCell
            key={column.id}
            $align={column.align || 'left'}
            $density={density}
            theme={theme}
          >
            <LoadingSkeleton 
              $width={`${Math.random() * 60 + 40}%`} 
              theme={theme} 
            />
          </BodyCell>
        ))}
      </LoadingRow>
    ));
  };
  
  const isAllSelected = sortedData.length > 0 && 
    sortedData.every((row, index) => selectedRows.includes(getRowKey(row, index)));
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected;
  
  return (
    <TableContainer
      ref={ref}
      $maxHeight={maxHeight}
      theme={theme}
      className={className}
      style={style}
      data-testid={dataTestId}
      {...rest}
    >
      <Table theme={theme}>
        <TableHead $sticky={stickyHeader} theme={theme}>
          <HeaderRow theme={theme}>
            {selectable && (
              <HeaderCell
                $align="center"
                $sortable={false}
                $width={48}
                theme={theme}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                />
              </HeaderCell>
            )}
            {columns.map(column => (
              <HeaderCell
                key={column.id}
                $align={column.align || 'left'}
                $sortable={sortable && column.sortable !== false}
                $width={column.width}
                theme={theme}
                onClick={() => handleSort(column.id)}
              >
                {column.label}
                {sortable && column.sortable !== false && (
                  <SortIndicator
                    $direction={sortConfig?.key === column.id ? sortConfig.direction : undefined}
                    theme={theme}
                  >
                    {sortConfig?.key === column.id 
                      ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                      : '↕'
                    }
                  </SortIndicator>
                )}
              </HeaderCell>
            ))}
          </HeaderRow>
        </TableHead>
        
        <TableBody theme={theme}>
          {loading ? (
            renderLoadingRows()
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState theme={theme}>
                  {emptyMessage}
                </EmptyState>
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              const rowId = getRowKey(row, index);
              const isSelected = selectedRows.includes(rowId);
              
              return (
                <BodyRow
                  key={rowId}
                  $density={density}
                  $selectable={selectable}
                  $selected={isSelected}
                  theme={theme}
                  onClick={() => selectable && handleRowSelect(rowId)}
                >
                  {selectable && (
                    <CheckboxCell $align="center" $density={density} theme={theme}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(rowId)}
                        onClick={e => e.stopPropagation()}
                      />
                    </CheckboxCell>
                  )}
                  {columns.map(column => {
                    const value = getCellValue(row, column);
                    const displayValue = column.render 
                      ? column.render(value, row, index)
                      : value;
                    
                    return (
                      <BodyCell
                        key={column.id}
                        $align={column.align || 'left'}
                        $density={density}
                        theme={theme}
                      >
                        {displayValue}
                      </BodyCell>
                    );
                  })}
                </BodyRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {pagination && (
        <PaginationContainer theme={theme}>
          <PaginationInfo theme={theme}>
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </PaginationInfo>
          
          <PaginationControls theme={theme}>
            <PaginationButton
              $disabled={pagination.page <= 1}
              theme={theme}
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </PaginationButton>
            
            <span style={{ 
              fontSize: theme.custom.typography.fontSize.sm,
              color: theme.custom.colors.neutral.gray[600]
            }}>
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <PaginationButton
              $disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              theme={theme}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </PaginationButton>
          </PaginationControls>
        </PaginationContainer>
      )}
    </TableContainer>
  );
});

ModernDataTable.displayName = 'ModernDataTable';

export default ModernDataTable;
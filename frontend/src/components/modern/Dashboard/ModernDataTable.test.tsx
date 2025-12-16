/**
 * Modern Data Table Component Tests
 * Unit tests for ModernDataTable
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithTheme } from '../testing/testUtils';
import { ModernDataTable, TableColumn } from './ModernDataTable';

describe('ModernDataTable', () => {
  const sampleData = [
    { id: '1', name: 'John Doe', age: 30, role: 'Developer' },
    { id: '2', name: 'Jane Smith', age: 25, role: 'Designer' },
    { id: '3', name: 'Bob Johnson', age: 35, role: 'Manager' },
  ];

  const sampleColumns: TableColumn[] = [
    { id: 'name', label: 'Name', accessor: 'name', sortable: true },
    { id: 'age', label: 'Age', accessor: 'age', sortable: true, align: 'right' },
    { id: 'role', label: 'Role', accessor: 'role' },
  ];

  describe('Basic Rendering', () => {
    it('renders table with data', () => {
      renderWithTheme(
        <ModernDataTable columns={sampleColumns} data={sampleData} />
      );
      
      // Check headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      
      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={[]} 
          emptyMessage="No users found"
        />
      );
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      renderWithTheme(
        <ModernDataTable columns={sampleColumns} data={[]} loading />
      );
      
      // Should not show actual data when loading
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts data when column header is clicked', () => {
      renderWithTheme(
        <ModernDataTable columns={sampleColumns} data={sampleData} />
      );
      
      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);
      
      // Check if sort indicator is present
      expect(nameHeader.parentElement).toHaveTextContent('↑');
    });

    it('toggles sort direction on repeated clicks', () => {
      renderWithTheme(
        <ModernDataTable columns={sampleColumns} data={sampleData} />
      );
      
      const nameHeader = screen.getByText('Name');
      
      // First click - ascending
      fireEvent.click(nameHeader);
      expect(nameHeader.parentElement).toHaveTextContent('↑');
      
      // Second click - descending
      fireEvent.click(nameHeader);
      expect(nameHeader.parentElement).toHaveTextContent('↓');
      
      // Third click - no sort
      fireEvent.click(nameHeader);
      expect(nameHeader.parentElement).toHaveTextContent('↕');
    });

    it('does not sort non-sortable columns', () => {
      renderWithTheme(
        <ModernDataTable columns={sampleColumns} data={sampleData} />
      );
      
      const roleHeader = screen.getByText('Role');
      fireEvent.click(roleHeader);
      
      // Should not have sort indicator
      expect(roleHeader.parentElement).not.toHaveTextContent('↑');
      expect(roleHeader.parentElement).not.toHaveTextContent('↓');
    });
  });

  describe('Selection', () => {
    it('renders checkboxes when selectable', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          selectable
          selectedRows={[]}
          onSelectionChange={() => {}}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4); // 3 data rows + 1 header
    });

    it('calls onSelectionChange when row is selected', () => {
      const handleSelectionChange = vi.fn();
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );
      
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
      fireEvent.click(firstRowCheckbox);
      
      expect(handleSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('selects all rows when header checkbox is clicked', () => {
      const handleSelectionChange = vi.fn();
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );
      
      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(headerCheckbox);
      
      expect(handleSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });
  });

  describe('Pagination', () => {
    const paginationProps = {
      page: 1,
      pageSize: 2,
      total: 10,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
    };

    it('renders pagination controls', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          pagination={paginationProps}
        />
      );
      
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('calls onPageChange when navigation buttons are clicked', () => {
      const handlePageChange = vi.fn();
      const props = { ...paginationProps, page: 2, onPageChange: handlePageChange };
      
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          pagination={props}
        />
      );
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('disables Previous button on first page', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          pagination={paginationProps}
        />
      );
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('disables Next button on last page', () => {
      const props = { ...paginationProps, page: 5 };
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          pagination={props}
        />
      );
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom render function for columns', () => {
      const customColumns: TableColumn[] = [
        {
          id: 'name',
          label: 'Name',
          accessor: 'name',
          render: (value) => <strong>{value}</strong>,
        },
      ];

      renderWithTheme(
        <ModernDataTable columns={customColumns} data={sampleData} />
      );
      
      const nameCell = screen.getByText('John Doe');
      expect(nameCell.tagName).toBe('STRONG');
    });

    it('handles function accessors', () => {
      const customColumns: TableColumn[] = [
        {
          id: 'fullInfo',
          label: 'Full Info',
          accessor: (row) => `${row.name} (${row.age})`,
        },
      ];

      renderWithTheme(
        <ModernDataTable columns={customColumns} data={sampleData} />
      );
      
      expect(screen.getByText('John Doe (30)')).toBeInTheDocument();
    });
  });

  describe('Density', () => {
    it('applies compact density', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          density="compact"
        />
      );
      
      // This would require checking computed styles in a real test
      // For now, just verify it renders without error
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('applies spacious density', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          density="spacious"
        />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      renderWithTheme(
        <ModernDataTable columns={sampleColumns} data={sampleData} />
      );
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(3);
      expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data rows
    });

    it('forwards data-testid', () => {
      renderWithTheme(
        <ModernDataTable 
          columns={sampleColumns} 
          data={sampleData} 
          data-testid="custom-table"
        />
      );
      
      expect(screen.getByTestId('custom-table')).toBeInTheDocument();
    });
  });
});
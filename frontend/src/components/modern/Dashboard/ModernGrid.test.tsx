/**
 * Modern Grid Component Tests
 * Unit tests for ModernGrid and ModernGridItem
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderWithTheme } from '../testing/testUtils';
import { ModernGrid, ModernGridItem } from './ModernGrid';

describe('ModernGrid', () => {
  describe('Basic Rendering', () => {
    it('renders with children', () => {
      renderWithTheme(
        <ModernGrid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </ModernGrid>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders with default responsive columns', () => {
      renderWithTheme(
        <ModernGrid data-testid="grid">
          <div>Item 1</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Column Configuration', () => {
    it('renders with fixed number of columns', () => {
      renderWithTheme(
        <ModernGrid columns={3} data-testid="fixed-grid">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('fixed-grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders with responsive column configuration', () => {
      renderWithTheme(
        <ModernGrid 
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          data-testid="responsive-grid"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('responsive-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Auto-fit and Auto-fill', () => {
    it('renders with auto-fit layout', () => {
      renderWithTheme(
        <ModernGrid 
          autoFit 
          minItemWidth="200px"
          data-testid="autofit-grid"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('autofit-grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders with auto-fill layout', () => {
      renderWithTheme(
        <ModernGrid 
          autoFill 
          minItemWidth="150px"
          data-testid="autofill-grid"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('autofill-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Gap Configuration', () => {
    it('renders with numeric gap (theme spacing)', () => {
      renderWithTheme(
        <ModernGrid gap={4} data-testid="numeric-gap-grid">
          <div>Item 1</div>
          <div>Item 2</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('numeric-gap-grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders with string gap (CSS value)', () => {
      renderWithTheme(
        <ModernGrid gap="20px" data-testid="string-gap-grid">
          <div>Item 1</div>
          <div>Item 2</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('string-gap-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Alignment', () => {
    it('renders with custom align and justify items', () => {
      renderWithTheme(
        <ModernGrid 
          alignItems="center"
          justifyItems="center"
          data-testid="aligned-grid"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('aligned-grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders with different alignment options', () => {
      const alignments = ['start', 'center', 'end', 'stretch'] as const;
      
      alignments.forEach(alignment => {
        renderWithTheme(
          <ModernGrid 
            alignItems={alignment}
            justifyItems={alignment}
            data-testid={`${alignment}-grid`}
          >
            <div>Item</div>
          </ModernGrid>
        );
        
        expect(screen.getByTestId(`${alignment}-grid`)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props', () => {
    it('forwards data-testid', () => {
      renderWithTheme(
        <ModernGrid data-testid="custom-grid">
          <div>Item</div>
        </ModernGrid>
      );
      
      expect(screen.getByTestId('custom-grid')).toBeInTheDocument();
    });

    it('forwards className', () => {
      renderWithTheme(
        <ModernGrid className="custom-class" data-testid="class-grid">
          <div>Item</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('class-grid');
      expect(grid).toHaveClass('custom-class');
    });

    it('forwards style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      renderWithTheme(
        <ModernGrid style={customStyle} data-testid="style-grid">
          <div>Item</div>
        </ModernGrid>
      );
      
      const grid = screen.getByTestId('style-grid');
      expect(grid).toHaveStyle('background-color: rgb(255, 0, 0)');
    });
  });
});

describe('ModernGridItem', () => {
  describe('Basic Rendering', () => {
    it('renders with children', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem>
            <div>Grid Item Content</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      expect(screen.getByText('Grid Item Content')).toBeInTheDocument();
    });
  });

  describe('Span Configuration', () => {
    it('renders with fixed span', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem span={2} data-testid="span-item">
            <div>Spanning Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('span-item');
      expect(item).toBeInTheDocument();
    });

    it('renders with responsive span', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem 
            span={{ sm: 1, md: 2, lg: 3, xl: 4 }}
            data-testid="responsive-span-item"
          >
            <div>Responsive Spanning Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('responsive-span-item');
      expect(item).toBeInTheDocument();
    });
  });

  describe('Position Configuration', () => {
    it('renders with start position', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem start={2} data-testid="start-item">
            <div>Start Position Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('start-item');
      expect(item).toBeInTheDocument();
    });

    it('renders with end position', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem end={4} data-testid="end-item">
            <div>End Position Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('end-item');
      expect(item).toBeInTheDocument();
    });

    it('renders with responsive positions', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem 
            start={{ sm: 1, md: 2 }}
            end={{ sm: 3, md: 4 }}
            data-testid="responsive-position-item"
          >
            <div>Responsive Position Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('responsive-position-item');
      expect(item).toBeInTheDocument();
    });
  });

  describe('Combined Configuration', () => {
    it('renders with span, start, and end together', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem 
            span={2}
            start={1}
            end={3}
            data-testid="combined-item"
          >
            <div>Combined Configuration Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('combined-item');
      expect(item).toBeInTheDocument();
    });

    it('renders with all responsive configurations', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem 
            span={{ sm: 1, md: 2, lg: 3 }}
            start={{ sm: 1, md: 2 }}
            end={{ sm: 2, md: 4 }}
            data-testid="full-responsive-item"
          >
            <div>Full Responsive Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('full-responsive-item');
      expect(item).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('forwards data-testid', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem data-testid="custom-item">
            <div>Custom Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      expect(screen.getByTestId('custom-item')).toBeInTheDocument();
    });

    it('forwards className', () => {
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem className="custom-item-class" data-testid="class-item">
            <div>Class Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('class-item');
      expect(item).toHaveClass('custom-item-class');
    });

    it('forwards style prop', () => {
      const customStyle = { backgroundColor: 'blue' };
      renderWithTheme(
        <ModernGrid>
          <ModernGridItem style={customStyle} data-testid="style-item">
            <div>Style Item</div>
          </ModernGridItem>
        </ModernGrid>
      );
      
      const item = screen.getByTestId('style-item');
      expect(item).toHaveStyle('background-color: rgb(0, 0, 255)');
    });
  });
});
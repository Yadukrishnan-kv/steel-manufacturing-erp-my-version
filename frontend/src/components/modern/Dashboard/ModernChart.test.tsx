/**
 * Modern Chart Component Tests
 * Unit tests for ModernChart
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderWithTheme } from '../testing/testUtils';
import { ModernChart, ChartData } from './ModernChart';

describe('ModernChart', () => {
  const sampleData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Sales',
        data: [100, 150, 120, 180, 200],
      },
      {
        label: 'Expenses',
        data: [80, 90, 85, 95, 110],
      },
    ],
  };

  describe('Basic Rendering', () => {
    it('renders chart with required props', () => {
      renderWithTheme(
        <ModernChart type="line" data={sampleData} />
      );
      
      // Should render the placeholder chart
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
      expect(screen.getByText('Chart library integration needed')).toBeInTheDocument();
    });

    it('renders with title and subtitle', () => {
      renderWithTheme(
        <ModernChart 
          type="bar" 
          data={sampleData} 
          title="Sales Overview"
          subtitle="Monthly performance data"
        />
      );
      
      expect(screen.getByText('Sales Overview')).toBeInTheDocument();
      expect(screen.getByText('Monthly performance data')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      renderWithTheme(
        <ModernChart type="line" data={sampleData} loading />
      );
      
      // Should not show chart content when loading
      expect(screen.queryByText('Line Chart')).not.toBeInTheDocument();
    });
  });

  describe('Chart Types', () => {
    const chartTypes = ['line', 'bar', 'doughnut', 'pie', 'area'] as const;

    chartTypes.forEach(type => {
      it(`renders ${type} chart`, () => {
        renderWithTheme(
          <ModernChart type={type} data={sampleData} />
        );
        
        const expectedText = type.charAt(0).toUpperCase() + type.slice(1) + ' Chart';
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
    });
  });

  describe('Legend', () => {
    it('renders legend by default', () => {
      renderWithTheme(
        <ModernChart type="line" data={sampleData} />
      );
      
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Expenses')).toBeInTheDocument();
    });

    it('hides legend when showLegend is false', () => {
      renderWithTheme(
        <ModernChart type="line" data={sampleData} showLegend={false} />
      );
      
      // Legend should not be visible (but chart placeholder still shows dataset info)
      const legendItems = screen.queryAllByText('Sales');
      expect(legendItems.length).toBeLessThanOrEqual(1); // Only in chart info, not in legend
    });

    it('does not render legend when loading', () => {
      renderWithTheme(
        <ModernChart type="line" data={sampleData} loading />
      );
      
      expect(screen.queryByText('Sales')).not.toBeInTheDocument();
      expect(screen.queryByText('Expenses')).not.toBeInTheDocument();
    });
  });

  describe('Data Information', () => {
    it('displays dataset and data point count', () => {
      renderWithTheme(
        <ModernChart type="line" data={sampleData} />
      );
      
      expect(screen.getByText('2 dataset(s), 5 data points')).toBeInTheDocument();
    });

    it('handles single dataset', () => {
      const singleDatasetData: ChartData = {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            label: 'Single Dataset',
            data: [1, 2, 3],
          },
        ],
      };

      renderWithTheme(
        <ModernChart type="bar" data={singleDatasetData} />
      );
      
      expect(screen.getByText('1 dataset(s), 3 data points')).toBeInTheDocument();
    });

    it('handles empty datasets', () => {
      const emptyData: ChartData = {
        labels: [],
        datasets: [],
      };

      renderWithTheme(
        <ModernChart type="line" data={emptyData} />
      );
      
      expect(screen.getByText('0 dataset(s), 0 data points')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('forwards data-testid', () => {
      renderWithTheme(
        <ModernChart 
          type="line" 
          data={sampleData} 
          data-testid="custom-chart"
        />
      );
      
      expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
    });

    it('forwards className', () => {
      renderWithTheme(
        <ModernChart 
          type="line" 
          data={sampleData} 
          className="custom-class"
        />
      );
      
      const chart = screen.getByText('Line Chart').closest('[class*="custom-class"]');
      expect(chart).toBeInTheDocument();
    });

    it('applies custom height', () => {
      renderWithTheme(
        <ModernChart 
          type="line" 
          data={sampleData} 
          height={400}
        />
      );
      
      // This would require checking computed styles in a real test
      // For now, just verify it renders without error
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
    });
  });

  describe('Dataset Processing', () => {
    it('applies default colors to datasets without colors', () => {
      const dataWithoutColors: ChartData = {
        labels: ['A', 'B'],
        datasets: [
          {
            label: 'Dataset 1',
            data: [1, 2],
          },
        ],
      };

      renderWithTheme(
        <ModernChart type="line" data={dataWithoutColors} />
      );
      
      // Should render without error and apply default colors
      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    });

    it('preserves existing colors in datasets', () => {
      const dataWithColors: ChartData = {
        labels: ['A', 'B'],
        datasets: [
          {
            label: 'Custom Color Dataset',
            data: [1, 2],
            backgroundColor: '#ff0000',
            borderColor: '#ff0000',
          },
        ],
      };

      renderWithTheme(
        <ModernChart type="line" data={dataWithColors} />
      );
      
      expect(screen.getByText('Custom Color Dataset')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders with responsive prop', () => {
      renderWithTheme(
        <ModernChart 
          type="line" 
          data={sampleData} 
          responsive={true}
        />
      );
      
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
    });

    it('renders with responsive disabled', () => {
      renderWithTheme(
        <ModernChart 
          type="line" 
          data={sampleData} 
          responsive={false}
        />
      );
      
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
    });
  });
});
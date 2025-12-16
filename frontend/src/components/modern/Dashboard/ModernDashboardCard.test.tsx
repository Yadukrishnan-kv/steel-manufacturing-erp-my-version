/**
 * Modern Dashboard Card Component Tests
 * Unit tests and property-based tests for ModernDashboardCard
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithTheme } from '../testing/testUtils';
import { ModernDashboardCard } from './ModernDashboardCard';
import { Factory } from '@mui/icons-material';

describe('ModernDashboardCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: 42,
  };

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      renderWithTheme(<ModernDashboardCard {...defaultProps} />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with all optional props', () => {
      const props = {
        ...defaultProps,
        subtitle: 'Test subtitle',
        icon: <Factory data-testid="test-icon" />,
        color: '#ff0000',
        trend: {
          value: 15,
          direction: 'up' as const,
          label: 'vs last month',
        },
      };

      renderWithTheme(<ModernDashboardCard {...props} />);
      
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      renderWithTheme(<ModernDashboardCard {...defaultProps} loading />);
      
      // Should not show actual content when loading
      expect(screen.queryByText('Test Metric')).not.toBeInTheDocument();
      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('formats large numbers correctly', () => {
      renderWithTheme(<ModernDashboardCard title="Large Number" value={1500000} />);
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('formats thousands correctly', () => {
      renderWithTheme(<ModernDashboardCard title="Thousands" value={2500} />);
      expect(screen.getByText('2.5K')).toBeInTheDocument();
    });

    it('displays small numbers as-is', () => {
      renderWithTheme(<ModernDashboardCard title="Small Number" value={99} />);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('displays string values as-is', () => {
      renderWithTheme(<ModernDashboardCard title="String Value" value="Active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Trend Indicators', () => {
    it('displays positive trend correctly', () => {
      const props = {
        ...defaultProps,
        trend: { value: 10, direction: 'up' as const },
      };

      renderWithTheme(<ModernDashboardCard {...props} />);
      expect(screen.getByText('+10%')).toBeInTheDocument();
    });

    it('displays negative trend correctly', () => {
      const props = {
        ...defaultProps,
        trend: { value: -5, direction: 'down' as const },
      };

      renderWithTheme(<ModernDashboardCard {...props} />);
      expect(screen.getByText('-5%')).toBeInTheDocument();
    });

    it('displays neutral trend correctly', () => {
      const props = {
        ...defaultProps,
        trend: { value: 0, direction: 'neutral' as const },
      };

      renderWithTheme(<ModernDashboardCard {...props} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('calls onClick when clicked and interactive', () => {
      const handleClick = vi.fn();
      renderWithTheme(
        <ModernDashboardCard {...defaultProps} onClick={handleClick} data-testid="clickable-card" />
      );
      
      const card = screen.getByTestId('clickable-card');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when not interactive', () => {
      const handleClick = vi.fn();
      renderWithTheme(
        <ModernDashboardCard {...defaultProps} data-testid="non-clickable-card" />
      );
      
      const card = screen.getByTestId('non-clickable-card');
      fireEvent.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when interactive', () => {
      renderWithTheme(
        <ModernDashboardCard {...defaultProps} onClick={() => {}} data-testid="interactive-card" />
      );
      
      const card = screen.getByTestId('interactive-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('does not have interactive ARIA attributes when not interactive', () => {
      renderWithTheme(<ModernDashboardCard {...defaultProps} />);
      
      const card = screen.getByText('Test Metric').closest('div');
      expect(card).not.toHaveAttribute('role', 'button');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Custom Props', () => {
    it('forwards data-testid', () => {
      renderWithTheme(
        <ModernDashboardCard {...defaultProps} data-testid="custom-card" />
      );
      
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('forwards className', () => {
      renderWithTheme(
        <ModernDashboardCard {...defaultProps} className="custom-class" data-testid="class-card" />
      );
      
      const card = screen.getByTestId('class-card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards style prop', () => {
      const customStyle = { backgroundColor: 'red' };
      renderWithTheme(
        <ModernDashboardCard {...defaultProps} style={customStyle} data-testid="style-card" />
      );
      
      const card = screen.getByTestId('style-card');
      expect(card).toHaveStyle('background-color: rgb(255, 0, 0)');
    });
  });
});
/**
 * Theme System Tests
 * Tests for the modern design system implementation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { modernTheme, designTokens } from '../index';

// Test component that uses theme
const TestComponent: React.FC = () => {
  return (
    <div data-testid="test-component">
      Theme Test Component
    </div>
  );
};

describe('Modern Theme System', () => {
  it('should provide design tokens', () => {
    expect(designTokens).toBeDefined();
    expect(designTokens.colors).toBeDefined();
    expect(designTokens.typography).toBeDefined();
    expect(designTokens.spacing).toBeDefined();
    expect(designTokens.shadows).toBeDefined();
    expect(designTokens.borderRadius).toBeDefined();
  });

  it('should have correct primary colors', () => {
    expect(designTokens.colors.primary[500]).toBe('#64748b');
    expect(designTokens.colors.primary[600]).toBe('#475569');
  });

  it('should have correct spacing scale', () => {
    expect(designTokens.spacing[0]).toBe('0');
    expect(designTokens.spacing[1]).toBe('0.25rem');
    expect(designTokens.spacing[4]).toBe('1rem');
    expect(designTokens.spacing[8]).toBe('2rem');
  });

  it('should have Inter font family', () => {
    expect(designTokens.typography.fontFamily.primary).toContain('Inter');
  });

  it('should create modern theme successfully', () => {
    expect(modernTheme).toBeDefined();
    expect(modernTheme.custom).toBeDefined();
    expect(modernTheme.custom).toEqual(designTokens);
  });

  it('should render component with theme provider', () => {
    render(
      <ThemeProvider theme={modernTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should have correct Material-UI theme integration', () => {
    expect(modernTheme.palette.primary.main).toBe('#475569');
    expect(modernTheme.typography.fontFamily).toContain('Inter');
    expect(modernTheme.shape.borderRadius).toBeGreaterThan(0);
  });
});
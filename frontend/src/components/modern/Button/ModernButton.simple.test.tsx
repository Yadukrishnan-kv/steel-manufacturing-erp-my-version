/**
 * Simple Modern Button Component Tests
 * Basic tests to verify component functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';
import { ModernButton } from './ModernButton';
import { modernTheme } from '../../../theme/modernTheme';

// Simple wrapper for theme provider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={modernTheme}>
      {ui}
    </ThemeProvider>
  );
};

describe('ModernButton - Simple Tests', () => {
  it('renders with default props', () => {
    renderWithTheme(<ModernButton>Click me</ModernButton>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('renders primary variant', () => {
    renderWithTheme(
      <ModernButton variant="primary" data-testid="primary-button">
        Primary
      </ModernButton>
    );
    
    const button = screen.getByTestId('primary-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Primary');
  });

  it('renders secondary variant', () => {
    renderWithTheme(
      <ModernButton variant="secondary" data-testid="secondary-button">
        Secondary
      </ModernButton>
    );
    
    const button = screen.getByTestId('secondary-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Secondary');
  });

  it('handles disabled state', () => {
    renderWithTheme(
      <ModernButton disabled data-testid="disabled-button">
        Disabled
      </ModernButton>
    );
    
    const button = screen.getByTestId('disabled-button');
    expect(button).toBeDisabled();
  });

  it('handles loading state', () => {
    renderWithTheme(
      <ModernButton loading data-testid="loading-button">
        Loading
      </ModernButton>
    );
    
    const button = screen.getByTestId('loading-button');
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithTheme(
      <ModernButton onClick={handleClick} data-testid="clickable-button">
        Click me
      </ModernButton>
    );
    
    const button = screen.getByTestId('clickable-button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', () => {
    const handleClick = vi.fn();
    renderWithTheme(
      <ModernButton disabled onClick={handleClick} data-testid="disabled-button">
        Disabled
      </ModernButton>
    );
    
    const button = screen.getByTestId('disabled-button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders all sizes', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { unmount } = renderWithTheme(
        <ModernButton size={size} data-testid={`button-${size}`}>
          {size}
        </ModernButton>
      );
      
      const button = screen.getByTestId(`button-${size}`);
      expect(button).toBeInTheDocument();
      
      unmount();
    });
  });

  it('renders all variants', () => {
    const variants = ['primary', 'secondary', 'tertiary', 'ghost', 'danger'] as const;
    
    variants.forEach(variant => {
      const { unmount } = renderWithTheme(
        <ModernButton variant={variant} data-testid={`button-${variant}`}>
          {variant}
        </ModernButton>
      );
      
      const button = screen.getByTestId(`button-${variant}`);
      expect(button).toBeInTheDocument();
      
      unmount();
    });
  });

  it('renders as link when href is provided', () => {
    renderWithTheme(
      <ModernButton href="https://example.com" data-testid="link-button">
        Link Button
      </ModernButton>
    );
    
    const link = screen.getByTestId('link-button');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });
});
/**
 * Modern Button Component Tests
 * Comprehensive unit and property-based tests for ModernButton
 */

import { screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import { ModernButton } from './ModernButton';
import { renderWithTheme } from '../testing/testUtils';
import { 
  modernButtonPropsGen, 
  buttonVariantGen, 
  componentSizeGen, 
  buttonTextGen,
  booleanGen 
} from '../testing/generators';

describe('ModernButton', () => {
  // Unit Tests
  describe('Unit Tests', () => {
    it('renders with default props', () => {
      renderWithTheme(<ModernButton>Click me</ModernButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('renders all button variants', () => {
      const variants = ['primary', 'secondary', 'tertiary', 'ghost', 'danger'] as const;
      
      variants.forEach(variant => {
        const { unmount } = renderWithTheme(
          <ModernButton variant={variant} data-testid={`button-${variant}`}>
            {variant}
          </ModernButton>
        );
        
        const button = screen.getByTestId(`button-${variant}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(variant);
        
        unmount();
      });
    });

    it('renders all button sizes', () => {
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

    it('handles disabled state correctly', () => {
      renderWithTheme(
        <ModernButton disabled data-testid="disabled-button">
          Disabled
        </ModernButton>
      );
      
      const button = screen.getByTestId('disabled-button');
      expect(button).toBeDisabled();
    });

    it('handles loading state correctly', () => {
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

    it('prevents click when loading', () => {
      const handleClick = vi.fn();
      renderWithTheme(
        <ModernButton loading onClick={handleClick} data-testid="loading-button">
          Loading
        </ModernButton>
      );
      
      const button = screen.getByTestId('loading-button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders with start and end icons', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      
      renderWithTheme(
        <ModernButton 
          startIcon={<StartIcon />} 
          endIcon={<EndIcon />}
          data-testid="icon-button"
        >
          With Icons
        </ModernButton>
      );
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      
      renderWithTheme(
        <ModernButton 
          loading
          startIcon={<StartIcon />} 
          endIcon={<EndIcon />}
          data-testid="loading-icon-button"
        >
          Loading
        </ModernButton>
      );
      
      expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
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

    it('supports fullWidth prop', () => {
      renderWithTheme(
        <ModernButton fullWidth data-testid="full-width-button">
          Full Width
        </ModernButton>
      );
      
      const button = screen.getByTestId('full-width-button');
      expect(button).toBeInTheDocument();
    });
  });

  // Property-Based Tests
  describe('Property-Based Tests', () => {
    /**
     * **Feature: modern-ui-design-system, Property 4: Functional interface preservation**
     * **Validates: Requirements 11.1**
     */
    it('preserves functional interface across all prop combinations', () => {
      fc.assert(
        fc.property(
          modernButtonPropsGen,
          buttonTextGen,
          (props, text) => {
            const handleClick = vi.fn();
            const testId = `prop-test-button-${Math.random().toString(36).substr(2, 9)}`;
            
            const { unmount } = renderWithTheme(
              <ModernButton {...props} onClick={handleClick} data-testid={testId}>
                {text}
              </ModernButton>
            );
            
            const button = screen.getByTestId(testId);
            
            // Button should always render
            expect(button).toBeInTheDocument();
            
            // Button should have correct text content (normalize whitespace)
            const normalizedText = text.trim();
            if (normalizedText) {
              expect(button.textContent?.trim()).toBe(normalizedText);
            }
            
            // Button should be clickable unless disabled or loading
            const isInteractive = !props.disabled && !props.loading;
            
            if (isInteractive) {
              fireEvent.click(button);
              expect(handleClick).toHaveBeenCalled();
            } else {
              fireEvent.click(button);
              expect(handleClick).not.toHaveBeenCalled();
            }
            
            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: modern-ui-design-system, Property 7: Interactive state feedback**
     * **Validates: Requirements 3.3, 8.2**
     */
    it('provides interactive state feedback for all variants', () => {
      fc.assert(
        fc.property(
          buttonVariantGen,
          componentSizeGen,
          booleanGen,
          (variant, size, disabled) => {
            const testId = `interactive-test-button-${Math.random().toString(36).substr(2, 9)}`;
            const { unmount } = renderWithTheme(
              <ModernButton 
                variant={variant} 
                size={size} 
                disabled={disabled}
                data-testid={testId}
              >
                Test Button
              </ModernButton>
            );
            
            const button = screen.getByTestId(testId);
            
            // Button should always render
            expect(button).toBeInTheDocument();
            
            // Check interactive states
            if (!disabled) {
              // Should be focusable
              button.focus();
              expect(document.activeElement).toBe(button);
              
              // Should respond to hover (we can't test visual changes easily, but structure should remain)
              fireEvent.mouseEnter(button);
              fireEvent.mouseLeave(button);
              
              // Button should still be in document after interactions
              expect(button).toBeInTheDocument();
            } else {
              // Disabled buttons should not be interactive
              expect(button).toBeDisabled();
            }
            
            unmount();
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('maintains consistent behavior across all size and variant combinations', () => {
      fc.assert(
        fc.property(
          buttonVariantGen,
          componentSizeGen,
          buttonTextGen,
          (variant, size, text) => {
            const handleClick = vi.fn();
            const testId = `consistency-test-button-${Math.random().toString(36).substr(2, 9)}`;
            
            const { unmount } = renderWithTheme(
              <ModernButton 
                variant={variant} 
                size={size} 
                onClick={handleClick}
                data-testid={testId}
              >
                {text}
              </ModernButton>
            );
            
            const button = screen.getByTestId(testId);
            
            // All combinations should render successfully
            expect(button).toBeInTheDocument();
            
            // Check text content (normalize whitespace)
            const normalizedText = text.trim();
            if (normalizedText) {
              expect(button.textContent?.trim()).toBe(normalizedText);
            }
            
            // All combinations should be clickable by default
            fireEvent.click(button);
            expect(handleClick).toHaveBeenCalledTimes(1);
            
            // Button should maintain its role
            expect(button).toHaveAttribute('type', 'button');
            
            unmount();
            return true;
          }
        ),
        { numRuns: 40 }
      );
    });

    it('handles edge cases gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.option(buttonVariantGen, { nil: undefined }),
            size: fc.option(componentSizeGen, { nil: undefined }),
            disabled: fc.option(booleanGen, { nil: undefined }),
            loading: fc.option(booleanGen, { nil: undefined }),
            fullWidth: fc.option(booleanGen, { nil: undefined }),
          }),
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            buttonTextGen,
            fc.constant(null),
            fc.constant(undefined)
          ),
          (props, children) => {
            try {
              const testId = `edge-case-button-${Math.random().toString(36).substr(2, 9)}`;
              const { unmount } = renderWithTheme(
                <ModernButton {...props} data-testid={testId}>
                  {children}
                </ModernButton>
              );
              
              const button = screen.getByTestId(testId);
              
              // Should always render without crashing
              expect(button).toBeInTheDocument();
              
              unmount();
              return true;
            } catch (error) {
              // Should not throw errors for any prop combination
              return false;
            }
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('integrates properly with theme system', () => {
      renderWithTheme(
        <ModernButton variant="primary" data-testid="themed-button">
          Themed Button
        </ModernButton>
      );
      
      const button = screen.getByTestId('themed-button');
      expect(button).toBeInTheDocument();
      
      // Should have theme-based styling (we can't easily test computed styles in jsdom)
      // But we can verify the component renders without errors
    });

    it('works with form submission', () => {
      const handleSubmit = vi.fn(e => e.preventDefault());
      
      renderWithTheme(
        <form onSubmit={handleSubmit}>
          <ModernButton type="submit" data-testid="submit-button">
            Submit
          </ModernButton>
        </form>
      );
      
      const button = screen.getByTestId('submit-button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
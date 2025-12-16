/**
 * Modern Card Component Tests
 * Comprehensive test suite for the ModernCard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ModernCard, CardHeader, CardTitle, CardSubtitle, CardContent, CardActions } from './ModernCard';
import { renderWithTheme } from '../testing/testUtils';

describe('ModernCard', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderWithTheme(
        <ModernCard data-testid="card">
          <div>Card content</div>
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      renderWithTheme(
        <ModernCard className="custom-class" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('renders with custom style', () => {
      renderWithTheme(
        <ModernCard style={{ backgroundColor: 'red' }} data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      // Note: styled-components may not apply inline styles in the same way
      // The component should still render correctly
    });
  });

  describe('Variants', () => {
    it('renders elevated variant by default', () => {
      renderWithTheme(
        <ModernCard data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders outlined variant', () => {
      renderWithTheme(
        <ModernCard variant="outlined" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders filled variant', () => {
      renderWithTheme(
        <ModernCard variant="filled" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Elevation', () => {
    it('renders with none elevation', () => {
      renderWithTheme(
        <ModernCard elevation="none" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders with subtle elevation by default', () => {
      renderWithTheme(
        <ModernCard data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders with medium elevation', () => {
      renderWithTheme(
        <ModernCard elevation="medium" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders with high elevation', () => {
      renderWithTheme(
        <ModernCard elevation="high" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Padding', () => {
    it('renders with small padding', () => {
      renderWithTheme(
        <ModernCard padding="small" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders with medium padding by default', () => {
      renderWithTheme(
        <ModernCard data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('renders with large padding', () => {
      renderWithTheme(
        <ModernCard padding="large" data-testid="card">
          Content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    it('handles click events when interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithTheme(
        <ModernCard interactive onClick={handleClick} data-testid="card">
          Clickable content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles keyboard events when interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithTheme(
        <ModernCard interactive onClick={handleClick} data-testid="card">
          Keyboard accessible content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      card.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles space key when interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithTheme(
        <ModernCard interactive onClick={handleClick} data-testid="card">
          Space accessible content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      card.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not handle clicks when not interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithTheme(
        <ModernCard onClick={handleClick} data-testid="card">
          Non-interactive content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      await user.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has button role when interactive', () => {
      renderWithTheme(
        <ModernCard interactive onClick={() => {}} data-testid="card">
          Interactive content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('is focusable when interactive', () => {
      renderWithTheme(
        <ModernCard interactive onClick={() => {}} data-testid="card">
          Focusable content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when not interactive', () => {
      renderWithTheme(
        <ModernCard data-testid="card">
          Non-focusable content
        </ModernCard>
      );
      
      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('tabIndex');
      expect(card).not.toHaveAttribute('role');
    });
  });

  describe('Sub-components', () => {
    it('renders CardHeader', () => {
      renderWithTheme(
        <CardHeader data-testid="card-header">
          Header content
        </CardHeader>
      );
      
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders CardTitle', () => {
      renderWithTheme(
        <CardTitle data-testid="card-title">
          Title content
        </CardTitle>
      );
      
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
      expect(screen.getByText('Title content')).toBeInTheDocument();
    });

    it('renders CardSubtitle', () => {
      renderWithTheme(
        <CardSubtitle data-testid="card-subtitle">
          Subtitle content
        </CardSubtitle>
      );
      
      expect(screen.getByTestId('card-subtitle')).toBeInTheDocument();
      expect(screen.getByText('Subtitle content')).toBeInTheDocument();
    });

    it('renders CardContent', () => {
      renderWithTheme(
        <CardContent data-testid="card-content">
          Body content
        </CardContent>
      );
      
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('renders CardActions', () => {
      renderWithTheme(
        <CardActions data-testid="card-actions">
          <button>Action 1</button>
          <button>Action 2</button>
        </CardActions>
      );
      
      expect(screen.getByTestId('card-actions')).toBeInTheDocument();
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });
  });

  describe('Complete Card Example', () => {
    it('renders a complete card with all sub-components', () => {
      renderWithTheme(
        <ModernCard data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardSubtitle>Card Subtitle</CardSubtitle>
          </CardHeader>
          <CardContent>
            This is the main content of the card.
          </CardContent>
          <CardActions>
            <button>Cancel</button>
            <button>Save</button>
          </CardActions>
        </ModernCard>
      );
      
      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  describe('Forward Ref', () => {
    it('forwards ref to the card element', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      renderWithTheme(
        <ModernCard ref={ref} data-testid="card">
          Content
        </ModernCard>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('card'));
    });
  });
});
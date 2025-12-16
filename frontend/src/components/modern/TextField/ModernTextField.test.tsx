/**
 * Modern TextField Component Tests
 * Comprehensive test suite for the ModernTextField component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ModernTextField } from './ModernTextField';
import { renderWithTheme } from '../testing/testUtils';

describe('ModernTextField', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderWithTheme(<ModernTextField data-testid="textfield" />);
      
      const input = screen.getByTestId('textfield');
      expect(input).toBeInTheDocument();
    });

    it('renders with label', () => {
      renderWithTheme(
        <ModernTextField 
          label="Test Label" 
          data-testid="textfield" 
        />
      );
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      renderWithTheme(
        <ModernTextField 
          placeholder="Enter text here" 
          data-testid="textfield" 
        />
      );
      
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      renderWithTheme(
        <ModernTextField 
          helperText="This is helper text" 
          data-testid="textfield" 
        />
      );
      
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders outlined variant by default', () => {
      renderWithTheme(<ModernTextField data-testid="textfield" />);
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });

    it('renders filled variant', () => {
      renderWithTheme(
        <ModernTextField 
          variant="filled" 
          data-testid="textfield" 
        />
      );
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });

    it('renders underlined variant', () => {
      renderWithTheme(
        <ModernTextField 
          variant="underlined" 
          data-testid="textfield" 
        />
      );
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      renderWithTheme(
        <ModernTextField 
          size="small" 
          data-testid="textfield" 
        />
      );
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });

    it('renders medium size by default', () => {
      renderWithTheme(<ModernTextField data-testid="textfield" />);
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });

    it('renders large size', () => {
      renderWithTheme(
        <ModernTextField 
          size="large" 
          data-testid="textfield" 
        />
      );
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('renders error state', () => {
      renderWithTheme(
        <ModernTextField 
          error 
          helperText="Error message" 
          data-testid="textfield" 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      renderWithTheme(
        <ModernTextField 
          disabled 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('renders required state', () => {
      renderWithTheme(
        <ModernTextField 
          required 
          label="Required Field" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('renders full width', () => {
      renderWithTheme(
        <ModernTextField 
          fullWidth 
          data-testid="textfield" 
        />
      );
      
      const container = screen.getByTestId('textfield');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      renderWithTheme(
        <ModernTextField 
          onChange={handleChange} 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test value');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles focus events', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      
      renderWithTheme(
        <ModernTextField 
          onFocus={handleFocus} 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('handles blur events', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      
      renderWithTheme(
        <ModernTextField 
          onBlur={handleBlur} 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Adornments', () => {
    it('renders start adornment', () => {
      renderWithTheme(
        <ModernTextField 
          startAdornment={<span data-testid="start-icon">$</span>}
          data-testid="textfield" 
        />
      );
      
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('renders end adornment', () => {
      renderWithTheme(
        <ModernTextField 
          endAdornment={<span data-testid="end-icon">@</span>}
          data-testid="textfield" 
        />
      );
      
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('renders email input type', () => {
      renderWithTheme(
        <ModernTextField 
          type="email" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input type', () => {
      renderWithTheme(
        <ModernTextField 
          type="password" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input type', () => {
      renderWithTheme(
        <ModernTextField 
          type="number" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      renderWithTheme(
        <ModernTextField 
          label="Accessible Label" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByLabelText('Accessible Label');
      expect(input).toBeInTheDocument();
    });

    it('supports custom id', () => {
      renderWithTheme(
        <ModernTextField 
          id="custom-id" 
          label="Custom ID Field" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('supports autoComplete', () => {
      renderWithTheme(
        <ModernTextField 
          autoComplete="email" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('supports autoFocus', () => {
      renderWithTheme(
        <ModernTextField 
          autoFocus 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('Form Integration', () => {
    it('works with form submission', () => {
      const handleSubmit = vi.fn(e => e.preventDefault());
      
      renderWithTheme(
        <form onSubmit={handleSubmit}>
          <ModernTextField 
            name="test-field" 
            data-testid="textfield" 
          />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </form>
      );
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('supports name attribute', () => {
      renderWithTheme(
        <ModernTextField 
          name="test-name" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'test-name');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as controlled component', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <ModernTextField 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="textfield" 
          />
        );
      };
      
      renderWithTheme(<TestComponent />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'controlled');
      
      expect(input).toHaveValue('controlled');
    });

    it('works as uncontrolled component', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <ModernTextField 
          defaultValue="uncontrolled" 
          data-testid="textfield" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('uncontrolled');
      
      await user.clear(input);
      await user.type(input, 'new value');
      
      expect(input).toHaveValue('new value');
    });
  });
});
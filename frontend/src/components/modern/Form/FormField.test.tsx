/**
 * Form Field Component Tests
 * Test suite for react-hook-form integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { vi } from 'vitest';
import { FormField } from './FormField';
import { renderWithTheme } from '../testing/testUtils';

// Test component that uses FormField with react-hook-form
const TestFormComponent = ({ 
  onSubmit = vi.fn(), 
  defaultValues = {},
  rules = {},
  ...fieldProps 
}) => {
  const { control, handleSubmit } = useForm({
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="test-form">
      <FormField
        name="testField"
        control={control}
        rules={rules}
        data-testid="form-field"
        {...fieldProps}
      />
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  );
};

describe('FormField', () => {
  describe('Basic Rendering', () => {
    it('renders with react-hook-form control', () => {
      renderWithTheme(
        <TestFormComponent label="Test Field" />
      );
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      renderWithTheme(
        <TestFormComponent 
          label="Test Field"
          defaultValues={{ testField: 'default value' }}
        />
      );
      
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveValue('default value');
    });
  });

  describe('Validation', () => {
    it('shows validation error for required field', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TestFormComponent 
          label="Required Field"
          rules={{ required: 'This field is required' }}
        />
      );
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for pattern mismatch', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TestFormComponent 
          label="Email Field"
          rules={{ 
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email format'
            }
          }}
        />
      );
      
      const input = screen.getByLabelText('Email Field');
      await user.type(input, 'invalid-email');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('shows validation error for minimum length', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TestFormComponent 
          label="Password Field"
          rules={{ 
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          }}
        />
      );
      
      const input = screen.getByLabelText('Password Field');
      await user.type(input, '123');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('clears validation error when field becomes valid', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TestFormComponent 
          label="Required Field"
          rules={{ required: 'This field is required' }}
        />
      );
      
      const input = screen.getByLabelText('Required Field');
      const submitButton = screen.getByTestId('submit-button');
      
      // Trigger validation error
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
      
      // Fix the error
      await user.type(input, 'valid value');
      
      await waitFor(() => {
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Value Transformations', () => {
    it('transforms input values', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      renderWithTheme(
        <TestFormComponent 
          label="Uppercase Field"
          onSubmit={onSubmit}
          transform={{
            output: (event) => event.target.value.toUpperCase()
          }}
        />
      );
      
      const input = screen.getByLabelText('Uppercase Field');
      await user.type(input, 'lowercase');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            testField: 'LOWERCASE'
          }),
          expect.any(Object)
        );
      });
    });

    it('transforms display values', () => {
      renderWithTheme(
        <TestFormComponent 
          label="Formatted Field"
          defaultValues={{ testField: 'raw value' }}
          transform={{
            input: (value) => value ? `Formatted: ${value}` : ''
          }}
        />
      );
      
      const input = screen.getByLabelText('Formatted Field');
      expect(input).toHaveValue('Formatted: raw value');
    });
  });

  describe('Form Integration', () => {
    it('submits form with field value', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      renderWithTheme(
        <TestFormComponent 
          label="Test Field"
          onSubmit={onSubmit}
        />
      );
      
      const input = screen.getByLabelText('Test Field');
      await user.type(input, 'test value');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            testField: 'test value'
          }),
          expect.any(Object)
        );
      });
    });

    it('handles form reset', async () => {
      const user = userEvent.setup();
      
      const TestResetComponent = () => {
        const { control, handleSubmit, reset } = useForm({
          defaultValues: { testField: '' }
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <FormField
              name="testField"
              control={control}
              label="Test Field"
            />
            <button 
              type="button" 
              onClick={() => reset()}
              data-testid="reset-button"
            >
              Reset
            </button>
          </form>
        );
      };
      
      renderWithTheme(<TestResetComponent />);
      
      const input = screen.getByLabelText('Test Field');
      await user.type(input, 'some value');
      expect(input).toHaveValue('some value');
      
      const resetButton = screen.getByTestId('reset-button');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Field Props Passthrough', () => {
    it('passes through TextField props', () => {
      renderWithTheme(
        <TestFormComponent 
          label="Test Field"
          placeholder="Enter text here"
          helperText="This is helper text"
          size="large"
          variant="filled"
        />
      );
      
      const input = screen.getByLabelText('Test Field');
      expect(input).toHaveAttribute('placeholder', 'Enter text here');
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('overrides helper text with error message', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TestFormComponent 
          label="Test Field"
          helperText="Normal helper text"
          rules={{ required: 'Field is required' }}
        />
      );
      
      // Initially shows helper text
      expect(screen.getByText('Normal helper text')).toBeInTheDocument();
      
      // Trigger validation
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      // Should show error message instead
      await waitFor(() => {
        expect(screen.getByText('Field is required')).toBeInTheDocument();
        expect(screen.queryByText('Normal helper text')).not.toBeInTheDocument();
      });
    });
  });
});
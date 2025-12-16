/**
 * Masked Form Field Component
 * A form field component with input masking capabilities
 */

import React from 'react';
import { Controller, FieldPath, FieldValues, Control } from 'react-hook-form';
import { ModernTextField } from '../TextField/ModernTextField';
import { ModernTextFieldProps } from '../types';
import { inputMasks, InputMaskType, InputMask } from './inputMasks';

export interface MaskedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ModernTextFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'helperText' | 'placeholder' | 'maxLength'> {
  name: TName;
  control: Control<TFieldValues>;
  mask: InputMaskType | InputMask;
  rules?: Parameters<typeof Controller>[0]['rules'];
  defaultValue?: Parameters<typeof Controller>[0]['defaultValue'];
  shouldUnregister?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Masked Form Field Component
 * 
 * A form field that applies input masking for common formats like phone numbers,
 * credit cards, dates, etc. Integrates with react-hook-form for validation.
 * 
 * @param name - Field name for form registration
 * @param control - React Hook Form control object
 * @param mask - Mask type or custom mask configuration
 * @param rules - Validation rules for the field
 * @param defaultValue - Default value for the field
 * @param shouldUnregister - Whether to unregister field on unmount
 * @param placeholder - Custom placeholder (overrides mask default)
 * @param maxLength - Custom max length (overrides mask default)
 */
export function MaskedFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  mask,
  rules,
  defaultValue,
  shouldUnregister,
  placeholder,
  maxLength,
  ...textFieldProps
}: MaskedFormFieldProps<TFieldValues, TName>) {
  // Get mask configuration
  const maskConfig = typeof mask === 'string' ? inputMasks[mask] : mask;
  
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState }) => {
        const { onChange, onBlur, value, ref } = field;
        const { error } = fieldState;
        
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const inputValue = event.target.value;
          const formattedValue = maskConfig.format(inputValue);
          
          // Update the input display
          event.target.value = formattedValue;
          
          // Store the parsed value (unmasked) in the form
          const parsedValue = maskConfig.parse 
            ? maskConfig.parse(formattedValue)
            : formattedValue;
          
          onChange(parsedValue);
        };
        
        // Format the display value
        const displayValue = value ? maskConfig.format(value) : '';
        
        return (
          <ModernTextField
            {...textFieldProps}
            ref={ref}
            name={name}
            value={displayValue}
            onChange={handleChange}
            onBlur={onBlur}
            error={!!error}
            helperText={error?.message || textFieldProps.helperText}
            placeholder={placeholder || maskConfig.placeholder}
            maxLength={maxLength || maskConfig.maxLength}
          />
        );
      }}
    />
  );
}

export default MaskedFormField;
/**
 * Form Field Component
 * A wrapper component that integrates ModernTextField with react-hook-form
 */

import React from 'react';
import { Controller, FieldPath, FieldValues, Control } from 'react-hook-form';
import { ModernTextField } from '../TextField/ModernTextField';
import { ModernTextFieldProps } from '../types';

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ModernTextFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'helperText'> {
  name: TName;
  control: Control<TFieldValues>;
  rules?: Parameters<typeof Controller>[0]['rules'];
  defaultValue?: Parameters<typeof Controller>[0]['defaultValue'];
  shouldUnregister?: boolean;
  transform?: {
    input?: (value: any) => any;
    output?: (event: React.ChangeEvent<HTMLInputElement>) => any;
  };
}

/**
 * Form Field Component
 * 
 * A wrapper around ModernTextField that integrates seamlessly with react-hook-form.
 * Handles validation, error display, and form state management automatically.
 * 
 * @param name - Field name for form registration
 * @param control - React Hook Form control object
 * @param rules - Validation rules for the field
 * @param defaultValue - Default value for the field
 * @param shouldUnregister - Whether to unregister field on unmount
 * @param transform - Input/output value transformations
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  transform,
  ...textFieldProps
}: FormFieldProps<TFieldValues, TName>) {
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
          const newValue = transform?.output 
            ? transform.output(event)
            : event.target.value;
          onChange(newValue);
        };
        
        const displayValue = transform?.input 
          ? transform.input(value)
          : value ?? '';
        
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
          />
        );
      }}
    />
  );
}

export default FormField;
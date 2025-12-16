/**
 * Validation Rules
 * Common validation rules for use with react-hook-form
 */

import { RegisterOptions } from 'react-hook-form';

// Email validation
export const emailValidation: RegisterOptions = {
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address',
  },
};

// Password validation
export const passwordValidation: RegisterOptions = {
  required: 'Password is required',
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters long',
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
};

// Phone number validation
export const phoneValidation: RegisterOptions = {
  required: 'Phone number is required',
  pattern: {
    value: /^\d{10}$/,
    message: 'Please enter a valid 10-digit phone number',
  },
};

// Required field validation
export const requiredValidation = (fieldName: string): RegisterOptions => ({
  required: `${fieldName} is required`,
});

// Minimum length validation
export const minLengthValidation = (length: number, fieldName: string = 'Field'): RegisterOptions => ({
  minLength: {
    value: length,
    message: `${fieldName} must be at least ${length} characters long`,
  },
});

// Maximum length validation
export const maxLengthValidation = (length: number, fieldName: string = 'Field'): RegisterOptions => ({
  maxLength: {
    value: length,
    message: `${fieldName} must not exceed ${length} characters`,
  },
});

// Numeric validation
export const numericValidation: RegisterOptions = {
  pattern: {
    value: /^\d+(\.\d+)?$/,
    message: 'Please enter a valid number',
  },
};

// Integer validation
export const integerValidation: RegisterOptions = {
  pattern: {
    value: /^\d+$/,
    message: 'Please enter a valid whole number',
  },
};

// Positive number validation
export const positiveNumberValidation: RegisterOptions = {
  validate: (value) => {
    const num = parseFloat(value);
    return num > 0 || 'Value must be greater than 0';
  },
};

// Range validation
export const rangeValidation = (min: number, max: number, fieldName: string = 'Value'): RegisterOptions => ({
  validate: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < min || num > max) return `${fieldName} must be between ${min} and ${max}`;
    return true;
  },
});

// Date validation
export const dateValidation: RegisterOptions = {
  required: 'Date is required',
  pattern: {
    value: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/,
    message: 'Please enter a valid date (MM/DD/YYYY)',
  },
  validate: (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) || 'Please enter a valid date';
  },
};

// Future date validation
export const futureDateValidation: RegisterOptions = {
  ...dateValidation,
  validate: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) return 'Please enter a valid date';
    if (date <= today) return 'Date must be in the future';
    return true;
  },
};

// Past date validation
export const pastDateValidation: RegisterOptions = {
  ...dateValidation,
  validate: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (isNaN(date.getTime())) return 'Please enter a valid date';
    if (date >= today) return 'Date must be in the past';
    return true;
  },
};

// URL validation
export const urlValidation: RegisterOptions = {
  pattern: {
    value: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: 'Please enter a valid URL',
  },
};

// Credit card validation (basic Luhn algorithm)
export const creditCardValidation: RegisterOptions = {
  required: 'Credit card number is required',
  validate: (value) => {
    // Remove spaces and non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Check length
    if (cleaned.length < 13 || cleaned.length > 19) {
      return 'Credit card number must be between 13 and 19 digits';
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0 || 'Please enter a valid credit card number';
  },
};

// SSN validation
export const ssnValidation: RegisterOptions = {
  required: 'Social Security Number is required',
  pattern: {
    value: /^\d{9}$/,
    message: 'Please enter a valid 9-digit Social Security Number',
  },
};

// ZIP code validation
export const zipCodeValidation: RegisterOptions = {
  required: 'ZIP code is required',
  pattern: {
    value: /^\d{5}(-\d{4})?$/,
    message: 'Please enter a valid ZIP code',
  },
};

// Percentage validation
export const percentageValidation: RegisterOptions = {
  required: 'Percentage is required',
  validate: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid percentage';
    if (num < 0 || num > 100) return 'Percentage must be between 0 and 100';
    return true;
  },
};

// Currency validation
export const currencyValidation: RegisterOptions = {
  required: 'Amount is required',
  pattern: {
    value: /^\d+(\.\d{1,2})?$/,
    message: 'Please enter a valid amount (e.g., 10.50)',
  },
  validate: (value) => {
    const num = parseFloat(value);
    return num >= 0 || 'Amount must be positive';
  },
};

// Confirm password validation
export const confirmPasswordValidation = (password: string): RegisterOptions => ({
  required: 'Please confirm your password',
  validate: (value) => value === password || 'Passwords do not match',
});

// Custom validation helper
export const customValidation = (
  validator: (value: any) => boolean | string,
  message: string = 'Invalid value'
): RegisterOptions => ({
  validate: (value) => validator(value) || message,
});

// Combine multiple validation rules
export const combineValidations = (...validations: RegisterOptions[]): RegisterOptions => {
  return validations.reduce((combined, validation) => ({
    ...combined,
    ...validation,
    validate: (value) => {
      // Run all validate functions
      for (const val of validations) {
        if (val.validate) {
          const result = typeof val.validate === 'function' 
            ? val.validate(value)
            : val.validate;
          if (result !== true) return result;
        }
      }
      return true;
    },
  }), {});
};
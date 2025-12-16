/**
 * Input Mask Utilities
 * Provides common input formatting and masking functions
 */

// Phone number mask (US format)
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply formatting based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

// Credit card mask
export const formatCreditCard = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Add spaces every 4 digits
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

// Social Security Number mask
export const formatSSN = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply SSN formatting
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  }
};

// Currency mask
export const formatCurrency = (value: string): string => {
  // Remove all non-digits and decimal points
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (parts[1] && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }
  
  return cleaned;
};

// Percentage mask
export const formatPercentage = (value: string): string => {
  // Remove all non-digits and decimal points
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Convert to number and limit to 100
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  
  return Math.min(num, 100).toString();
};

// Date mask (MM/DD/YYYY)
export const formatDate = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply date formatting
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

// Time mask (HH:MM)
export const formatTime = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply time formatting
  if (digits.length <= 2) {
    return digits;
  } else {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
};

// Postal code mask (US ZIP)
export const formatZipCode = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply ZIP code formatting
  if (digits.length <= 5) {
    return digits;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  }
};

// Generic numeric mask with decimal places
export const formatNumeric = (value: string, decimalPlaces: number = 2): string => {
  // Remove all non-digits and decimal points
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  if (parts[1] && parts[1].length > decimalPlaces) {
    return parts[0] + '.' + parts[1].slice(0, decimalPlaces);
  }
  
  return cleaned;
};

// Input mask type definitions
export interface InputMask {
  format: (value: string) => string;
  parse?: (value: string) => string;
  placeholder?: string;
  maxLength?: number;
}

// Predefined masks
export const inputMasks = {
  phone: {
    format: formatPhoneNumber,
    parse: (value: string) => value.replace(/\D/g, ''),
    placeholder: '(555) 123-4567',
    maxLength: 14,
  },
  creditCard: {
    format: formatCreditCard,
    parse: (value: string) => value.replace(/\D/g, ''),
    placeholder: '1234 5678 9012 3456',
    maxLength: 19,
  },
  ssn: {
    format: formatSSN,
    parse: (value: string) => value.replace(/\D/g, ''),
    placeholder: '123-45-6789',
    maxLength: 11,
  },
  currency: {
    format: formatCurrency,
    parse: (value: string) => value.replace(/[^\d.]/g, ''),
    placeholder: '0.00',
  },
  percentage: {
    format: formatPercentage,
    parse: (value: string) => value.replace(/[^\d.]/g, ''),
    placeholder: '0',
    maxLength: 6,
  },
  date: {
    format: formatDate,
    parse: (value: string) => value.replace(/\D/g, ''),
    placeholder: 'MM/DD/YYYY',
    maxLength: 10,
  },
  time: {
    format: formatTime,
    parse: (value: string) => value.replace(/\D/g, ''),
    placeholder: 'HH:MM',
    maxLength: 5,
  },
  zipCode: {
    format: formatZipCode,
    parse: (value: string) => value.replace(/\D/g, ''),
    placeholder: '12345-6789',
    maxLength: 10,
  },
} as const;

export type InputMaskType = keyof typeof inputMasks;
/**
 * Property-Based Testing Generators
 * Fast-check generators for modern component testing
 */

import * as fc from 'fast-check';
import { ComponentSize, ComponentColor, ButtonVariant, CardElevation } from '../types';

// Basic generators
export const componentSizeGen = fc.constantFrom<ComponentSize>('small', 'medium', 'large');
export const componentColorGen = fc.constantFrom<ComponentColor>('primary', 'secondary', 'success', 'warning', 'error', 'info');
export const buttonVariantGen = fc.constantFrom<ButtonVariant>('primary', 'secondary', 'tertiary', 'ghost', 'danger');
export const cardElevationGen = fc.constantFrom<CardElevation>('none', 'subtle', 'medium', 'high');

// String generators
export const buttonTextGen = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
export const classNameGen = fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(s));
export const dataTestIdGen = fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(s));

// Boolean generators
export const booleanGen = fc.boolean();

// Props generators for components
export const modernButtonPropsGen = fc.record({
  variant: fc.option(buttonVariantGen, { nil: undefined }),
  size: fc.option(componentSizeGen, { nil: undefined }),
  disabled: fc.option(booleanGen, { nil: undefined }),
  loading: fc.option(booleanGen, { nil: undefined }),
  fullWidth: fc.option(booleanGen, { nil: undefined }),
  className: fc.option(classNameGen, { nil: undefined }),
  'data-testid': fc.option(dataTestIdGen, { nil: undefined }),
});

// Theme-related generators
export const colorValueGen = fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`);
export const spacingValueGen = fc.integer({ min: 0, max: 100 }).map(px => `${px}px`);
export const borderRadiusGen = fc.integer({ min: 0, max: 20 }).map(px => `${px}px`);

// CSS property generators
export const cssColorGen = fc.oneof(
  colorValueGen,
  fc.constantFrom('transparent', 'inherit', 'currentColor')
);

export const cssSizeGen = fc.oneof(
  fc.integer({ min: 0, max: 1000 }).map(px => `${px}px`),
  fc.integer({ min: 0, max: 100 }).map(rem => `${rem}rem`),
  fc.constantFrom('auto', '100%', 'fit-content', 'max-content', 'min-content')
);

// Event generators
export const mouseEventGen = fc.record({
  type: fc.constant('click'),
  bubbles: fc.boolean(),
  cancelable: fc.boolean(),
  button: fc.integer({ min: 0, max: 2 }),
});

// Accessibility generators
export const ariaLabelGen = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
export const roleGen = fc.constantFrom('button', 'link', 'menuitem', 'tab', 'option');

// Complex component state generators
export const buttonStateGen = fc.record({
  variant: buttonVariantGen,
  size: componentSizeGen,
  disabled: booleanGen,
  loading: booleanGen,
  fullWidth: booleanGen,
  hasStartIcon: booleanGen,
  hasEndIcon: booleanGen,
  hasText: booleanGen,
});

// Theme consistency generators
export const themeColorScaleGen = fc.record({
  50: colorValueGen,
  100: colorValueGen,
  200: colorValueGen,
  300: colorValueGen,
  400: colorValueGen,
  500: colorValueGen,
  600: colorValueGen,
  700: colorValueGen,
  800: colorValueGen,
  900: colorValueGen,
});

export const typographyScaleGen = fc.record({
  xs: cssSizeGen,
  sm: cssSizeGen,
  base: cssSizeGen,
  lg: cssSizeGen,
  xl: cssSizeGen,
  '2xl': cssSizeGen,
  '3xl': cssSizeGen,
  '4xl': cssSizeGen,
});

// Responsive breakpoint generators
export const breakpointGen = fc.constantFrom('sm', 'md', 'lg', 'xl');
export const screenSizeGen = fc.record({
  width: fc.integer({ min: 320, max: 2560 }),
  height: fc.integer({ min: 240, max: 1440 }),
});

// Form interaction generators
export const formInputGen = fc.record({
  value: fc.string({ maxLength: 1000 }),
  placeholder: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  required: booleanGen,
  disabled: booleanGen,
  error: booleanGen,
});

// Navigation item generators
export const navigationItemGen = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  path: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  active: booleanGen,
  disabled: booleanGen,
});

// Layout generators
export const layoutDirectionGen = fc.constantFrom('row', 'column');
export const alignmentGen = fc.constantFrom('start', 'center', 'end', 'stretch');
export const justificationGen = fc.constantFrom('start', 'center', 'end', 'between', 'around', 'evenly');

// Performance-related generators
export const renderCountGen = fc.integer({ min: 1, max: 1000 });
export const animationDurationGen = fc.integer({ min: 0, max: 5000 }).map(ms => `${ms}ms`);

// Utility functions for generators
export const generateValidProps = <T>(generator: fc.Arbitrary<T>, count: number = 10): T[] => {
  return fc.sample(generator, count);
};

export const generateEdgeCases = () => ({
  emptyString: '',
  longString: 'a'.repeat(1000),
  specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  unicode: '🚀 Hello 世界 🌟',
  whitespace: '   \t\n   ',
});

// Constraint helpers
export const nonEmptyString = (gen: fc.Arbitrary<string>) => 
  gen.filter(s => s.trim().length > 0);

export const validClassName = (gen: fc.Arbitrary<string>) => 
  gen.filter(s => /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(s));

export const validColor = (gen: fc.Arbitrary<string>) => 
  gen.filter(s => /^#[0-9a-fA-F]{6}$/.test(s) || ['transparent', 'inherit', 'currentColor'].includes(s));
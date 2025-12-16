/**
 * Modern Component Library - Main Export Module
 * Comprehensive export of all modern components and utilities
 */

// Core types and interfaces
export type {
  BaseComponentProps,
  ThemedComponentProps,
  InteractiveStates,
  ComponentVariant,
  ComponentSize,
  ComponentColor,
  ButtonVariant,
  ModernButtonProps,
  CardElevation,
  CardVariant,
  ModernCardProps,
  InputVariant,
  ModernInputProps,
  ModernTextFieldProps,
  ModernLayoutProps,
  ModernSidebarProps,
  ModernAppBarProps,
  NavigationItem,
  ComponentStyles,
  ModernThemeExtension,
} from './types';

// Utility functions
export {
  getSpacing,
  getColor,
  getSizeStyles,
  getButtonVariantStyles,
  getCardElevationStyles,
  getTransitionStyles,
  getFocusRingStyles,
  getDisabledStyles,
  mergeStyles,
  remToPx,
  pxToRem,
  meetsContrastRequirement,
  getResponsiveStyles,
} from './utils';

// Components
export { ModernButton } from './Button/ModernButton';
export { ModernTextField } from './TextField/ModernTextField';
export { ModernCard, CardHeader, CardTitle, CardSubtitle, CardContent, CardActions } from './Card/ModernCard';
export { ModernAlert, type ModernAlertProps, type AlertSeverity } from './Alert/ModernAlert';

// Navigation Components
export * from './Navigation';

// Form Components
export * from './Form';

// Dashboard Components
export * from './Dashboard';

// Import components for default export
import { ModernButton } from './Button/ModernButton';
import { ModernTextField } from './TextField/ModernTextField';
import { ModernCard } from './Card/ModernCard';
import { ModernAlert } from './Alert/ModernAlert';

// Testing utilities
export {
  componentSizeGen,
  componentColorGen,
  buttonVariantGen,
  cardElevationGen,
  buttonTextGen,
  classNameGen,
  dataTestIdGen,
  booleanGen,
  modernButtonPropsGen,
  colorValueGen,
  spacingValueGen,
  borderRadiusGen,
  cssColorGen,
  cssSizeGen,
  mouseEventGen,
  ariaLabelGen,
  roleGen,
  buttonStateGen,
  themeColorScaleGen,
  typographyScaleGen,
  breakpointGen,
  screenSizeGen,
  formInputGen,
  navigationItemGen,
  layoutDirectionGen,
  alignmentGen,
  justificationGen,
  renderCountGen,
  animationDurationGen,
  generateValidProps,
  generateEdgeCases,
  nonEmptyString,
  validClassName,
  validColor,
} from './testing/generators';

export {
  renderWithTheme,
  checkAccessibility,
  checkColorContrast,
  validateSpacingScale,
  validateColorScale,
  getComputedStyleProperty,
  hasClass,
  isVisible,
  isInteractive,
  simulateHover,
  simulateUnhover,
  simulateFocus,
  simulateBlur,
  measureRenderTime,
  measureMemoryUsage,
  setViewportSize,
  getBreakpoint,
  fillInput,
  submitForm,
  waitForAnimation,
  disableAnimations,
  cleanup,
  runPropertyTest,
} from './testing/testUtils';

// Re-export default components for convenience
export { default as Button } from './Button/ModernButton';
export { default as TextField } from './TextField/ModernTextField';
export { default as Card } from './Card/ModernCard';
export { default as Alert } from './Alert/ModernAlert';

// Component library metadata
export const MODERN_COMPONENT_LIBRARY_VERSION = '1.0.0';
export const MODERN_COMPONENT_LIBRARY_NAME = 'Modern UI Design System';

// Theme integration helpers
export const createModernComponentTheme = (baseTheme: any) => ({
  ...baseTheme,
  components: {
    ...baseTheme.components,
    ModernButton: {
      primary: {
        base: {},
        states: {
          hover: {},
          focus: {},
          active: {},
          disabled: {},
        },
      },
      secondary: {
        base: {},
        states: {
          hover: {},
          focus: {},
          active: {},
          disabled: {},
        },
      },
      tertiary: {
        base: {},
        states: {
          hover: {},
          focus: {},
          active: {},
          disabled: {},
        },
      },
      ghost: {
        base: {},
        states: {
          hover: {},
          focus: {},
          active: {},
          disabled: {},
        },
      },
      danger: {
        base: {},
        states: {
          hover: {},
          focus: {},
          active: {},
          disabled: {},
        },
      },
    },
  },
});

// Validation helpers
export const validateModernTheme = (theme: any): boolean => {
  try {
    // Check for required theme properties
    const requiredPaths = [
      'custom.colors.primary',
      'custom.colors.secondary',
      'custom.colors.semantic',
      'custom.typography.fontFamily',
      'custom.spacing',
      'custom.shadows',
      'custom.borderRadius',
    ];
    
    return requiredPaths.every(path => {
      const value = path.split('.').reduce((obj, key) => obj?.[key], theme);
      return value !== undefined;
    });
  } catch {
    return false;
  }
};

// Component registration system
const registeredComponents = new Map<string, any>();

export const registerComponent = (name: string, component: any): void => {
  registeredComponents.set(name, component);
};

export const getRegisteredComponent = (name: string): any => {
  return registeredComponents.get(name);
};

export const getAllRegisteredComponents = (): Map<string, any> => {
  return new Map(registeredComponents);
};

// Initialize default components
registerComponent('ModernButton', ModernButton);
registerComponent('ModernTextField', ModernTextField);
registerComponent('ModernCard', ModernCard);
registerComponent('ModernAlert', ModernAlert);

// Export everything as default for convenience
export default {
  // Components
  ModernButton,
  ModernTextField,
  ModernCard,
  ModernAlert,
  
  // Theme
  createModernComponentTheme,
  validateModernTheme,
  
  // Registration
  registerComponent,
  getRegisteredComponent,
  getAllRegisteredComponents,
  
  // Metadata
  version: MODERN_COMPONENT_LIBRARY_VERSION,
  name: MODERN_COMPONENT_LIBRARY_NAME,
};
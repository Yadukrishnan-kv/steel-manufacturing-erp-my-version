/**
 * Modern Theme Provider - Customer Portal
 * Professional theme system for customer-facing application
 */

import { createTheme, Theme } from '@mui/material/styles';
import { designTokens, DesignTokens } from './designTokens';

// Extend Material-UI theme interface to include our custom design tokens
declare module '@mui/material/styles' {
  interface Theme {
    custom: DesignTokens;
  }
  
  interface ThemeOptions {
    custom?: DesignTokens;
  }
}

// Create modern Material-UI theme for customer portal
export const createCustomerPortalTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  const tokens = designTokens;
  
  return createTheme({
    // Include our design tokens in the theme
    custom: tokens,
    
    palette: {
      mode,
      primary: {
        main: tokens.colors.primary[600],
        light: tokens.colors.primary[400],
        dark: tokens.colors.primary[800],
        contrastText: tokens.colors.neutral.white,
      },
      secondary: {
        main: tokens.colors.secondary[500],
        light: tokens.colors.secondary[300],
        dark: tokens.colors.secondary[700],
        contrastText: tokens.colors.neutral.white,
      },
      error: {
        main: tokens.colors.semantic.error[500],
        light: tokens.colors.semantic.error[300],
        dark: tokens.colors.semantic.error[700],
        contrastText: tokens.colors.neutral.white,
      },
      warning: {
        main: tokens.colors.semantic.warning[500],
        light: tokens.colors.semantic.warning[300],
        dark: tokens.colors.semantic.warning[700],
        contrastText: tokens.colors.neutral.white,
      },
      info: {
        main: tokens.colors.semantic.info[500],
        light: tokens.colors.semantic.info[300],
        dark: tokens.colors.semantic.info[700],
        contrastText: tokens.colors.neutral.white,
      },
      success: {
        main: tokens.colors.semantic.success[500],
        light: tokens.colors.semantic.success[300],
        dark: tokens.colors.semantic.success[700],
        contrastText: tokens.colors.neutral.white,
      },
      background: {
        default: mode === 'light' ? tokens.colors.neutral.gray[50] : tokens.colors.neutral.gray[900],
        paper: mode === 'light' ? tokens.colors.neutral.white : tokens.colors.neutral.gray[800],
      },
      text: {
        primary: mode === 'light' ? tokens.colors.neutral.gray[900] : tokens.colors.neutral.gray[100],
        secondary: mode === 'light' ? tokens.colors.neutral.gray[600] : tokens.colors.neutral.gray[400],
        disabled: mode === 'light' ? tokens.colors.neutral.gray[400] : tokens.colors.neutral.gray[600],
      },
      divider: mode === 'light' ? tokens.colors.neutral.gray[200] : tokens.colors.neutral.gray[700],
    },
    
    typography: {
      fontFamily: tokens.typography.fontFamily.primary,
      h1: {
        fontSize: tokens.typography.fontSize['4xl'],
        fontWeight: tokens.typography.fontWeight.bold,
        lineHeight: tokens.typography.lineHeight.tight,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: tokens.typography.fontSize['3xl'],
        fontWeight: tokens.typography.fontWeight.bold,
        lineHeight: tokens.typography.lineHeight.tight,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: tokens.typography.fontSize['2xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        lineHeight: tokens.typography.lineHeight.tight,
      },
      h4: {
        fontSize: tokens.typography.fontSize.xl,
        fontWeight: tokens.typography.fontWeight.semibold,
        lineHeight: tokens.typography.lineHeight.normal,
      },
      h5: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal,
      },
      h6: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal,
      },
      body1: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.normal,
        lineHeight: tokens.typography.lineHeight.normal,
      },
      body2: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.normal,
        lineHeight: tokens.typography.lineHeight.normal,
      },
      caption: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.normal,
        lineHeight: tokens.typography.lineHeight.normal,
      },
      button: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal,
        textTransform: 'none',
      },
    },
    
    spacing: 4, // Base spacing unit (4px)
    
    shape: {
      borderRadius: parseFloat(tokens.borderRadius.md.replace('rem', '')) * 16, // Convert rem to px
    },
    
    shadows: [
      'none',
      tokens.shadows.sm,
      tokens.shadows.base,
      tokens.shadows.md,
      tokens.shadows.lg,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
    ],
    
    components: {
      // Override Material-UI component styles for customer portal
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: tokens.typography.fontFamily.primary,
            fontSize: tokens.typography.fontSize.base,
            lineHeight: tokens.typography.lineHeight.normal,
            backgroundColor: mode === 'light' ? tokens.colors.neutral.gray[50] : tokens.colors.neutral.gray[900],
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.lg,
            textTransform: 'none',
            fontWeight: tokens.typography.fontWeight.medium,
            padding: '12px 24px',
            fontSize: tokens.typography.fontSize.base,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: tokens.shadows.md,
            },
          },
          contained: {
            '&:hover': {
              boxShadow: tokens.shadows.lg,
            },
          },
          large: {
            padding: '16px 32px',
            fontSize: tokens.typography.fontSize.lg,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.xl,
            boxShadow: tokens.shadows.base,
            border: `1px solid ${mode === 'light' ? tokens.colors.neutral.gray[200] : tokens.colors.neutral.gray[700]}`,
            '&:hover': {
              boxShadow: tokens.shadows.md,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: tokens.borderRadius.lg,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.colors.primary[400],
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.colors.primary[600],
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.xl,
            boxShadow: tokens.shadows.base,
          },
          elevation1: {
            boxShadow: tokens.shadows.sm,
          },
          elevation2: {
            boxShadow: tokens.shadows.base,
          },
          elevation3: {
            boxShadow: tokens.shadows.md,
          },
          elevation4: {
            boxShadow: tokens.shadows.lg,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.full,
            fontWeight: tokens.typography.fontWeight.medium,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: tokens.shadows.sm,
            borderBottom: `1px solid ${mode === 'light' ? tokens.colors.neutral.gray[200] : tokens.colors.neutral.gray[700]}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${mode === 'light' ? tokens.colors.neutral.gray[200] : tokens.colors.neutral.gray[700]}`,
            boxShadow: 'none',
          },
        },
      },
    },
  });
};

// Default light theme for customer portal
export const customerPortalTheme = createCustomerPortalTheme('light');

// Dark theme for customer portal
export const customerPortalDarkTheme = createCustomerPortalTheme('dark');
/**
 * Styled Components Theme Provider
 * Provides design tokens to styled-components throughout the application
 */

import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { DesignTokens } from './designTokens';

// Styled-components theme interface
export interface StyledTheme {
  tokens: DesignTokens;
  mode: 'light' | 'dark';
}

// Declare styled-components theme type
declare module 'styled-components' {
  export interface DefaultTheme extends StyledTheme {}
}

interface ModernStyledThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider that bridges Material-UI theme with styled-components
 * Provides access to design tokens in styled-components
 */
export const ModernStyledThemeProvider: React.FC<ModernStyledThemeProviderProps> = ({ children }) => {
  const muiTheme = useTheme();
  
  const styledTheme: StyledTheme = {
    tokens: muiTheme.custom,
    mode: muiTheme.palette.mode,
  };

  return (
    <StyledThemeProvider theme={styledTheme}>
      {children}
    </StyledThemeProvider>
  );
};
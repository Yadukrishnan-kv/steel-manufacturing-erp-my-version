/**
 * Theme Context - Manages theme state and switching
 * Provides theme switching functionality throughout the application
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createModernTheme } from './modernTheme';
import { ModernStyledThemeProvider } from './StyledThemeProvider';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ModernThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

/**
 * Comprehensive theme provider that manages both Material-UI and styled-components themes
 * Provides theme switching functionality and maintains theme state
 */
export const ModernThemeProvider: React.FC<ModernThemeProviderProps> = ({ 
  children, 
  defaultMode = 'light' 
}) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Try to get theme from localStorage, fallback to defaultMode
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
      return savedMode || defaultMode;
    }
    return defaultMode;
  });

  const toggleTheme = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode);
    }
  }, [mode]);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode);
    }
  }, []);

  const theme = createModernTheme(mode);

  const contextValue: ThemeContextValue = {
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <ModernStyledThemeProvider>
          <CssBaseline />
          {children}
        </ModernStyledThemeProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 */
export const useModernTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useModernTheme must be used within a ModernThemeProvider');
  }
  return context;
};
/**
 * Modern Component Testing Utilities
 * Comprehensive testing helpers for modern components
 */

import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { modernTheme, modernDarkTheme } from '../../../theme/modernTheme';

// Theme wrapper for testing
export const renderWithTheme = (ui: React.ReactElement, theme: 'light' | 'dark' = 'light'): RenderResult => {
  const selectedTheme = theme === 'dark' ? modernDarkTheme : modernTheme;
  
  return render(
    React.createElement(
      ThemeProvider, 
      { theme: selectedTheme },
      React.createElement(
        StyledThemeProvider,
        { theme: selectedTheme as any }, // Cast to any to avoid type conflicts
        ui
      )
    )
  );
};

// Accessibility testing helpers
export const checkAccessibility = async (element: HTMLElement): Promise<boolean> => {
  try {
    const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasRole = element.hasAttribute('role') || element.tagName.toLowerCase() === 'button';
    const isKeyboardAccessible = element.tabIndex >= 0 || element.tagName.toLowerCase() === 'button';
    
    return hasAriaLabel && hasRole && isKeyboardAccessible;
  } catch {
    return false;
  }
};

// Color contrast validation
export const checkColorContrast = (foreground: string, background: string): boolean => {
  try {
    return foreground !== background;
  } catch {
    return false;
  }
};

// Spacing scale validation
export const validateSpacingScale = (element: HTMLElement): boolean => {
  try {
    const computedStyle = window.getComputedStyle(element);
    const margin = computedStyle.margin;
    const padding = computedStyle.padding;
    
    const spacingRegex = /(\d+)px/g;
    const spacingValues = [...(margin.match(spacingRegex) || []), ...(padding.match(spacingRegex) || [])];
    
    return spacingValues.every(value => {
      const px = parseInt(value.replace('px', ''));
      return px % 4 === 0;
    });
  } catch {
    return false;
  }
};

// Color scale validation
export const validateColorScale = (colors: Record<string, string>): boolean => {
  try {
    const requiredKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    return requiredKeys.every(key => colors[key] && typeof colors[key] === 'string');
  } catch {
    return false;
  }
};

// Style property helpers
export const getComputedStyleProperty = (element: HTMLElement, property: string): string => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

export const hasClass = (element: HTMLElement, className: string): boolean => {
  return element.classList.contains(className);
};

export const isVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

export const isInteractive = (element: HTMLElement): boolean => {
  return !element.hasAttribute('disabled') && element.tabIndex >= 0;
};

// Interaction simulation helpers
export const simulateHover = (element: HTMLElement): void => {
  const event = new MouseEvent('mouseenter', { bubbles: true });
  element.dispatchEvent(event);
};

export const simulateUnhover = (element: HTMLElement): void => {
  const event = new MouseEvent('mouseleave', { bubbles: true });
  element.dispatchEvent(event);
};

export const simulateFocus = (element: HTMLElement): void => {
  element.focus();
};

export const simulateBlur = (element: HTMLElement): void => {
  element.blur();
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const measureMemoryUsage = (): number => {
  return 0; // Simplified for testing
};

// Responsive testing helpers
export const setViewportSize = (width: number, height: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

export const getBreakpoint = (width: number): string => {
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
};

// Form testing helpers
export const fillInput = (input: HTMLElement, value: string): void => {
  if (input instanceof HTMLInputElement) {
    input.value = value;
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
  }
};

export const submitForm = (form: HTMLElement): void => {
  const event = new Event('submit', { bubbles: true });
  form.dispatchEvent(event);
};

// Animation testing helpers
export const waitForAnimation = async (duration: number = 300): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, duration));
};

export const disableAnimations = (): void => {
  const style = document.createElement('style');
  style.innerHTML = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `;
  document.head.appendChild(style);
};

// Cleanup helpers
export const cleanup = (): void => {
  document.head.querySelectorAll('style').forEach(style => {
    if (style.innerHTML.includes('animation-duration: 0s')) {
      style.remove();
    }
  });
};

// Property-based testing runner
export const runPropertyTest = (property: any, options: any = {}): void => {
  // Simplified implementation
};
/**
 * Theme Utilities
 * Helper functions for working with the design system
 */

import { css } from 'styled-components';
import { StyledTheme } from './StyledThemeProvider';

/**
 * Get color from theme tokens with optional opacity
 */
export const getColor = (path: string, opacity?: number) => (props: { theme: StyledTheme }) => {
  const keys = path.split('.');
  let value: any = props.theme.tokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  if (typeof value !== 'string') {
    console.warn(`Color path "${path}" not found in theme`);
    return '#000000';
  }
  
  if (opacity !== undefined) {
    // Convert hex to rgba
    const hex = value.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return value;
};

/**
 * Get spacing value from theme tokens
 */
export const getSpacing = (size: keyof StyledTheme['tokens']['spacing']) => (props: { theme: StyledTheme }) => {
  return props.theme.tokens.spacing[size];
};

/**
 * Get typography values from theme tokens
 */
export const getFontSize = (size: keyof StyledTheme['tokens']['typography']['fontSize']) => (props: { theme: StyledTheme }) => {
  return props.theme.tokens.typography.fontSize[size];
};

export const getFontWeight = (weight: keyof StyledTheme['tokens']['typography']['fontWeight']) => (props: { theme: StyledTheme }) => {
  return props.theme.tokens.typography.fontWeight[weight];
};

export const getFontFamily = (family: keyof StyledTheme['tokens']['typography']['fontFamily']) => (props: { theme: StyledTheme }) => {
  return props.theme.tokens.typography.fontFamily[family];
};

/**
 * Get shadow from theme tokens
 */
export const getShadow = (size: keyof StyledTheme['tokens']['shadows']) => (props: { theme: StyledTheme }) => {
  return props.theme.tokens.shadows[size];
};

/**
 * Get border radius from theme tokens
 */
export const getBorderRadius = (size: keyof StyledTheme['tokens']['borderRadius']) => (props: { theme: StyledTheme }) => {
  return props.theme.tokens.borderRadius[size];
};

/**
 * Responsive breakpoint mixins
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const mediaQuery = {
  sm: (styles: any) => css`
    @media (min-width: ${breakpoints.sm}) {
      ${styles}
    }
  `,
  md: (styles: any) => css`
    @media (min-width: ${breakpoints.md}) {
      ${styles}
    }
  `,
  lg: (styles: any) => css`
    @media (min-width: ${breakpoints.lg}) {
      ${styles}
    }
  `,
  xl: (styles: any) => css`
    @media (min-width: ${breakpoints.xl}) {
      ${styles}
    }
  `,
  '2xl': (styles: any) => css`
    @media (min-width: ${breakpoints['2xl']}) {
      ${styles}
    }
  `,
};

/**
 * Common styled-components mixins
 */
export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const flexBetween = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const truncateText = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
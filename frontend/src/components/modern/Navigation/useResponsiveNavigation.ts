/**
 * Responsive Navigation Hook
 * Handles responsive behavior for navigation components
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

export interface UseResponsiveNavigationOptions {
  defaultCollapsed?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  persistCollapsedState?: boolean;
  storageKey?: string;
}

export interface UseResponsiveNavigationReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebarCollapse: () => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  openMobileDrawer: () => void;
}

/**
 * Hook for managing responsive navigation behavior
 * 
 * Handles:
 * - Responsive breakpoints
 * - Sidebar collapse state
 * - Mobile drawer state
 * - State persistence
 */
export const useResponsiveNavigation = ({
  defaultCollapsed = false,
  mobileBreakpoint = 'md',
  persistCollapsedState = true,
  storageKey = 'sidebar-collapsed',
}: UseResponsiveNavigationOptions = {}): UseResponsiveNavigationReturn => {
  const theme = useTheme();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Initialize collapsed state from localStorage or default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (!persistCollapsedState) return defaultCollapsed;
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });
  
  // Mobile drawer state (separate from sidebar collapse)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Persist collapsed state to localStorage
  useEffect(() => {
    if (persistCollapsedState) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sidebarCollapsed));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [sidebarCollapsed, persistCollapsedState, storageKey]);
  
  // Auto-collapse on mobile/tablet for better UX
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, sidebarCollapsed]);
  
  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (isDesktop && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isDesktop, mobileDrawerOpen]);
  
  // Toggle sidebar collapse
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  
  // Toggle mobile drawer
  const toggleMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(prev => !prev);
  }, []);
  
  // Close mobile drawer
  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(false);
  }, []);
  
  // Open mobile drawer
  const openMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(true);
  }, []);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    sidebarCollapsed,
    mobileDrawerOpen,
    toggleSidebarCollapse,
    toggleMobileDrawer,
    closeMobileDrawer,
    openMobileDrawer,
  };
};
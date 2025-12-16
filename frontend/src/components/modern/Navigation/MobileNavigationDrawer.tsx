/**
 * Mobile Navigation Drawer Component
 * A responsive drawer for mobile navigation
 */

import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { Drawer, useMediaQuery } from '@mui/material';
import { ModernSidebar } from './ModernSidebar';
import { NavigationItem } from '../types';

const DrawerContent = styled.div<{
  theme: any;
}>`
  width: 280px;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.paper};
`;

export interface MobileNavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NavigationItem[];
  onItemClick?: (item: NavigationItem) => void;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

/**
 * Mobile Navigation Drawer Component
 * 
 * A responsive drawer that shows the sidebar navigation on mobile devices.
 * Automatically handles touch gestures and overlay behavior.
 */
export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  open,
  onClose,
  items,
  onItemClick,
  className,
  style,
  'data-testid': dataTestId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Handle item click - close drawer after navigation
  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    // Close drawer after navigation on mobile
    if (item.path && !item.children) {
      onClose();
    }
  };
  
  // Only render on mobile
  if (!isMobile) {
    return null;
  }
  
  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      PaperProps={{
        sx: {
          width: 280,
          border: 'none',
          boxShadow: theme.custom.shadows.xl,
        }
      }}
      className={className}
      style={style}
      data-testid={dataTestId}
    >
      <DrawerContent theme={theme}>
        <ModernSidebar
          items={items}
          collapsed={false}
          onItemClick={handleItemClick}
          width={280}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default MobileNavigationDrawer;
/**
 * Modern AppBar Component
 * A compact, professional app bar with modern styling
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { 
  Menu, 
  MenuItem, 
  Avatar, 
  Divider, 
  IconButton,
  Tooltip,
  Badge,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
  Notifications,
  Search,
  Help,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { getTransitionStyles, getSpacing } from '../utils';

// AppBar container
const AppBarContainer = styled.header<{
  $sidebarWidth: number;
  $sidebarCollapsed: boolean;
  $sidebarCollapsedWidth: number;
  theme: any;
}>`
  position: fixed;
  top: 0;
  left: ${({ $sidebarCollapsed, $sidebarWidth, $sidebarCollapsedWidth }) => 
    $sidebarCollapsed ? `${$sidebarCollapsedWidth}px` : `${$sidebarWidth}px`};
  right: 0;
  height: 64px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => getSpacing(theme, 3)};
  z-index: ${({ theme }) => theme.zIndex.appBar};
  box-shadow: ${({ theme }) => theme.custom.shadows.sm};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['left'], '300ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  @media (max-width: 768px) {
    left: 0;
  }
`;

// Left section with menu toggle and title
const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 2)};
`;

// Mobile menu button
const MobileMenuButton = styled(IconButton)`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

// App title
const AppTitle = styled.h1<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.palette.text.primary};
  margin: 0;
  
  @media (max-width: 640px) {
    display: none;
  }
`;

// Breadcrumb container
const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 1)};
  margin-left: ${({ theme }) => getSpacing(theme, 3)};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const BreadcrumbItem = styled.span<{
  $active: boolean;
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  color: ${({ theme, $active }) => 
    $active ? theme.palette.text.primary : theme.palette.text.secondary};
  font-weight: ${({ theme, $active }) => 
    $active ? theme.custom.typography.fontWeight.medium : theme.custom.typography.fontWeight.normal};
`;

const BreadcrumbSeparator = styled.span<{
  theme: any;
}>`
  color: ${({ theme }) => theme.palette.text.disabled};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
`;

// Right section with actions and user menu
const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 1)};
`;

// Action button
const ActionButton = styled(IconButton)<{
  theme: any;
}>`
  width: 40px;
  height: 40px;
  color: ${({ theme }) => theme.palette.text.secondary};
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    color: ${({ theme }) => theme.palette.text.primary};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }
`;

// User info section
const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 2)};
  margin-left: ${({ theme }) => getSpacing(theme, 2)};
  
  @media (max-width: 640px) {
    gap: ${({ theme }) => getSpacing(theme, 1)};
    margin-left: ${({ theme }) => getSpacing(theme, 1)};
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  @media (max-width: 640px) {
    display: none;
  }
`;

const UserName = styled.span<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  color: ${({ theme }) => theme.palette.text.primary};
  line-height: 1.2;
`;

const UserRole = styled.span<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  color: ${({ theme }) => theme.palette.text.secondary};
  line-height: 1.2;
`;

// User avatar button
const UserAvatarButton = styled(IconButton)<{
  theme: any;
}>`
  padding: 4px;
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }
`;

// Menu item with icon
const MenuItemWithIcon = styled(MenuItem)<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 2)};
  padding: ${({ theme }) => getSpacing(theme, 2)} ${({ theme }) => getSpacing(theme, 3)};
  min-width: 200px;
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

export interface ModernAppBarProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; active?: boolean }>;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    avatar?: string;
  };
  sidebarWidth?: number;
  sidebarCollapsed?: boolean;
  sidebarCollapsedWidth?: number;
  showSearch?: boolean;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
  notificationCount?: number;
  onMobileMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onThemeToggle?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

/**
 * Modern AppBar Component
 * 
 * A compact, professional app bar that adapts to sidebar state and provides
 * essential navigation and user actions.
 */
export const ModernAppBar: React.FC<ModernAppBarProps> = ({
  title = 'SteelForge Manufacturing ERP',
  breadcrumbs = [],
  user,
  sidebarWidth = 280,
  sidebarCollapsed = false,
  sidebarCollapsedWidth = 64,
  showSearch = true,
  showNotifications = true,
  showThemeToggle = true,
  notificationCount = 0,
  onMobileMenuClick,
  onSearchClick,
  onNotificationsClick,
  onThemeToggle,
  onProfileClick,
  onSettingsClick,
  onLogout,
  className,
  style,
  'data-testid': dataTestId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Handle user menu
  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleProfileClick = useCallback(() => {
    onProfileClick?.();
    handleUserMenuClose();
  }, [onProfileClick]);

  const handleSettingsClick = useCallback(() => {
    onSettingsClick?.();
    handleUserMenuClose();
  }, [onSettingsClick]);

  const handleLogout = useCallback(() => {
    onLogout?.();
    handleUserMenuClose();
  }, [onLogout]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <AppBarContainer
      $sidebarWidth={sidebarWidth}
      $sidebarCollapsed={sidebarCollapsed}
      $sidebarCollapsedWidth={sidebarCollapsedWidth}
      theme={theme}
      className={className}
      style={style}
      data-testid={dataTestId}
    >
      <LeftSection theme={theme}>
        {isMobile && (
          <MobileMenuButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMobileMenuClick}
          >
            <MenuIcon />
          </MobileMenuButton>
        )}
        
        <AppTitle theme={theme}>
          {title}
        </AppTitle>
        
        {breadcrumbs.length > 0 && (
          <BreadcrumbContainer theme={theme}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <BreadcrumbSeparator theme={theme}>
                    /
                  </BreadcrumbSeparator>
                )}
                <BreadcrumbItem 
                  $active={crumb.active || false} 
                  theme={theme}
                >
                  {crumb.label}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbContainer>
        )}
      </LeftSection>

      <RightSection theme={theme}>
        {showSearch && (
          <Tooltip title="Search" arrow>
            <ActionButton
              theme={theme}
              onClick={onSearchClick}
              aria-label="search"
            >
              <Search />
            </ActionButton>
          </Tooltip>
        )}
        
        {showNotifications && (
          <Tooltip title="Notifications" arrow>
            <ActionButton
              theme={theme}
              onClick={onNotificationsClick}
              aria-label="notifications"
            >
              <Badge badgeContent={notificationCount} color="error">
                <Notifications />
              </Badge>
            </ActionButton>
          </Tooltip>
        )}
        
        {showThemeToggle && (
          <Tooltip title="Toggle theme" arrow>
            <ActionButton
              theme={theme}
              onClick={onThemeToggle}
              aria-label="toggle theme"
            >
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </ActionButton>
          </Tooltip>
        )}
        
        <Tooltip title="Help" arrow>
          <ActionButton
            theme={theme}
            aria-label="help"
          >
            <Help />
          </ActionButton>
        </Tooltip>

        {user && (
          <UserInfo theme={theme}>
            <UserDetails>
              <UserName theme={theme}>
                {user.firstName} {user.lastName}
              </UserName>
              {user.role && (
                <UserRole theme={theme}>
                  {user.role}
                </UserRole>
              )}
            </UserDetails>
            
            <UserAvatarButton
              theme={theme}
              onClick={handleUserMenuOpen}
              aria-label="user menu"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
                src={user.avatar}
              >
                {getUserInitials()}
              </Avatar>
            </UserAvatarButton>
          </UserInfo>
        )}

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: theme.custom.borderRadius.lg,
              boxShadow: theme.custom.shadows.lg,
              border: `1px solid ${theme.palette.divider}`,
            }
          }}
        >
          <MenuItemWithIcon theme={theme} onClick={handleProfileClick}>
            <AccountCircle />
            Profile
          </MenuItemWithIcon>
          
          <MenuItemWithIcon theme={theme} onClick={handleSettingsClick}>
            <Settings />
            Settings
          </MenuItemWithIcon>
          
          <Divider />
          
          <MenuItemWithIcon theme={theme} onClick={handleLogout}>
            <Logout />
            Logout
          </MenuItemWithIcon>
        </Menu>
      </RightSection>
    </AppBarContainer>
  );
};

export default ModernAppBar;
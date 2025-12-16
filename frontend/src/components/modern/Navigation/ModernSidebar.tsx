/**
 * Modern Sidebar Component
 * A collapsible sidebar with smooth animations and modern styling
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { Tooltip, Collapse, List } from '@mui/material';
import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';
import { ModernSidebarProps, NavigationItem } from '../types';
import { getTransitionStyles, getSpacing } from '../utils';

// Main sidebar container
const SidebarContainer = styled.div<{
  $collapsed: boolean;
  $width: number;
  $collapsedWidth: number;
}>`
  position: relative;
  height: 100vh;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  flex-direction: column;
  width: ${({ $collapsed, $width, $collapsedWidth }) => 
    $collapsed ? `${$collapsedWidth}px` : `${$width}px`};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['width'], '300ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  box-shadow: ${({ theme }) => theme.custom.shadows.sm};
  z-index: ${({ theme }) => theme.zIndex.drawer};
`;

// Sidebar header with logo/title
const SidebarHeader = styled.div<{
  $collapsed: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => $collapsed ? 'center' : 'space-between'};
  padding: ${({ theme }) => getSpacing(theme, 3)} ${({ theme }) => getSpacing(theme, 2)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  min-height: 64px;
  position: relative;
`;

// Logo/title container
const LogoContainer = styled.div<{
  $collapsed: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 2)};
  overflow: hidden;
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['opacity'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
`;

const LogoText = styled.h1<{
  $collapsed: boolean;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.palette.text.primary};
  margin: 0;
  white-space: nowrap;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  transform: ${({ $collapsed }) => $collapsed ? 'translateX(-10px)' : 'translateX(0)'};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['opacity', 'transform'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
`;

// Toggle button
const ToggleButton = styled.button<{
  $collapsed: boolean;
}>`
  position: absolute;
  right: ${({ $collapsed }) => $collapsed ? '50%' : '8px'};
  transform: ${({ $collapsed }) => $collapsed ? 'translateX(50%)' : 'translateX(0)'};
  top: 50%;
  transform: ${({ $collapsed }) => 
    $collapsed ? 'translate(50%, -50%)' : 'translate(0, -50%)'};
  
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  background-color: ${({ theme }) => theme.palette.background.paper};
  color: ${({ theme }) => theme.palette.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['background-color', 'border-color', 'right', 'transform'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    border-color: ${({ theme }) => theme.palette.primary.main};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }
`;

// Navigation list container
const NavigationContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${({ theme }) => getSpacing(theme, 2)} 0;
`;

// Navigation item container
const NavigationItemContainer = styled.div<{
  $active: boolean;
  $collapsed: boolean;
  $level: number;
  $disabled: boolean;
}>`
  position: relative;
  margin: 0 ${({ theme }) => getSpacing(theme, 2)};
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  
  ${({ $active, theme }) => $active && `
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.primary.contrastText};
    
    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: ${theme.palette.primary.main};
      border-radius: 0 2px 2px 0;
    }
  `}
  
  ${({ $disabled }) => $disabled && `
    opacity: 0.5;
    pointer-events: none;
  `}
`;

const NavigationButton = styled.button<{
  $active: boolean;
  $collapsed: boolean;
  $level: number;
}>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => getSpacing(theme, 2)};
  padding: ${({ theme }) => getSpacing(theme, 2)} ${({ theme }) => getSpacing(theme, 3)};
  padding-left: ${({ theme, $level }) => getSpacing(theme, 3 + $level * 2)};
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['background-color', 'color'], '150ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
  
  &:hover:not(:disabled) {
    background-color: ${({ theme, $active }) => 
      $active ? 'rgba(255, 255, 255, 0.1)' : theme.palette.action.hover};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 2px;
  }
`;

const NavigationIcon = styled.div<{
  $collapsed: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const NavigationLabel = styled.span<{
  $collapsed: boolean;
}>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  transform: ${({ $collapsed }) => $collapsed ? 'translateX(-10px)' : 'translateX(0)'};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['opacity', 'transform'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
`;

const NavigationBadge = styled.span<{
  $collapsed: boolean;
}>`
  background-color: ${({ theme }) => theme.palette.error.main};
  color: ${({ theme }) => theme.palette.error.contrastText};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.custom.borderRadius.full};
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['opacity'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
`;

const ExpandIcon = styled.div<{
  $collapsed: boolean;
  $expanded: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  transform: ${({ $expanded }) => $expanded ? 'rotate(0deg)' : 'rotate(0deg)'};
  
  ${({ theme }) => {
    const transitions = getTransitionStyles(['opacity', 'transform'], '200ms');
    return Object.entries(transitions).map(([key, value]) => `${key}: ${value};`).join('\n  ');
  }}
`;

/**
 * Modern Sidebar Component
 * 
 * A collapsible sidebar navigation component with smooth animations,
 * tooltips for collapsed state, and responsive design patterns.
 */
export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  items,
  collapsed = false,
  onItemClick,
  onToggleCollapse,
  width = 280,
  collapsedWidth = 64,
  className,
  style,
  'data-testid': dataTestId,
}) => {
  const theme = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Handle item click
  const handleItemClick = useCallback((item: NavigationItem) => {
    if (item.disabled) return;
    
    if (item.children && item.children.length > 0) {
      // Toggle expansion for items with children
      setExpandedItems(prev => 
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Navigate for leaf items
      onItemClick?.(item);
    }
  }, [onItemClick]);

  // Handle toggle collapse
  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse?.();
  }, [onToggleCollapse]);

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0): React.ReactNode => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    const itemContent = (
      <NavigationItemContainer
        key={item.id}
        $active={item.active || false}
        $collapsed={collapsed}
        $level={level}
        $disabled={item.disabled || false}
      >
        <NavigationButton
          $active={item.active || false}
          $collapsed={collapsed}
          $level={level}
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={item.label}
        >
          {item.icon && (
            <NavigationIcon $collapsed={collapsed}>
              {item.icon}
            </NavigationIcon>
          )}
          
          <NavigationLabel $collapsed={collapsed}>
            {item.label}
          </NavigationLabel>
          
          {item.badge && (
            <NavigationBadge $collapsed={collapsed}>
              {item.badge}
            </NavigationBadge>
          )}
          
          {hasChildren && (
            <ExpandIcon 
              $collapsed={collapsed} 
              $expanded={isExpanded}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ExpandIcon>
          )}
        </NavigationButton>
        
        {hasChildren && (
          <Collapse in={isExpanded && !collapsed} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </NavigationItemContainer>
    );

    // Wrap with tooltip when collapsed and has no children
    if (collapsed && !hasChildren) {
      return (
        <Tooltip
          key={item.id}
          title={item.label}
          placement="right"
          arrow
          enterDelay={500}
        >
          <div>{itemContent}</div>
        </Tooltip>
      );
    }

    return itemContent;
  };

  return (
    <SidebarContainer
      $collapsed={collapsed}
      $width={width}
      $collapsedWidth={collapsedWidth}
      className={className}
      style={style}
      data-testid={dataTestId}
    >
      <SidebarHeader $collapsed={collapsed}>
        <LogoContainer $collapsed={collapsed}>
          <NavigationIcon $collapsed={false}>
            {/* You can replace this with your app logo */}
            <div style={{ 
              width: 24, 
              height: 24, 
              backgroundColor: theme.palette.primary.main,
              borderRadius: '4px'
            }} />
          </NavigationIcon>
          <LogoText $collapsed={collapsed}>
            SteelForge
          </LogoText>
        </LogoContainer>
        
        <ToggleButton
          $collapsed={collapsed}
          onClick={handleToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </ToggleButton>
      </SidebarHeader>
      
      <NavigationContainer>
        {items.map(item => renderNavigationItem(item))}
      </NavigationContainer>
    </SidebarContainer>
  );
};

export default ModernSidebar;
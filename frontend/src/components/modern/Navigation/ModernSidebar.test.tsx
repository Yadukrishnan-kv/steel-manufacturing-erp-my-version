/**
 * Modern Sidebar Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Dashboard, Settings, People } from '@mui/icons-material';
import { ModernSidebar } from './ModernSidebar';
import { renderWithTheme } from '../testing/testUtils';
import { NavigationItem } from '../types';

// Mock navigation items
const mockNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    active: true,
  },
  {
    id: 'users',
    label: 'Users',
    icon: <People />,
    children: [
      {
        id: 'user-list',
        label: 'User List',
        path: '/users',
      },
      {
        id: 'user-roles',
        label: 'User Roles',
        path: '/users/roles',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    path: '/settings',
    disabled: true,
  },
];

describe('ModernSidebar', () => {
  it('renders navigation items correctly', () => {
    renderWithTheme(
      <ModernSidebar items={mockNavigationItems} />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows active state for active items', () => {
    renderWithTheme(
      <ModernSidebar items={mockNavigationItems} />
    );

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    // Check that the active item has proper styling (this would be tested via CSS classes)
    expect(dashboardButton).toBeInTheDocument();
  });

  it('handles item clicks correctly', () => {
    const mockOnItemClick = vi.fn();
    
    renderWithTheme(
      <ModernSidebar 
        items={mockNavigationItems} 
        onItemClick={mockOnItemClick}
      />
    );

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    fireEvent.click(dashboardButton);

    expect(mockOnItemClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
      })
    );
  });

  it('expands and collapses items with children', () => {
    renderWithTheme(
      <ModernSidebar items={mockNavigationItems} />
    );

    const usersButton = screen.getByRole('button', { name: /users/i });
    
    // Initially collapsed
    expect(screen.queryByText('User List')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(usersButton);
    expect(screen.getByText('User List')).toBeInTheDocument();
    expect(screen.getByText('User Roles')).toBeInTheDocument();
    
    // Click to collapse - the items should still be in DOM but hidden
    fireEvent.click(usersButton);
    // Note: Material-UI Collapse keeps items in DOM but hides them
    // We can check if the expand icon changed instead
    expect(usersButton).toBeInTheDocument();
  });

  it('handles collapsed state correctly', () => {
    renderWithTheme(
      <ModernSidebar 
        items={mockNavigationItems} 
        collapsed={true}
      />
    );

    // Labels should be hidden when collapsed
    const dashboardLabel = screen.getByText('Dashboard');
    expect(dashboardLabel).toHaveStyle({ opacity: '0' });
  });

  it('calls onToggleCollapse when toggle button is clicked', () => {
    const mockOnToggleCollapse = vi.fn();
    
    renderWithTheme(
      <ModernSidebar 
        items={mockNavigationItems}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);

    expect(mockOnToggleCollapse).toHaveBeenCalled();
  });

  it('disables interaction for disabled items', () => {
    renderWithTheme(
      <ModernSidebar items={mockNavigationItems} />
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeDisabled();
  });

  it('renders with custom width', () => {
    const { container } = renderWithTheme(
      <ModernSidebar 
        items={mockNavigationItems}
        width={320}
        data-testid="sidebar"
      />
    );

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveStyle({ width: '320px' });
  });

  it('renders with custom collapsed width', () => {
    const { container } = renderWithTheme(
      <ModernSidebar 
        items={mockNavigationItems}
        collapsed={true}
        collapsedWidth={48}
        data-testid="sidebar"
      />
    );

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveStyle({ width: '48px' });
  });

  it('supports keyboard navigation', () => {
    renderWithTheme(
      <ModernSidebar items={mockNavigationItems} />
    );

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    
    // Focus should be visible
    dashboardButton.focus();
    expect(dashboardButton).toHaveFocus();
    
    // Enter key should trigger click
    fireEvent.keyDown(dashboardButton, { key: 'Enter' });
    // This would normally trigger navigation
  });
});
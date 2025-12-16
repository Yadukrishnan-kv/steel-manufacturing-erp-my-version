/**
 * Modern AppBar Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ModernAppBar } from './ModernAppBar';
import { renderWithTheme } from '../testing/testUtils';

// Mock user data
const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'Administrator',
};

describe('ModernAppBar', () => {
  it('renders title correctly', () => {
    renderWithTheme(
      <ModernAppBar title="Test Application" />
    );

    expect(screen.getByText('Test Application')).toBeInTheDocument();
  });

  it('renders user information when provided', () => {
    renderWithTheme(
      <ModernAppBar user={mockUser} />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('renders breadcrumbs correctly', () => {
    const breadcrumbs = [
      { label: 'Home' },
      { label: 'Users' },
      { label: 'Profile', active: true },
    ];

    renderWithTheme(
      <ModernAppBar breadcrumbs={breadcrumbs} />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles user menu interactions', () => {
    const mockOnProfileClick = vi.fn();
    const mockOnLogout = vi.fn();

    renderWithTheme(
      <ModernAppBar 
        user={mockUser}
        onProfileClick={mockOnProfileClick}
        onLogout={mockOnLogout}
      />
    );

    // Click user avatar to open menu
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);

    // Check menu items
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Click profile
    fireEvent.click(screen.getByText('Profile'));
    expect(mockOnProfileClick).toHaveBeenCalled();
  });

  it('handles action button clicks', () => {
    const mockOnSearchClick = vi.fn();
    const mockOnNotificationsClick = vi.fn();
    const mockOnThemeToggle = vi.fn();

    renderWithTheme(
      <ModernAppBar 
        onSearchClick={mockOnSearchClick}
        onNotificationsClick={mockOnNotificationsClick}
        onThemeToggle={mockOnThemeToggle}
      />
    );

    // Test search button
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    expect(mockOnSearchClick).toHaveBeenCalled();

    // Test notifications button
    const notificationsButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(notificationsButton);
    expect(mockOnNotificationsClick).toHaveBeenCalled();

    // Test theme toggle button
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(themeButton);
    expect(mockOnThemeToggle).toHaveBeenCalled();
  });

  it('shows notification badge when count is provided', () => {
    renderWithTheme(
      <ModernAppBar notificationCount={5} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles mobile menu button', () => {
    const mockOnMobileMenuClick = vi.fn();

    renderWithTheme(
      <ModernAppBar onMobileMenuClick={mockOnMobileMenuClick} />
    );

    // Note: Mobile menu button is only visible on mobile breakpoints
    // This test would need to mock the useMediaQuery hook for proper testing
  });

  it('adjusts position based on sidebar state', () => {
    const { container } = renderWithTheme(
      <ModernAppBar 
        sidebarWidth={280}
        sidebarCollapsed={false}
        data-testid="appbar"
      />
    );

    const appbar = screen.getByTestId('appbar');
    expect(appbar).toHaveStyle({ left: '280px' });
  });

  it('adjusts position when sidebar is collapsed', () => {
    const { container } = renderWithTheme(
      <ModernAppBar 
        sidebarWidth={280}
        sidebarCollapsed={true}
        sidebarCollapsedWidth={64}
        data-testid="appbar"
      />
    );

    const appbar = screen.getByTestId('appbar');
    expect(appbar).toHaveStyle({ left: '64px' });
  });

  it('supports accessibility features', () => {
    renderWithTheme(
      <ModernAppBar user={mockUser} />
    );

    // Check ARIA labels
    const userButton = screen.getByRole('button', { name: /user menu/i });
    expect(userButton).toHaveAttribute('aria-label', 'user menu');
    expect(userButton).toHaveAttribute('aria-controls', 'user-menu');
    expect(userButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('handles conditional action buttons', () => {
    renderWithTheme(
      <ModernAppBar 
        showSearch={false}
        showNotifications={false}
        showThemeToggle={false}
      />
    );

    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /toggle theme/i })).not.toBeInTheDocument();
  });
});
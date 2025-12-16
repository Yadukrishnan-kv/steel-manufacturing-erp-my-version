import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Factory,
  Inventory,
  ShoppingCart,
  Assignment,
  Build,
  People,
  AccountBalance,
  Assessment,
  ExpandLess,
  ExpandMore,
  Settings,
  LocationOn,
  Notifications,
  AdminPanelSettings,
  Security,
} from '@mui/icons-material';
import type { RootState } from '../../store/store';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: MenuItem[];
  permissions?: string[];
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: <Factory />,
    path: '/manufacturing',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <ShoppingCart />,
    path: '/sales',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Inventory />,
    path: '/inventory',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: <ShoppingCart />,
    path: '/procurement',
  },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: <Assignment />,
    path: '/qc',
  },
  {
    id: 'service',
    label: 'Service',
    icon: <Build />,
    path: '/service',
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: <People />,
    children: [
      { id: 'employees', label: 'Employees', icon: <People />, path: '/hr/employees' },
      { id: 'attendance', label: 'Attendance', icon: <Assignment />, path: '/hr/attendance' },
      { id: 'payroll', label: 'Payroll', icon: <AccountBalance />, path: '/hr/payroll' },
      { id: 'performance', label: 'Performance', icon: <Assessment />, path: '/hr/performance' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <AccountBalance />,
    children: [
      { id: 'invoices', label: 'Invoices', icon: <Assignment />, path: '/finance/invoices' },
      { id: 'payments', label: 'Payments', icon: <AccountBalance />, path: '/finance/payments' },
      { id: 'reports', label: 'Financial Reports', icon: <Assessment />, path: '/finance/reports' },
      { id: 'cost-analysis', label: 'Cost Analysis', icon: <Assessment />, path: '/finance/cost-analysis' },
    ],
  },
  {
    id: 'reports',
    label: 'Business Intelligence',
    icon: <Assessment />,
    children: [
      { id: 'dashboards', label: 'Dashboards', icon: <Dashboard />, path: '/bi/dashboards' },
      { id: 'analytics', label: 'Analytics', icon: <Assessment />, path: '/bi/analytics' },
      { id: 'trends', label: 'Trend Analysis', icon: <Assessment />, path: '/bi/trends' },
    ],
  },
  {
    id: 'field',
    label: 'Field Operations',
    icon: <LocationOn />,
    children: [
      { id: 'geo-tagging', label: 'Geo Tagging', icon: <LocationOn />, path: '/field/geo-tagging' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts & Notifications',
    icon: <Notifications />,
    path: '/alerts',
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <AdminPanelSettings />,
    children: [
      { id: 'users', label: 'User Management', icon: <People />, path: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', icon: <Security />, path: '/admin/users' },
    ],
  },
];

interface SidebarProps {
  onItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [openItems, setOpenItems] = React.useState<string[]>(['dashboard']);

  const handleItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      onItemClick?.();
    } else if (item.children) {
      setOpenItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    }
  };

  const hasPermission = (item: MenuItem): boolean => {
    if (!item.permissions && !item.roles) return true;
    if (!user) return false;

    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.permissions && !item.permissions.every(p => user.permissions.includes(p))) return false;

    return true;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasPermission(item)) return null;

    const isSelected = item.path === location.pathname;
    const isOpen = openItems.includes(item.id);

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isSelected}
            sx={{
              pl: 2 + level * 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
            {item.children && (
              isOpen ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {item.children && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Steel ERP
        </Typography>
      </Toolbar>
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>

      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;
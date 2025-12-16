import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Avatar,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  ExpandMore,
  VpnKey,
  AdminPanelSettings,
} from '@mui/icons-material';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  branch: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: Date;
  createdAt: Date;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystemRole: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'rajesh.kumar',
    email: 'rajesh.kumar@company.com',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: 'Production Manager',
    department: 'Production',
    branch: 'Kerala Main',
    status: 'Active',
    lastLogin: new Date('2024-01-15T09:30:00'),
    createdAt: new Date('2022-01-15'),
    permissions: ['production.view', 'production.create', 'production.edit', 'inventory.view'],
  },
  {
    id: '2',
    username: 'priya.sharma',
    email: 'priya.sharma@company.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'Sales Executive',
    department: 'Sales',
    branch: 'Tamil Nadu',
    status: 'Active',
    lastLogin: new Date('2024-01-15T08:45:00'),
    createdAt: new Date('2022-03-20'),
    permissions: ['sales.view', 'sales.create', 'sales.edit', 'customers.view'],
  },
  {
    id: '3',
    username: 'admin',
    email: 'admin@company.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'Super Admin',
    department: 'IT',
    branch: 'Kerala Main',
    status: 'Active',
    lastLogin: new Date('2024-01-15T10:00:00'),
    createdAt: new Date('2021-01-01'),
    permissions: ['*'], // All permissions
  },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: ['*'],
    userCount: 1,
    isSystemRole: true,
  },
  {
    id: '2',
    name: 'Production Manager',
    description: 'Manage production operations and schedules',
    permissions: ['production.*', 'inventory.view', 'qc.view', 'manufacturing.*'],
    userCount: 3,
    isSystemRole: false,
  },
  {
    id: '3',
    name: 'Sales Executive',
    description: 'Manage sales orders and customer relationships',
    permissions: ['sales.*', 'customers.*', 'leads.*', 'estimates.*'],
    userCount: 8,
    isSystemRole: false,
  },
  {
    id: '4',
    name: 'QC Inspector',
    description: 'Quality control and inspection operations',
    permissions: ['qc.*', 'production.view', 'inventory.view'],
    userCount: 4,
    isSystemRole: false,
  },
];

const mockPermissions: Permission[] = [
  { id: '1', name: 'production.view', description: 'View production orders', module: 'Production', action: 'View' },
  { id: '2', name: 'production.create', description: 'Create production orders', module: 'Production', action: 'Create' },
  { id: '3', name: 'production.edit', description: 'Edit production orders', module: 'Production', action: 'Edit' },
  { id: '4', name: 'production.delete', description: 'Delete production orders', module: 'Production', action: 'Delete' },
  { id: '5', name: 'sales.view', description: 'View sales orders', module: 'Sales', action: 'View' },
  { id: '6', name: 'sales.create', description: 'Create sales orders', module: 'Sales', action: 'Create' },
  { id: '7', name: 'sales.edit', description: 'Edit sales orders', module: 'Sales', action: 'Edit' },
  { id: '8', name: 'inventory.view', description: 'View inventory items', module: 'Inventory', action: 'View' },
  { id: '9', name: 'qc.view', description: 'View QC inspections', module: 'Quality', action: 'View' },
  { id: '10', name: 'qc.create', description: 'Create QC inspections', module: 'Quality', action: 'Create' },
];

const UserManagement: React.FC = () => {
  const [users] = useState<User[]>(mockUsers);
  const [roles] = useState<Role[]>(mockRoles);
  const [permissions] = useState<Permission[]>(mockPermissions);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Suspended': return 'error';
      default: return 'default';
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setOpenUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setOpenUserDialog(true);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setOpenRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setOpenRoleDialog(true);
  };

  const UserDialog = () => (
    <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedUser ? 'Edit User' : 'Create New User'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Username"
              defaultValue={selectedUser?.username || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              defaultValue={selectedUser?.email || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              defaultValue={selectedUser?.firstName || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              defaultValue={selectedUser?.lastName || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                defaultValue={selectedUser?.role || ''}
                label="Role"
              >
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                defaultValue={selectedUser?.department || ''}
                label="Department"
              >
                <MenuItem value="Production">Production</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Quality">Quality</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                defaultValue={selectedUser?.branch || ''}
                label="Branch"
              >
                <MenuItem value="Kerala Main">Kerala Main</MenuItem>
                <MenuItem value="Tamil Nadu">Tamil Nadu</MenuItem>
                <MenuItem value="Kerala North">Kerala North</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                defaultValue={selectedUser?.status || 'Active'}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {!selectedUser && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                helperText="Minimum 8 characters with uppercase, lowercase, and numbers"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => setOpenUserDialog(false)}>
          {selectedUser ? 'Update' : 'Create'} User
        </Button>
      </DialogActions>
    </Dialog>
  );

  const RoleDialog = () => (
    <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedRole ? 'Edit Role' : 'Create New Role'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Role Name"
              defaultValue={selectedRole?.name || ''}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              defaultValue={selectedRole?.description || ''}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>Permissions</Typography>
            {Object.entries(
              permissions.reduce((acc, perm) => {
                if (!acc[perm.module]) acc[perm.module] = [];
                acc[perm.module].push(perm);
                return acc;
              }, {} as Record<string, Permission[]>)
            ).map(([module, modulePermissions]) => (
              <Accordion key={module}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">{module}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {modulePermissions.map(permission => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            defaultChecked={selectedRole?.permissions.includes(permission.name) || false}
                          />
                        }
                        label={`${permission.action} - ${permission.description}`}
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => setOpenRoleDialog(false)}>
          {selectedRole ? 'Update' : 'Create'} Role
        </Button>
      </DialogActions>
    </Dialog>
  );

  const UsersTab = () => (
    <>
      {/* User Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h5">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h5" color="success.main">
                {users.filter(u => u.status === 'Active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Roles Defined
              </Typography>
              <Typography variant="h5">
                {roles.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Permissions
              </Typography>
              <Typography variant="h5">
                {permissions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Users</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateUser}
            >
              Add User
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.branch}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.lastLogin.toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditUser(user)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <VpnKey />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );

  const RolesTab = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Roles & Permissions</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateRole}
          >
            Add Role
          </Button>
        </Box>
        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} key={role.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AdminPanelSettings color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="h6">{role.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleEditRole(role)}>
                        <Edit />
                      </IconButton>
                      {!role.isSystemRole && (
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">
                      <Group sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {role.userCount} users assigned
                    </Typography>
                    {role.isSystemRole && (
                      <Chip label="System Role" size="small" color="secondary" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Permissions: {role.permissions.length === 1 && role.permissions[0] === '*' 
                      ? 'All permissions' 
                      : `${role.permissions.length} specific permissions`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const PermissionsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>System Permissions</Typography>
        {Object.entries(
          permissions.reduce((acc, perm) => {
            if (!acc[perm.module]) acc[perm.module] = [];
            acc[perm.module].push(perm);
            return acc;
          }, {} as Record<string, Permission[]>)
        ).map(([module, modulePermissions]) => (
          <Accordion key={module}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">{module} Module ({modulePermissions.length} permissions)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {modulePermissions.map((permission, index) => (
                  <React.Fragment key={permission.id}>
                    <ListItem>
                      <ListItemText
                        primary={permission.name}
                        secondary={permission.description}
                      />
                      <ListItemSecondaryAction>
                        <Chip label={permission.action} size="small" />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < modulePermissions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management & RBAC
      </Typography>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Users" />
        <Tab label="Roles" />
        <Tab label="Permissions" />
      </Tabs>

      {selectedTab === 0 && <UsersTab />}
      {selectedTab === 1 && <RolesTab />}
      {selectedTab === 2 && <PermissionsTab />}

      <UserDialog />
      <RoleDialog />
    </Box>
  );
};

export default UserManagement;